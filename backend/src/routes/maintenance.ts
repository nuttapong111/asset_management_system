import { Hono } from 'hono';
import { z } from 'zod';
import pool from '../db/connection';
import { authMiddleware, requireRole } from '../middleware/auth';
import { transformMaintenance } from '../utils/transform';

const maintenance = new Hono();

maintenance.use('/*', authMiddleware);

const createMaintenanceSchema = z.object({
  assetId: z.string().uuid(),
  type: z.enum(['repair', 'routine', 'emergency']),
  title: z.string().min(1),
  description: z.string().min(1),
  cost: z.number().nonnegative().default(0),
  images: z.array(z.string()).optional(),
});

const updateMaintenanceSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  cost: z.number().nonnegative().optional(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  completedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  images: z.array(z.string()).optional(),
});

// GET /api/maintenance - Get maintenance requests (filtered by role)
maintenance.get('/', async (c) => {
  try {
    const user = (c as any).get('user') as { id: string; role: string; name?: string } | undefined;
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let query = `
      SELECT m.*, a.name as asset_name, u.name as reported_by_name
      FROM maintenance m
      LEFT JOIN assets a ON a.id = m.asset_id
      LEFT JOIN users u ON u.id = m.reported_by
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (user.role === 'owner') {
      query += ` WHERE EXISTS (
        SELECT 1 FROM assets WHERE id = m.asset_id AND owner_id = $${paramIndex++}
      )`;
      params.push(user.id);
    } else if (user.role === 'tenant') {
      query += ` WHERE m.reported_by = $${paramIndex++}`;
      params.push(user.id);
    }

    query += ' ORDER BY m.created_at DESC';

    const result = await pool.query(query, params);
    const maintenance = result.rows.map(row =>
      transformMaintenance(row, row.asset_name, row.reported_by_name)
    );

    return c.json(maintenance);
  } catch (error) {
    console.error('Get maintenance error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/maintenance/:id
maintenance.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = (c as any).get('user') as { id: string; role: string; name?: string } | undefined;
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const result = await pool.query(
      `SELECT m.*, a.name as asset_name, a.owner_id, u.name as reported_by_name
       FROM maintenance m
       LEFT JOIN assets a ON a.id = m.asset_id
       LEFT JOIN users u ON u.id = m.reported_by
       WHERE m.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Maintenance request not found' }, 404);
    }

    const row = result.rows[0];

    // Check permissions
    if (user.role === 'owner' && row.owner_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    } else if (user.role === 'tenant' && row.reported_by !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const maintenance = transformMaintenance(row, row.asset_name, row.reported_by_name);
    return c.json(maintenance);
  } catch (error) {
    console.error('Get maintenance error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/maintenance - Create maintenance request (tenant/owner/admin)
maintenance.post('/', async (c) => {
  try {
    const user = (c as any).get('user') as { id: string; role: string; name?: string } | undefined;
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const body = await c.req.json();
    const data = createMaintenanceSchema.parse(body);

    // Verify asset exists
    const assetResult = await pool.query('SELECT id, owner_id FROM assets WHERE id = $1', [data.assetId]);
    if (assetResult.rows.length === 0) {
      return c.json({ error: 'Asset not found' }, 404);
    }

    // For tenants, verify they have active contract
    if (user.role === 'tenant') {
      const contractResult = await pool.query(
        'SELECT id FROM contracts WHERE asset_id = $1 AND tenant_id = $2 AND status = $3',
        [data.assetId, user.id, 'active']
      );
      if (contractResult.rows.length === 0) {
        return c.json({ error: 'You do not have an active contract for this asset' }, 403);
      }
    }

    const result = await pool.query(
      `INSERT INTO maintenance (asset_id, type, title, description, cost, status, reported_by, images)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)
       RETURNING *`,
      [
        data.assetId,
        data.type,
        data.title,
        data.description,
        data.cost,
        user.id,
        data.images || [],
      ]
    );

    // Get asset name
    const assetResult2 = await pool.query('SELECT name FROM assets WHERE id = $1', [data.assetId]);
    const assetName = assetResult2.rows[0]?.name || 'ทรัพย์สิน';
    const userName = user.name;

    const maintenance = transformMaintenance(
      result.rows[0],
      assetName,
      userName
    );

    // Create notification for owner when tenant creates maintenance request
    if (user.role === 'tenant') {
      try {
        const ownerId = assetResult.rows[0].owner_id;
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, related_id, status)
           VALUES ($1, $2, $3, $4, $5, 'unread')`,
          [
            ownerId,
            'maintenance_request',
            'มีการแจ้งซ่อมใหม่',
            `${userName} แจ้งซ่อม: ${data.title} สำหรับ ${assetName}`,
            result.rows[0].id,
          ]
        );
      } catch (notifError) {
        console.error('Error creating maintenance notification:', notifError);
        // Don't fail maintenance creation if notification fails
      }
    }

    return c.json(maintenance, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: error.errors }, 400);
    }
    console.error('Create maintenance error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PUT /api/maintenance/:id - Update maintenance (owner/admin can update status, tenant can only view)
maintenance.put('/:id', requireRole('owner', 'admin'), async (c) => {
  try {
    const id = c.req.param('id');
    const user = (c as any).get('user') as { id: string; role: string; name?: string } | undefined;
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const body = await c.req.json();
    const data = updateMaintenanceSchema.parse(body);

    // Check permission
    const maintenanceResult = await pool.query(
      `SELECT m.*, a.owner_id FROM maintenance m
       INNER JOIN assets a ON a.id = m.asset_id
       WHERE m.id = $1`,
      [id]
    );

    if (maintenanceResult.rows.length === 0) {
      return c.json({ error: 'Maintenance request not found' }, 404);
    }

    if (user.role === 'owner' && maintenanceResult.rows[0].owner_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.cost !== undefined) {
      updates.push(`cost = $${paramIndex++}`);
      values.push(data.cost);
    }
    if (data.scheduledDate) {
      updates.push(`scheduled_date = $${paramIndex++}`);
      values.push(data.scheduledDate);
    }
    if (data.completedDate) {
      updates.push(`completed_date = $${paramIndex++}`);
      values.push(data.completedDate);
    }
    if (data.images) {
      updates.push(`images = $${paramIndex++}`);
      values.push(data.images);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    values.push(id);
    const query = `UPDATE maintenance SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, values);
    const updatedMaintenance = result.rows[0];
    const oldStatus = maintenanceResult.rows[0].status;
    const newStatus = updatedMaintenance.status;

    // Get asset name and tenant info
    const assetResult = await pool.query('SELECT name FROM assets WHERE id = $1', [updatedMaintenance.asset_id]);
    const userResult = await pool.query('SELECT name FROM users WHERE id = $1', [updatedMaintenance.reported_by]);
    
    // Get tenant info if maintenance was reported by tenant
    let tenantId = null;
    if (updatedMaintenance.reported_by) {
      const reportedByUser = await pool.query('SELECT id, role FROM users WHERE id = $1', [updatedMaintenance.reported_by]);
      if (reportedByUser.rows[0]?.role === 'tenant') {
        tenantId = reportedByUser.rows[0].id;
      }
    }

    // Create notification for tenant when owner schedules maintenance
    if (tenantId && (newStatus === 'in_progress' || data.scheduledDate) && oldStatus === 'pending') {
      try {
        const assetName = assetResult.rows[0]?.name || 'ทรัพย์สิน';
        const scheduledDateStr = data.scheduledDate || updatedMaintenance.scheduled_date;
        const scheduledDate = scheduledDateStr ? new Date(scheduledDateStr).toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : null;
        
        let message = `การแจ้งซ่อม "${updatedMaintenance.title}" สำหรับ ${assetName} ถูกรับเรื่องแล้ว`;
        if (scheduledDate) {
          message += ` และนัดหมายเข้าไปซ่อมในวันที่ ${scheduledDate}`;
        }
        
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, related_id, status)
           VALUES ($1, $2, $3, $4, $5, 'unread')`,
          [
            tenantId,
            'maintenance_request',
            'การแจ้งซ่อมถูกรับเรื่อง',
            message,
            id,
          ]
        );
      } catch (notifError) {
        console.error('Error creating maintenance notification:', notifError);
        // Don't fail maintenance update if notification fails
      }
    }

    // Create notification when maintenance is completed
    if (newStatus === 'completed' && oldStatus !== 'completed' && tenantId) {
      try {
        const assetName = assetResult.rows[0]?.name || 'ทรัพย์สิน';
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, related_id, status)
           VALUES ($1, $2, $3, $4, $5, 'unread')`,
          [
            tenantId,
            'maintenance_request',
            'การซ่อมเสร็จสิ้น',
            `การซ่อม "${updatedMaintenance.title}" สำหรับ ${assetName} เสร็จสิ้นแล้ว`,
            id,
          ]
        );
      } catch (notifError) {
        console.error('Error creating completion notification:', notifError);
      }
    }

    const maintenance = transformMaintenance(
      updatedMaintenance,
      assetResult.rows[0]?.name,
      userResult.rows[0]?.name
    );

    return c.json(maintenance);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: error.errors }, 400);
    }
    console.error('Update maintenance error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default maintenance;

