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
import { createPaymentNotifications } from './utils/paymentNotifications';

dotenv.config();

const app = new Hono();

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
// Remove trailing slash if present
const cleanCorsOrigin = corsOrigin.endsWith('/') ? corsOrigin.slice(0, -1) : corsOrigin;

app.use('/*', cors({
  origin: cleanCorsOrigin,
  credentials: true,
}));

console.log(`🌐 CORS configured for origin: ${cleanCorsOrigin}`);

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

// Schedule payment notifications check
// Check every 2 hours to catch notifications for overdue payments (every 2 days)
let lastNotificationCheck = new Date();
lastNotificationCheck.setHours(0, 0, 0, 0);

// Check for payment notifications every 2 hours
setInterval(async () => {
  try {
    const now = new Date();
    // Run check (allow multiple checks per day for overdue notifications every 2 days)
    const hoursSinceLastCheck = (now.getTime() - lastNotificationCheck.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastCheck >= 2) {
      console.log('🔔 Checking for payment notifications...');
      await createPaymentNotifications();
      lastNotificationCheck = new Date();
      console.log('✅ Payment notifications check completed');
    }
  } catch (error) {
    console.error('❌ Error checking payment notifications:', error);
  }
}, 2 * 60 * 60 * 1000); // Check every 2 hours

// Run immediately on startup
createPaymentNotifications().catch(error => {
  console.error('❌ Error running initial payment notifications check:', error);
});

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`✅ Server is running on http://localhost:${info.port}`);
});

