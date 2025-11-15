import { Hono } from 'hono';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/connection';
import { transformUser } from '../utils/transform';

const auth = new Hono();

const loginSchema = z.object({
  phone: z.string().min(10),
  password: z.string().min(6),
});

// POST /api/auth/login
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { phone, password } = loginSchema.parse(body);

    const result = await pool.query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const userResponse = transformUser(user);
    delete (userResponse as any).password;

    return c.json({
      user: userResponse,
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: error.errors }, 400);
    }
    console.error('Login error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/auth/forgot-password
auth.post('/forgot-password', async (c) => {
  try {
    const body = await c.req.json();
    const { phone } = z.object({ phone: z.string() }).parse(body);

    const result = await pool.query(
      'SELECT id, name, email FROM users WHERE phone = $1',
      [phone]
    );

    if (result.rows.length === 0) {
      // Don't reveal if user exists
      return c.json({ message: 'If the phone number exists, a reset link will be sent' });
    }

    // TODO: Send reset email/SMS
    return c.json({ message: 'Password reset link sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default auth;

