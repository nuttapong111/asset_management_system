import { Hono } from 'hono';
import pool from '../db/connection';
import { authMiddleware, requireRole } from '../middleware/auth';

const admin = new Hono();

admin.use('/*', authMiddleware);
admin.use('/*', requireRole('admin'));

// GET /api/admin/summary - Get admin summary stats
admin.get('/summary', async (c) => {
  try {
    // Total owners
    const ownersResult = await pool.query(
      "SELECT COUNT(*) as total FROM users WHERE role = 'owner'"
    );
    const totalOwners = parseInt(ownersResult.rows[0]?.total || 0);

    // Total tenants
    const tenantsResult = await pool.query(
      "SELECT COUNT(*) as total FROM users WHERE role = 'tenant'"
    );
    const totalTenants = parseInt(tenantsResult.rows[0]?.total || 0);

    // Total assets
    const assetsResult = await pool.query('SELECT COUNT(*) as total FROM assets');
    const totalAssets = parseInt(assetsResult.rows[0]?.total || 0);

    // User activity by hour (mock data for now - can be enhanced with actual activity logs)
    const userActivity = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: Math.floor(Math.random() * 50) + 10, // Mock data
    }));

    return c.json({
      totalOwners,
      totalTenants,
      totalAssets,
      userActivity,
    });
  } catch (error) {
    console.error('Get admin summary error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default admin;

