import { Hono } from 'hono';
import { z } from 'zod';
import pool from '../db/connection';
import { authMiddleware, requireRole } from '../middleware/auth';
import { transformAsset } from '../utils/transform';

const assets = new Hono();

// All routes require authentication
assets.use('/*', authMiddleware);

const createAssetSchema = z.object({
  type: z.enum(['house', 'condo', 'apartment', 'land']),
  name: z.string().min(1),
  address: z.string().min(1),
  district: z.string().min(1),
  amphoe: z.string().optional().default(''), // Allow empty string, will default to empty if not provided
  province: z.string().min(1),
  postalCode: z.string().min(5),
  size: z.number().positive(),
  rooms: z.number().int().min(0),
  purchasePrice: z.number().positive(),
  currentValue: z.number().positive(),
  status: z.enum(['available', 'rented', 'maintenance']),
  images: z.array(z.string()).optional(),
  documents: z.array(z.string()).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  description: z.string().optional(),
  parentAssetId: z.string().uuid().optional(),
  isParent: z.boolean().default(false),
  unitNumber: z.string().optional(),
  totalUnits: z.number().int().optional(),
  developmentHistory: z.array(z.any()).optional(),
});

const updateAssetSchema = createAssetSchema.partial();

// GET /api/assets - Get assets (filtered by role)
assets.get('/', async (c) => {
  try {
    const user = (c as any).get('user') as { id: string; role: string } | undefined;
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let query = 'SELECT * FROM assets';
    const params: any[] = [];
    let paramIndex = 1;

    // Filter by role
    if (user.role === 'owner') {
      query += ` WHERE owner_id = $${paramIndex++}`;
      params.push(user.id);
    } else if (user.role === 'tenant') {
      // Tenants see only assets they rent
      query = `
        SELECT DISTINCT a.* FROM assets a
        INNER JOIN contracts c ON c.asset_id = a.id
        WHERE c.tenant_id = $${paramIndex++} AND c.status = 'active'
      `;
      params.push(user.id);
    }
    // Admin sees all assets

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    const assets = result.rows.map(transformAsset);

    return c.json(assets);
  } catch (error) {
    console.error('Get assets error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/assets/:id
assets.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = (c as any).get('user') as { id: string; role: string } | undefined;
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const result = await pool.query('SELECT * FROM assets WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return c.json({ error: 'Asset not found' }, 404);
    }

    const asset = transformAsset(result.rows[0]);

    // Check permissions
    if (user.role === 'owner' && asset.ownerId !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    } else if (user.role === 'tenant') {
      // Check if tenant has active contract for this asset
      const contractResult = await pool.query(
        'SELECT id FROM contracts WHERE asset_id = $1 AND tenant_id = $2 AND status = $3',
        [id, user.id, 'active']
      );
      if (contractResult.rows.length === 0) {
        return c.json({ error: 'Forbidden' }, 403);
      }
    }

    return c.json(asset);
  } catch (error) {
    console.error('Get asset error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/assets - Create asset (owner/admin only)
assets.post('/', requireRole('owner', 'admin'), async (c) => {
  try {
    const user = (c as any).get('user') as { id: string; role: string } | undefined;
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const body = await c.req.json();
    const data = createAssetSchema.parse(body);

    // Determine owner_id
    const ownerId = user.role === 'admin' && body.ownerId ? body.ownerId : user.id;

    const result = await pool.query(
      `INSERT INTO assets (
        owner_id, type, name, address, district, amphoe, province, postal_code,
        size, rooms, purchase_price, current_value, status,
        images, documents, latitude, longitude, description,
        parent_asset_id, is_parent, child_assets, unit_number, total_units, development_history
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
      ) RETURNING *`,
      [
        ownerId,
        data.type,
        data.name,
        data.address,
        data.district,
        data.amphoe || '', // Ensure it's not null or undefined
        data.province,
        data.postalCode,
        data.size,
        data.rooms,
        data.purchasePrice,
        data.currentValue,
        data.status,
        data.images || [],
        data.documents || [],
        data.latitude || null,
        data.longitude || null,
        data.description || null,
        data.parentAssetId || null,
        data.isParent,
        [], // child_assets - not provided in schema, always empty array
        data.unitNumber || null,
        data.totalUnits || null,
        data.developmentHistory ? JSON.stringify(data.developmentHistory) : null,
      ]
    );

    const asset = transformAsset(result.rows[0]);
    return c.json(asset, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: error.errors }, 400);
    }
    console.error('Create asset error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack });
    return c.json({ 
      error: 'Internal server error', 
      details: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
    }, 500);
  }
});

// PUT /api/assets/:id - Update asset (owner/admin only)
assets.put('/:id', requireRole('owner', 'admin'), async (c) => {
  try {
    const id = c.req.param('id');
    const user = (c as any).get('user') as { id: string; role: string } | undefined;
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const body = await c.req.json();
    const data = updateAssetSchema.parse(body);

    // Check if asset exists and user has permission
    const assetResult = await pool.query('SELECT owner_id FROM assets WHERE id = $1', [id]);
    if (assetResult.rows.length === 0) {
      return c.json({ error: 'Asset not found' }, 404);
    }

    if (user.role === 'owner' && assetResult.rows[0].owner_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (key === 'parentAssetId') updates.push(`parent_asset_id = $${paramIndex++}`);
        else if (key === 'isParent') updates.push(`is_parent = $${paramIndex++}`);
        else if (key === 'postalCode') updates.push(`postal_code = $${paramIndex++}`);
        else if (key === 'purchasePrice') updates.push(`purchase_price = $${paramIndex++}`);
        else if (key === 'currentValue') updates.push(`current_value = $${paramIndex++}`);
        else if (key === 'unitNumber') updates.push(`unit_number = $${paramIndex++}`);
        else if (key === 'totalUnits') updates.push(`total_units = $${paramIndex++}`);
        else if (key === 'developmentHistory') updates.push(`development_history = $${paramIndex++}`);
        else updates.push(`${dbKey} = $${paramIndex++}`);

        if (key === 'developmentHistory') {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      }
    });

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    values.push(id);
    const query = `UPDATE assets SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, values);
    const asset = transformAsset(result.rows[0]);

    return c.json(asset);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: error.errors }, 400);
    }
    console.error('Update asset error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// DELETE /api/assets/:id - Delete asset (owner/admin only)
assets.delete('/:id', requireRole('owner', 'admin'), async (c) => {
  try {
    const id = c.req.param('id');
    const user = (c as any).get('user') as { id: string; role: string } | undefined;
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const assetResult = await pool.query('SELECT owner_id FROM assets WHERE id = $1', [id]);
    if (assetResult.rows.length === 0) {
      return c.json({ error: 'Asset not found' }, 404);
    }

    if (user.role === 'owner' && assetResult.rows[0].owner_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    await pool.query('DELETE FROM assets WHERE id = $1', [id]);

    return c.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Delete asset error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default assets;

