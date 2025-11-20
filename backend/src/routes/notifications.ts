import { Hono } from 'hono';
import pool from '../db/connection';
import { authMiddleware } from '../middleware/auth';
import { transformNotification } from '../utils/transform';

const notifications = new Hono();

notifications.use('/*', authMiddleware);

// GET /api/notifications - Get user unread notifications only
notifications.get('/', async (c) => {
  try {
    const user = (c as any).get('user') as { id: string; role: string } | undefined;
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Only get unread notifications for this user
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 AND status = 'unread' 
       ORDER BY created_at DESC`,
      [user.id]
    );

    const notifications = result.rows.map(transformNotification);
    return c.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/notifications/unread-count
notifications.get('/unread-count', async (c) => {
  try {
    const user = (c as any).get('user') as { id: string; role: string } | undefined;
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const result = await pool.query(
      "SELECT COUNT(*) as total FROM notifications WHERE user_id = $1 AND status = 'unread'",
      [user.id]
    );

    return c.json({ count: parseInt(result.rows[0]?.total || 0) });
  } catch (error) {
    console.error('Get unread count error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
notifications.put('/:id/read', async (c) => {
  try {
    const id = c.req.param('id');
    const user = (c as any).get('user') as { id: string; role: string } | undefined;
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const result = await pool.query(
      'UPDATE notifications SET status = $1, read_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
      ['read', id, user.id]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    const notification = transformNotification(result.rows[0]);
    return c.json(notification);
  } catch (error) {
    console.error('Mark notification read error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default notifications;

