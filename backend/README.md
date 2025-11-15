# Backend API - Asset Management System

Backend API built with Hono, TypeScript, and PostgreSQL.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials:
```
DATABASE_URL=postgresql://user:password@localhost:5432/asset_management
JWT_SECRET=your-super-secret-jwt-key
```

4. Run database migrations:
```bash
npm run migrate
```

5. Seed database with sample data:
```bash
npm run seed
```

6. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Forgot password

### Users
- `GET /api/users` - Get all users (admin only, filter by role with `?role=owner`)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Assets
- `GET /api/assets` - Get assets (filtered by role)
- `GET /api/assets/:id` - Get asset by ID
- `POST /api/assets` - Create asset (owner/admin)
- `PUT /api/assets/:id` - Update asset (owner/admin)
- `DELETE /api/assets/:id` - Delete asset (owner/admin)

### Contracts
- `GET /api/contracts` - Get contracts (filtered by role)
- `GET /api/contracts/:id` - Get contract by ID
- `POST /api/contracts` - Create contract (owner/admin)
- `PUT /api/contracts/:id` - Update contract (owner/admin)

### Payments
- `GET /api/payments` - Get payments (filtered by role)
- `GET /api/payments/:id` - Get payment by ID
- `POST /api/payments` - Create payment (owner/admin)
- `PUT /api/payments/:id` - Update payment (owner can approve, tenant can upload proof)

### Maintenance
- `GET /api/maintenance` - Get maintenance requests (filtered by role)
- `GET /api/maintenance/:id` - Get maintenance by ID
- `POST /api/maintenance` - Create maintenance request (tenant/owner/admin)
- `PUT /api/maintenance/:id` - Update maintenance (owner/admin)

### Dashboard
- `GET /api/dashboard` - Get dashboard stats (filtered by role)

### Admin
- `GET /api/admin/summary` - Get admin summary (admin only)

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark notification as read

## Role-Based Access

- **Admin**: Full access to all resources
- **Owner**: Can manage their own assets, contracts, and payments
- **Tenant**: Can view their contracts, payments, and create maintenance requests

## Database Schema

See `src/db/schema.sql` for the complete database schema.

