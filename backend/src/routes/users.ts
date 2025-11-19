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
  currentPassword: z.string().optional(),
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

// GET /api/users - Get users based on role
// - Admin: can get all users or filter by role
// - Owner: can only get tenants (for creating contracts)
// - Tenant: cannot access this endpoint
users.get('/', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const role = c.req.query('role'); // Filter by role if provided
    
    let query = 'SELECT * FROM users';
    const params: any[] = [];
    let paramIndex = 1;
    
    // Admin can get all users or filter by any role
    if (user.role === 'admin') {
      if (role && ['owner', 'tenant', 'admin'].includes(role)) {
        query += ` WHERE role = $${paramIndex++}`;
        params.push(role);
      }
    }
    // Owner can only get tenants that they created
    else if (user.role === 'owner') {
      query += ` WHERE role = $${paramIndex++} AND created_by = $${paramIndex++}`;
      params.push('tenant');
      params.push(user.id);
    }
    // Tenant cannot access this endpoint
    else {
      return c.json({ error: 'Forbidden' }, 403);
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

    if (!currentUser) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Admin can view any user
    if (currentUser.role === 'admin') {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return c.json({ error: 'User not found' }, 404);
      }
      const user = transformUser(result.rows[0]);
      const { password, ...userWithoutPassword } = user;
      return c.json(userWithoutPassword);
    }

    // Users can view their own profile
    if (currentUser.id === id) {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return c.json({ error: 'User not found' }, 404);
      }
      const user = transformUser(result.rows[0]);
      const { password, ...userWithoutPassword } = user;
      return c.json(userWithoutPassword);
    }

    // Owner can view tenant information if they have contracts with them
    if (currentUser.role === 'owner') {
      // Check if the requested user is a tenant and has contracts with owner's assets
      const contractCheck = await pool.query(
        `SELECT COUNT(*) as count 
         FROM contracts c
         INNER JOIN assets a ON a.id = c.asset_id
         WHERE c.tenant_id = $1 AND a.owner_id = $2`,
        [id, currentUser.id]
      );
      
      const hasContract = parseInt(contractCheck.rows[0]?.count || '0') > 0;
      
      if (hasContract) {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) {
          return c.json({ error: 'User not found' }, 404);
        }
        const user = transformUser(result.rows[0]);
        const { password, ...userWithoutPassword } = user;
        return c.json(userWithoutPassword);
      }
    }

    // Tenant can view owner information if they have contracts with owner's assets
    if (currentUser.role === 'tenant') {
      const contractCheck = await pool.query(
        `SELECT COUNT(*) as count 
         FROM contracts c
         INNER JOIN assets a ON a.id = c.asset_id
         WHERE c.tenant_id = $1 AND a.owner_id = $2`,
        [currentUser.id, id]
      );
      
      const hasContract = parseInt(contractCheck.rows[0]?.count || '0') > 0;
      
      if (hasContract) {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) {
          return c.json({ error: 'User not found' }, 404);
        }
        const user = transformUser(result.rows[0]);
        const { password, ...userWithoutPassword } = user;
        return c.json(userWithoutPassword);
      }
    }

    return c.json({ error: 'Forbidden' }, 403);
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/users - Create user
// - Admin can create any role (owner, tenant, admin)
// - Owner can only create tenants
users.post('/', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const data = createUserSchema.parse(body);

    // Owner can only create tenants
    if (user.role === 'owner' && data.role !== 'tenant') {
      return c.json({ error: 'Owners can only create tenants' }, 403);
    }

    // Tenant cannot create users
    if (user.role === 'tenant') {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Check if phone already exists
    const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [data.phone]);
    if (existing.rows.length > 0) {
      return c.json({ error: 'Phone number already exists' }, 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Set created_by if owner is creating a tenant
    const createdBy = (user.role === 'owner' && data.role === 'tenant') ? user.id : null;

    const result = await pool.query(
      `INSERT INTO users (phone, password, role, name, email, address, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.phone,
        hashedPassword,
        data.role,
        data.name,
        data.email || null,
        data.address ? JSON.stringify(data.address) : null,
        createdBy,
      ]
    );

    const newUser = transformUser(result.rows[0]);
    const { password, ...userWithoutPassword } = newUser;

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
      // Admin can change password without current password verification
      // Regular users must provide current password
      if (currentUser?.role !== 'admin') {
        if (data.currentPassword) {
          const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [id]);
          if (userResult.rows.length === 0) {
            return c.json({ error: 'User not found' }, 404);
          }
          
          const isValidPassword = await bcrypt.compare(
            data.currentPassword,
            userResult.rows[0].password
          );
          
          if (!isValidPassword) {
            return c.json({ error: 'Current password is incorrect' }, 400);
          }
        } else {
          // If password is being changed but no currentPassword provided, require it
          return c.json({ error: 'Current password is required to change password' }, 400);
        }
      }
      
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

// DELETE /api/users/:id - Delete user
// - Admin can delete any user
// - Owner can delete any tenant (they can create tenants, so they can delete them too)
users.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const currentUser = c.get('user');
    
    if (!currentUser) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user to delete
    const userToDeleteResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userToDeleteResult.rows.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    const userToDelete = userToDeleteResult.rows[0];

    // Admin can delete any user
    if (currentUser.role === 'admin') {
      const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
      return c.json({ message: 'User deleted successfully' });
    }

    // Owner can delete any tenant (they can create tenants, so they can delete them too)
    if (currentUser.role === 'owner') {
      if (userToDelete.role !== 'tenant') {
        return c.json({ error: 'Owners can only delete tenants' }, 403);
      }

      const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
      return c.json({ message: 'User deleted successfully' });
    }

    // Tenant cannot delete users
    return c.json({ error: 'Forbidden' }, 403);
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default users;

