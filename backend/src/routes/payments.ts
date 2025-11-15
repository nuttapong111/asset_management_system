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
  status: z.enum(['pending', 'paid', 'overdue']).optional(),
  paidDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  proofImages: z.array(z.string()).optional(),
});

// GET /api/payments - Get payments (filtered by role)
payments.get('/', async (c) => {
  try {
    const user = c.get('user');
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
    const user = c.get('user');
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
    const user = c.get('user');
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
    const user = c.get('user');
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

    // Tenants can only update proofImages, owners can update status
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.proofImages && (user.role === 'tenant' || user.role === 'admin')) {
      updates.push(`proof_images = $${paramIndex++}`);
      values.push(data.proofImages);
    }

    if (data.status && (user.role === 'owner' || user.role === 'admin')) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
      if (data.status === 'paid' && data.paidDate) {
        updates.push(`paid_date = $${paramIndex++}`);
        values.push(data.paidDate);
      }
    } else if (data.paidDate && (user.role === 'owner' || user.role === 'admin')) {
      updates.push(`paid_date = $${paramIndex++}`);
      values.push(data.paidDate);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    values.push(id);
    const query = `UPDATE payments SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, values);
    const payment = transformPayment(result.rows[0]);

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

