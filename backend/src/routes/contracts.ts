import { Hono } from 'hono';
import { z } from 'zod';
import pool from '../db/connection';
import { authMiddleware, requireRole } from '../middleware/auth';
import { transformContract } from '../utils/transform';
import { generateMonthlyPayments } from '../utils/paymentGenerator';

const contracts = new Hono();

contracts.use('/*', authMiddleware);

const createContractSchema = z.object({
  assetId: z.string().uuid(),
  tenantId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rentAmount: z.number().positive(),
  deposit: z.number().nonnegative(),
  insurance: z.number().nonnegative(),
  status: z.enum(['active', 'expired', 'terminated', 'pending']).default('pending'),
  documents: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const updateContractSchema = createContractSchema.partial();

// GET /api/contracts - Get contracts (filtered by role)
contracts.get('/', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let query = `
      SELECT c.*, a.name as asset_name, u.name as tenant_name
      FROM contracts c
      LEFT JOIN assets a ON a.id = c.asset_id
      LEFT JOIN users u ON u.id = c.tenant_id
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (user.role === 'owner') {
      query += ` WHERE EXISTS (
        SELECT 1 FROM assets WHERE id = c.asset_id AND owner_id = $${paramIndex++}
      )`;
      params.push(user.id);
    } else if (user.role === 'tenant') {
      query += ` WHERE c.tenant_id = $${paramIndex++}`;
      params.push(user.id);
    }

    query += ' ORDER BY c.created_at DESC';

    const result = await pool.query(query, params);
    const contracts = result.rows.map(row =>
      transformContract(row, row.asset_name, row.tenant_name)
    );

    return c.json(contracts);
  } catch (error) {
    console.error('Get contracts error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/contracts/:id
contracts.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const result = await pool.query(
      `SELECT c.*, a.name as asset_name, u.name as tenant_name, a.owner_id
       FROM contracts c
       LEFT JOIN assets a ON a.id = c.asset_id
       LEFT JOIN users u ON u.id = c.tenant_id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Contract not found' }, 404);
    }

    const row = result.rows[0];

    // Check permissions
    if (user.role === 'owner' && row.owner_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    } else if (user.role === 'tenant' && row.tenant_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const contract = transformContract(row, row.asset_name, row.tenant_name);
    return c.json(contract);
  } catch (error) {
    console.error('Get contract error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/contracts - Create contract (owner/admin only)
contracts.post('/', requireRole('owner', 'admin'), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const data = createContractSchema.parse(body);

    // Verify asset exists and user has permission
    const assetResult = await pool.query('SELECT owner_id FROM assets WHERE id = $1', [data.assetId]);
    if (assetResult.rows.length === 0) {
      return c.json({ error: 'Asset not found' }, 404);
    }

    const ownerId = user.role === 'admin' ? assetResult.rows[0].owner_id : user.id;
    
    if (user.role === 'owner' && assetResult.rows[0].owner_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Verify tenant exists
    const tenantResult = await pool.query('SELECT id, role FROM users WHERE id = $1', [data.tenantId]);
    if (tenantResult.rows.length === 0) {
      return c.json({ error: 'Tenant not found' }, 404);
    }
    if (tenantResult.rows[0].role !== 'tenant') {
      return c.json({ error: 'User is not a tenant' }, 400);
    }

    // Generate contract number: ปี/รันเลข (e.g., 2568/01)
    const currentYear = new Date().getFullYear() + 543; // Convert to Buddhist Era
    const yearStart = new Date(`${currentYear - 543}-01-01`);
    const yearEnd = new Date(`${currentYear - 543}-12-31`);
    
    // Count contracts for this owner in the current year (only those with contract_number)
    const countResult = await pool.query(
      `SELECT COUNT(*) as count 
       FROM contracts c
       INNER JOIN assets a ON a.id = c.asset_id
       WHERE a.owner_id = $1 
         AND c.contract_number IS NOT NULL
         AND c.created_at >= $2 
         AND c.created_at <= $3`,
      [ownerId, yearStart, yearEnd]
    );
    
    const contractCount = parseInt(countResult.rows[0]?.count || '0');
    const contractNumber = `${currentYear}/${String(contractCount + 1).padStart(2, '0')}`;

    const result = await pool.query(
      `INSERT INTO contracts (
        contract_number, asset_id, tenant_id, start_date, end_date,
        rent_amount, deposit, insurance, status, documents, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        contractNumber,
        data.assetId,
        data.tenantId,
        data.startDate,
        data.endDate,
        data.rentAmount,
        data.deposit,
        data.insurance,
        data.status,
        data.documents || [],
        data.notes || null,
      ]
    );

    // Update asset status to 'rented' if contract is active
    // If contract is active, it means the asset should be marked as rented
    if (data.status === 'active') {
      await pool.query(
        'UPDATE assets SET status = $1 WHERE id = $2',
        ['rented', data.assetId]
      );
      
      // Generate monthly payment records (20 days before each month)
      // First payment: advance rent + deposit (due on contract creation date)
      // Subsequent payments: monthly rent (starting from month 2)
      const contractCreatedAt = result.rows[0].created_at.toISOString().split('T')[0];
      try {
        await generateMonthlyPayments(
          result.rows[0].id,
          data.startDate,
          data.endDate,
          data.rentAmount,
          data.deposit,
          data.insurance,
          contractCreatedAt
        );
      } catch (error) {
        console.error('Error generating payments:', error);
        // Don't fail contract creation if payment generation fails
      }
    }

    // Get asset and tenant names
    const assetResult2 = await pool.query('SELECT name FROM assets WHERE id = $1', [data.assetId]);
    const tenantResult2 = await pool.query('SELECT name FROM users WHERE id = $1', [data.tenantId]);

    const contract = transformContract(
      result.rows[0],
      assetResult2.rows[0]?.name,
      tenantResult2.rows[0]?.name
    );

    return c.json(contract, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: error.errors }, 400);
    }
    console.error('Create contract error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PUT /api/contracts/:id - Update contract (owner/admin only)
contracts.put('/:id', requireRole('owner', 'admin'), async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const body = await c.req.json();
    const data = updateContractSchema.parse(body);

    // Check permission
    const contractResult = await pool.query(
      `SELECT c.*, a.owner_id FROM contracts c
       LEFT JOIN assets a ON a.id = c.asset_id
       WHERE c.id = $1`,
      [id]
    );

    if (contractResult.rows.length === 0) {
      return c.json({ error: 'Contract not found' }, 404);
    }

    if (user.role === 'owner' && contractResult.rows[0].owner_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.assetId) {
      updates.push(`asset_id = $${paramIndex++}`);
      values.push(data.assetId);
    }
    if (data.tenantId) {
      updates.push(`tenant_id = $${paramIndex++}`);
      values.push(data.tenantId);
    }
    if (data.startDate) {
      updates.push(`start_date = $${paramIndex++}`);
      values.push(data.startDate);
    }
    if (data.endDate) {
      updates.push(`end_date = $${paramIndex++}`);
      values.push(data.endDate);
    }
    if (data.rentAmount !== undefined) {
      updates.push(`rent_amount = $${paramIndex++}`);
      values.push(data.rentAmount);
    }
    if (data.deposit !== undefined) {
      updates.push(`deposit = $${paramIndex++}`);
      values.push(data.deposit);
    }
    if (data.insurance !== undefined) {
      updates.push(`insurance = $${paramIndex++}`);
      values.push(data.insurance);
    }
    if (data.status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.documents) {
      updates.push(`documents = $${paramIndex++}`);
      values.push(data.documents);
    }
    if (data.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(data.notes || null);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    values.push(id);
    const query = `UPDATE contracts SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, values);
    const contractRow = result.rows[0];

    // Update asset status based on contract status
    const today = new Date().toISOString().split('T')[0];
    
    const finalStartDate = data.startDate || contractRow.start_date.toISOString().split('T')[0];
    const finalEndDate = data.endDate || contractRow.end_date.toISOString().split('T')[0];
    const finalRentAmount = data.rentAmount !== undefined ? data.rentAmount : Number(contractRow.rent_amount);
    const finalStatus = data.status || contractRow.status;
    
    if (finalStatus === 'active') {
      // Set asset to 'rented' if contract becomes active and within date range
      if (finalStartDate <= today && finalEndDate >= today) {
        await pool.query(
          'UPDATE assets SET status = $1 WHERE id = $2',
          ['rented', contractRow.asset_id]
        );
      }
      
      // Generate monthly payment records if contract becomes active or dates/amount changed
      // First payment: advance rent + insurance
      // Subsequent payments: monthly rent (starting from month 2)
      const finalDeposit = data.deposit !== undefined ? data.deposit : Number(contractRow.deposit);
      const finalInsurance = data.insurance !== undefined ? data.insurance : Number(contractRow.insurance);
      const contractCreatedAt = contractRow.created_at.toISOString().split('T')[0];
      if (data.status === 'active' || data.startDate || data.endDate || data.rentAmount !== undefined || data.deposit !== undefined || data.insurance !== undefined) {
        try {
          await generateMonthlyPayments(
            id,
            finalStartDate,
            finalEndDate,
            finalRentAmount,
            finalDeposit,
            finalInsurance,
            contractCreatedAt
          );
        } catch (error) {
          console.error('Error generating payments:', error);
          // Don't fail contract update if payment generation fails
        }
      }
    } else if (data.status === 'terminated' || data.status === 'expired') {
      // Set asset to 'available' if contract is terminated or expired
      // Check if there are other active contracts within date range for this asset
      const activeContractsResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM contracts 
         WHERE asset_id = $1 
           AND status = 'active' 
           AND id != $3
           AND start_date <= $2
           AND end_date >= $2`,
        [contractRow.asset_id, today, id]
      );
      const activeContractsCount = parseInt(activeContractsResult.rows[0]?.count || '0');
      
      if (activeContractsCount === 0) {
        await pool.query(
          'UPDATE assets SET status = $1 WHERE id = $2',
          ['available', contractRow.asset_id]
        );
      }
    }

    // Get asset and tenant names
    const assetResult = await pool.query('SELECT name FROM assets WHERE id = $1', [contractRow.asset_id]);
    const tenantResult = await pool.query('SELECT name FROM users WHERE id = $1', [contractRow.tenant_id]);

    const contract = transformContract(
      contractRow,
      assetResult.rows[0]?.name,
      tenantResult.rows[0]?.name
    );

    return c.json(contract);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: error.errors }, 400);
    }
    console.error('Update contract error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default contracts;

