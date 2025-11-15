import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import dotenv from 'dotenv';

import auth from './routes/auth';
import users from './routes/users';
import assets from './routes/assets';
import contracts from './routes/contracts';
import payments from './routes/payments';
import maintenance from './routes/maintenance';
import dashboard from './routes/dashboard';
import admin from './routes/admin';
import notifications from './routes/notifications';

dotenv.config();

const app = new Hono();

// CORS configuration
app.use('/*', cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.route('/api/auth', auth);
app.route('/api/users', users);
app.route('/api/assets', assets);
app.route('/api/contracts', contracts);
app.route('/api/payments', payments);
app.route('/api/maintenance', maintenance);
app.route('/api/dashboard', dashboard);
app.route('/api/admin', admin);
app.route('/api/notifications', notifications);

const port = parseInt(process.env.PORT || '3001', 10);

console.log(`🚀 Server starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`✅ Server is running on http://localhost:${info.port}`);
});

