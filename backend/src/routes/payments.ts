import { Hono } from 'hono';
import { z } from 'zod';
import pool from '../db/connection';
import { authMiddleware, requireRole } from '../middleware/auth';
import { transformPayment } from '../utils/transform';

const payments = new Hono();

payments.use('/*', authMiddleware);

const createPaymentSchema = z.object({
  contractId: z.string().uuid(),
  amount: z.number().positive(),
  type: z.enum(['rent', 'deposit', 'utility', 'other']),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const updatePaymentSchema = z.object({
  status: z.enum(['pending', 'waiting_approval', 'paid', 'overdue']).optional(),
  paidDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  receiptDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  paymentMethod: z.string().optional(),
  proofImages: z.array(z.string()).optional(),
  rejectionReason: z.string().optional(),
});

// GET /api/payments - Get payments (filtered by role)
payments.get('/', async (c) => {
  try {
    const user = (c as any).get('user') as { id: string; role: string } | undefined;
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let query = `
      SELECT p.* FROM payments p
      INNER JOIN contracts c ON c.id = p.contract_id
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (user.role === 'owner') {
      query += `
        INNER JOIN assets a ON a.id = c.asset_id
        WHERE a.owner_id = $${paramIndex++}
      `;
      params.push(user.id);
    } else if (user.role === 'tenant') {
      query += ` WHERE c.tenant_id = $${paramIndex++}`;
      params.push(user.id);
    }

    query += ' ORDER BY p.due_date DESC';

    const result = await pool.query(query, params);
    const payments = result.rows.map(transformPayment);

    return c.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/payments/:id
payments.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = (c as any).get('user') as { id: string; role: string } | undefined;
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const result = await pool.query(
      `SELECT p.*, c.tenant_id, a.owner_id
       FROM payments p
       INNER JOIN contracts c ON c.id = p.contract_id
       INNER JOIN assets a ON a.id = c.asset_id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Payment not found' }, 404);
    }

    const row = result.rows[0];

    // Check permissions
    if (user.role === 'owner' && row.owner_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    } else if (user.role === 'tenant' && row.tenant_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const payment = transformPayment(row);
    return c.json(payment);
  } catch (error) {
    console.error('Get payment error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/payments - Create payment (owner/admin only)
payments.post('/', requireRole('owner', 'admin'), async (c) => {
  try {
    const user = (c as any).get('user') as { id: string; role: string } | undefined;
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const body = await c.req.json();
    const data = createPaymentSchema.parse(body);

    // Verify contract exists and user has permission
    const contractResult = await pool.query(
      `SELECT c.*, a.owner_id FROM contracts c
       INNER JOIN assets a ON a.id = c.asset_id
       WHERE c.id = $1`,
      [data.contractId]
    );

    if (contractResult.rows.length === 0) {
      return c.json({ error: 'Contract not found' }, 404);
    }

    if (user.role === 'owner' && contractResult.rows[0].owner_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const result = await pool.query(
      `INSERT INTO payments (contract_id, amount, type, due_date, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [data.contractId, data.amount, data.type, data.dueDate]
    );

    const payment = transformPayment(result.rows[0]);

    // Create notification for tenant when new payment is created
    try {
      const contract = contractResult.rows[0];
      const assetResult = await pool.query('SELECT name FROM assets WHERE id = (SELECT asset_id FROM contracts WHERE id = $1)', [data.contractId]);
      const assetName = assetResult.rows[0]?.name || 'ทรัพย์สิน';
      
      const dueDate = new Date(data.dueDate).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, related_id, status)
         VALUES ($1, $2, $3, $4, $5, 'unread')`,
        [
          contract.tenant_id,
          'payment_due',
          'มีรายการชำระเงินใหม่',
          `มีรายการชำระเงินจำนวน ${Number(data.amount).toLocaleString('th-TH')} บาท สำหรับ ${assetName} กำหนดชำระวันที่ ${dueDate}`,
          payment.id,
        ]
      );
    } catch (notifError) {
      console.error('Error creating payment notification:', notifError);
      // Don't fail payment creation if notification fails
    }

    return c.json(payment, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: error.errors }, 400);
    }
    console.error('Create payment error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PUT /api/payments/:id - Update payment (owner can approve, tenant can upload proof)
payments.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = (c as any).get('user') as { id: string; role: string } | undefined;
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const body = await c.req.json();
    const data = updatePaymentSchema.parse(body);

    // Get payment with contract and asset info
    const paymentResult = await pool.query(
      `SELECT p.*, c.tenant_id, a.owner_id
       FROM payments p
       INNER JOIN contracts c ON c.id = p.contract_id
       INNER JOIN assets a ON a.id = c.asset_id
       WHERE p.id = $1`,
      [id]
    );

    if (paymentResult.rows.length === 0) {
      return c.json({ error: 'Payment not found' }, 404);
    }

    const row = paymentResult.rows[0];

    // Check permissions
    if (user.role === 'tenant' && row.tenant_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    } else if (user.role === 'owner' && row.owner_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Tenants can update proofImages and set status to waiting_approval, owners can update status
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.proofImages && (user.role === 'tenant' || user.role === 'admin')) {
      updates.push(`proof_images = $${paramIndex++}`);
      values.push(data.proofImages);
    }

    if (data.status) {
      // Tenants can only set status to waiting_approval, owners/admins can set any status
      if (user.role === 'tenant' && data.status !== 'waiting_approval') {
        return c.json({ error: 'Tenants can only set status to waiting_approval' }, 403);
      }
      
      if (user.role === 'owner' || user.role === 'admin' || (user.role === 'tenant' && data.status === 'waiting_approval')) {
        updates.push(`status = $${paramIndex++}`);
        values.push(data.status);
        if (data.status === 'paid') {
          // Set paid_date (use provided date or today)
          const paidDate = data.paidDate || new Date().toISOString().split('T')[0];
          updates.push(`paid_date = $${paramIndex++}`);
          values.push(paidDate);
          
          // Generate receipt number when payment is approved (status = 'paid')
          // Format: Year/Sequential Number (same as contract number, per owner)
          if (!row.receipt_number) {
            const currentYear = new Date().getFullYear() + 543; // Convert to Buddhist Era
            const yearStart = new Date(`${currentYear - 543}-01-01`);
            const yearEnd = new Date(`${currentYear - 543}-12-31`);
            
            // Count receipts for this owner in the current year
            const receiptCountResult = await pool.query(
              `SELECT COUNT(*) as count 
               FROM payments p
               INNER JOIN contracts c ON c.id = p.contract_id
               INNER JOIN assets a ON a.id = c.asset_id
               WHERE a.owner_id = $1 
                 AND p.receipt_number IS NOT NULL
                 AND p.paid_date >= $2 
                 AND p.paid_date <= $3`,
              [row.owner_id, yearStart, yearEnd]
            );
            
            const receiptCount = parseInt(receiptCountResult.rows[0]?.count || '0');
            const receiptNumber = `${currentYear}/${String(receiptCount + 1).padStart(2, '0')}`;
            
            updates.push(`receipt_number = $${paramIndex++}`);
            values.push(receiptNumber);
          }
        }
      }
    } else if (data.paidDate && (user.role === 'owner' || user.role === 'admin')) {
      updates.push(`paid_date = $${paramIndex++}`);
      values.push(data.paidDate);
    }

    // Handle rejection reason (when status is changed to pending from waiting_approval)
    if (data.rejectionReason !== undefined && (user.role === 'owner' || user.role === 'admin')) {
      updates.push(`rejection_reason = $${paramIndex++}`);
      values.push(data.rejectionReason || null);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    values.push(id);
    const query = `UPDATE payments SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, values);
    const payment = transformPayment(result.rows[0]);

    // If tenant uploaded proof images, notify owner
    if (data.proofImages && user.role === 'tenant' && row.tenant_id === user.id) {
      try {
        // Get asset and tenant info for notification
        const assetResult = await pool.query('SELECT name FROM assets WHERE id = (SELECT asset_id FROM contracts WHERE id = $1)', [row.contract_id]);
        const tenantResult = await pool.query('SELECT name FROM users WHERE id = $1', [row.tenant_id]);
        
        const assetName = assetResult.rows[0]?.name || 'ทรัพย์สิน';
        const tenantName = tenantResult.rows[0]?.name || 'ผู้เช่า';
        
        // Create notification for owner
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, related_id, status)
           VALUES ($1, $2, $3, $4, $5, 'unread')`,
          [
            row.owner_id,
            'payment_proof',
            'มีหลักฐานการชำระเงินใหม่',
            `ผู้เช่า ${tenantName} ได้แนบหลักฐานการชำระเงินจำนวน ${Number(row.amount).toLocaleString('th-TH')} บาท สำหรับ ${assetName}`,
            id,
          ]
        );
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
        // Don't fail payment update if notification fails
      }
    }

    // If payment is rejected (status changed to pending from waiting_approval), notify tenant
    if (data.status === 'pending' && row.status === 'waiting_approval' && (user.role === 'owner' || user.role === 'admin')) {
      try {
        // Get asset and owner info for notification
        const assetResult = await pool.query('SELECT name FROM assets WHERE id = (SELECT asset_id FROM contracts WHERE id = $1)', [row.contract_id]);
        const ownerResult = await pool.query('SELECT name FROM users WHERE id = $1', [row.owner_id]);
        
        const assetName = assetResult.rows[0]?.name || 'ทรัพย์สิน';
        const ownerName = ownerResult.rows[0]?.name || 'เจ้าของ';
        const rejectionReason = data.rejectionReason ? `\nเหตุผล: ${data.rejectionReason}` : '';
        
        // Create notification for tenant
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, related_id, status)
           VALUES ($1, $2, $3, $4, $5, 'unread')`,
          [
            row.tenant_id,
            'payment_rejected',
            'การชำระเงินถูกปฏิเสธ',
            `การชำระเงินจำนวน ${Number(row.amount).toLocaleString('th-TH')} บาท สำหรับ ${assetName} ถูกปฏิเสธโดย ${ownerName}${rejectionReason}`,
            id,
          ]
        );
      } catch (notifError) {
        console.error('Error creating rejection notification:', notifError);
        // Don't fail payment update if notification fails
      }
    }

    return c.json(payment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: error.errors }, 400);
    }
    console.error('Update payment error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default payments;

