import { Context, Next } from 'hono';
import { verify } from 'jsonwebtoken';
import pool from '../db/connection';
import { UserRole } from '../types';

export interface AuthUser {
  id: string;
  role: UserRole;
  phone: string;
  name: string;
}

declare module 'hono' {
  interface Context {
    user?: AuthUser;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }

    const decoded = verify(token, secret) as { userId: string };
    
    // Get user from database
    const result = await pool.query(
      'SELECT id, phone, role, name FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'User not found' }, 401);
    }

    const user = result.rows[0];
    c.set('user', {
      id: user.id,
      role: user.role,
      phone: user.phone,
      name: user.name,
    });

    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
}

export function requireRole(...roles: UserRole[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!roles.includes(user.role)) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    await next();
  };
}

