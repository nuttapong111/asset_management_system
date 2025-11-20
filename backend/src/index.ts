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

// Support multiple origins (comma-separated) or single origin
const allowedOrigins = cleanCorsOrigin.split(',').map(origin => origin.trim());

// CORS middleware with explicit OPTIONS handling
app.use('/*', cors({
  origin: (origin, c) => {
    // Log all CORS requests for debugging
    const method = c.req.method;
    console.log(`🔍 CORS ${method} request from origin: ${origin || '(no origin)'}`);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log(`✅ CORS: Allowing request with no origin`);
      return cleanCorsOrigin;
    }
    
    // Remove trailing slash for comparison
    const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    
    // Check if origin matches any allowed origin
    for (const allowedOrigin of allowedOrigins) {
      const cleanAllowed = allowedOrigin.endsWith('/') ? allowedOrigin.slice(0, -1) : allowedOrigin;
      
      if (cleanOrigin === cleanAllowed) {
        console.log(`✅ CORS: Allowing origin: ${origin} for ${method} request`);
        return origin; // Return the original origin (with or without trailing slash)
      }
    }
    
    // Log for debugging
    console.log(`⚠️  CORS blocked origin: ${origin}, allowed: ${allowedOrigins.join(', ')}`);
    return null; // Block the request
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposeHeaders: ['Content-Type'],
  maxAge: 86400, // Cache preflight for 24 hours
}));

console.log(`🌐 CORS configured for origins: ${allowedOrigins.join(', ')}`);
console.log(`📝 CORS_ORIGIN env var: ${process.env.CORS_ORIGIN || '(not set)'}`);

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

// Railway uses PORT environment variable, default to 3001 for local development
const port = parseInt(process.env.PORT || '3001', 10);

console.log(`🚀 Server starting on port ${port}...`);
console.log(`📝 PORT env var: ${process.env.PORT || '(not set, using default 3001)'}`);

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
  hostname: '0.0.0.0', // Listen on all interfaces (required for Railway)
}, (info) => {
  console.log(`✅ Server is running on http://0.0.0.0:${info.port}`);
  console.log(`🌐 Server accessible on port ${info.port}`);
});

