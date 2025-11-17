import { Hono } from 'hono';
import pool from '../db/connection';
import { authMiddleware } from '../middleware/auth';

const dashboard = new Hono();

dashboard.use('/*', authMiddleware);

// GET /api/dashboard - Get dashboard stats (filtered by role)
dashboard.get('/', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let stats: any = {};

    if (user.role === 'owner' || user.role === 'admin') {
      // Owner/Admin stats
      let assetQuery = 'SELECT COUNT(*) as total, status FROM assets';
      const assetParams: any[] = [];
      let paramIndex = 1;

      if (user.role === 'owner') {
        assetQuery += ` WHERE owner_id = $${paramIndex++}`;
        assetParams.push(user.id);
      }

      assetQuery += ' GROUP BY status';

      const assetResult = await pool.query(assetQuery, assetParams);
      const totalAssets = assetResult.rows.reduce((sum, row) => sum + parseInt(row.total), 0);
      const assetsByStatus = {
        available: 0,
        rented: 0,
        maintenance: 0,
      };
      assetResult.rows.forEach(row => {
        assetsByStatus[row.status as keyof typeof assetsByStatus] = parseInt(row.total);
      });

      // Contracts
      let contractQuery = `
        SELECT COUNT(*) as total, c.status FROM contracts c
        INNER JOIN assets a ON a.id = c.asset_id
      `;
      const contractParams: any[] = [];
      paramIndex = 1;

      if (user.role === 'owner') {
        contractQuery += ` WHERE a.owner_id = $${paramIndex++}`;
        contractParams.push(user.id);
      }

      contractQuery += ' GROUP BY c.status';

      const contractResult = await pool.query(contractQuery, contractParams);
      const totalContracts = contractResult.rows.reduce((sum, row) => sum + parseInt(row.total), 0);

      // Payments
      let paymentQuery = `
        SELECT COUNT(*) as total, p.status, SUM(p.amount) as total_amount
        FROM payments p
        INNER JOIN contracts c ON c.id = p.contract_id
        INNER JOIN assets a ON a.id = c.asset_id
      `;
      const paymentParams: any[] = [];
      paramIndex = 1;

      if (user.role === 'owner') {
        paymentQuery += ` WHERE a.owner_id = $${paramIndex}`;
        paymentParams.push(user.id);
        paramIndex++;
      }

      paymentQuery += ' GROUP BY p.status';

      const paymentResult = await pool.query(paymentQuery, paymentParams);
      const paidCount = paymentResult.rows.find(r => r.status === 'paid')?.total || '0';
      const overdueCount = paymentResult.rows.find(r => r.status === 'overdue')?.total || '0';

      // Monthly income from active contracts
      let incomeQuery = `
        SELECT SUM(rent_amount) as monthly_income
        FROM contracts c
        INNER JOIN assets a ON a.id = c.asset_id
        WHERE c.status = 'active'
      `;
      const incomeParams: any[] = [];
      paramIndex = 1;

      if (user.role === 'owner') {
        incomeQuery += ` AND a.owner_id = $${paramIndex++}`;
        incomeParams.push(user.id);
      }

      const incomeResult = await pool.query(incomeQuery, incomeParams);
      const monthlyIncome = parseFloat(incomeResult.rows[0]?.monthly_income || 0);

      // Maintenance
      let maintenanceQuery = `
        SELECT COUNT(*) as total FROM maintenance m
        INNER JOIN assets a ON a.id = m.asset_id
        WHERE m.status IN ('pending', 'in_progress')
      `;
      const maintenanceParams: any[] = [];
      paramIndex = 1;

      if (user.role === 'owner') {
        maintenanceQuery += ` AND a.owner_id = $${paramIndex++}`;
        maintenanceParams.push(user.id);
      }

      const maintenanceResult = await pool.query(maintenanceQuery, maintenanceParams);
      const pendingMaintenance = parseInt(maintenanceResult.rows[0]?.total || 0);

      stats = {
        totalAssets,
        totalContracts,
        monthlyIncome,
        pendingMaintenance,
        assetsByStatus,
        paidCount: parseInt(paidCount),
        overdueCount: parseInt(overdueCount),
      };
    } else if (user.role === 'tenant') {
      // Tenant stats
      const contractResult = await pool.query(
        'SELECT COUNT(*) as total FROM contracts WHERE tenant_id = $1 AND status = $2',
        [user.id, 'active']
      );
      const totalContracts = parseInt(contractResult.rows[0]?.total || 0);

      const paymentResult = await pool.query(
        `SELECT COUNT(*) as total, status FROM payments p
         INNER JOIN contracts c ON c.id = p.contract_id
         WHERE c.tenant_id = $1
         GROUP BY status`,
        [user.id]
      );
      const pendingPayments = paymentResult.rows.find(r => r.status === 'pending')?.total || 0;
      const overduePayments = paymentResult.rows.find(r => r.status === 'overdue')?.total || 0;

      const maintenanceResult = await pool.query(
        'SELECT COUNT(*) as total FROM maintenance WHERE reported_by = $1 AND status IN ($2, $3)',
        [user.id, 'pending', 'in_progress']
      );
      const pendingMaintenance = parseInt(maintenanceResult.rows[0]?.total || 0);

      stats = {
        totalContracts,
        pendingPayments: parseInt(pendingPayments),
        overduePayments: parseInt(overduePayments),
        pendingMaintenance,
      };
    }

    return c.json(stats);
  } catch (error: any) {
    console.error('Get dashboard error:', error);
    console.error('Error stack:', error?.stack);
    return c.json({ error: 'Internal server error', details: error?.message }, 500);
  }
});

export default dashboard;

