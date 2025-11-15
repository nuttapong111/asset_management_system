import { Hono } from 'hono';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import pool from '../db/connection';
import { authMiddleware, requireRole } from '../middleware/auth';
import { transformUser } from '../utils/transform';

const users = new Hono();

// All routes require authentication
users.use('/*', authMiddleware);

const createUserSchema = z.object({
  phone: z.string().min(10),
  password: z.string().min(6),
  role: z.enum(['owner', 'tenant', 'admin']),
  name: z.string().min(1),
  email: z.string().email().optional(),
  address: z.object({
    houseNumber: z.string(),
    villageNumber: z.string().optional(),
    street: z.string().optional(),
    subDistrict: z.string(),
    district: z.string(),
    province: z.string(),
    postalCode: z.string(),
  }).optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(10).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  address: z.object({
    houseNumber: z.string(),
    villageNumber: z.string().optional(),
    street: z.string().optional(),
    subDistrict: z.string(),
    district: z.string(),
    province: z.string(),
    postalCode: z.string(),
  }).optional(),
});

// GET /api/users - Get all users (admin only) or owners (admin only)
users.get('/', requireRole('admin'), async (c) => {
  try {
    const role = c.req.query('role'); // Filter by role if provided
    
    let query = 'SELECT * FROM users';
    const params: any[] = [];
    
    if (role && ['owner', 'tenant', 'admin'].includes(role)) {
      query += ' WHERE role = $1';
      params.push(role);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    const users = result.rows.map(transformUser).map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return c.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/users/:id
users.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const currentUser = c.get('user');

    // Users can only view their own profile unless admin
    if (currentUser?.role !== 'admin' && currentUser?.id !== id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    const user = transformUser(result.rows[0]);
    const { password, ...userWithoutPassword } = user;

    return c.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/users - Create user (admin only, for creating owners)
users.post('/', requireRole('admin'), async (c) => {
  try {
    const body = await c.req.json();
    const data = createUserSchema.parse(body);

    // Check if phone already exists
    const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [data.phone]);
    if (existing.rows.length > 0) {
      return c.json({ error: 'Phone number already exists' }, 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const result = await pool.query(
      `INSERT INTO users (phone, password, role, name, email, address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.phone,
        hashedPassword,
        data.role,
        data.name,
        data.email || null,
        data.address ? JSON.stringify(data.address) : null,
      ]
    );

    const user = transformUser(result.rows[0]);
    const { password, ...userWithoutPassword } = user;

    return c.json(userWithoutPassword, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: error.errors }, 400);
    }
    console.error('Create user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PUT /api/users/:id
users.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const currentUser = c.get('user');
    const body = await c.req.json();
    const data = updateUserSchema.parse(body);

    // Users can only update their own profile unless admin
    if (currentUser?.role !== 'admin' && currentUser?.id !== id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Check if phone already exists (excluding current user)
    if (data.phone) {
      const existing = await pool.query(
        'SELECT id FROM users WHERE phone = $1 AND id != $2',
        [data.phone, id]
      );
      if (existing.rows.length > 0) {
        return c.json({ error: 'Phone number already exists' }, 400);
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.phone) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(data.phone);
    }
    if (data.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(data.email || null);
    }
    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updates.push(`password = $${paramIndex++}`);
      values.push(hashedPassword);
    }
    if (data.address) {
      updates.push(`address = $${paramIndex++}`);
      values.push(JSON.stringify(data.address));
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    values.push(id);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    const user = transformUser(result.rows[0]);
    const { password, ...userWithoutPassword } = user;

    return c.json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: error.errors }, 400);
    }
    console.error('Update user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// DELETE /api/users/:id - Delete user (admin only)
users.delete('/:id', requireRole('admin'), async (c) => {
  try {
    const id = c.req.param('id');

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default users;

