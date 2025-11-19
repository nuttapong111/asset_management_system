# การตั้งค่า Environment Variables สำหรับ Backend

## สำหรับ Development

สร้างไฟล์ `.env` ในโฟลเดอร์ `backend/` และเพิ่ม:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/asset_management
```

## สำหรับ Production (Railway)

ตั้งค่า Environment Variables ใน Railway Dashboard:

1. ไปที่ Project Settings > Variables
2. เพิ่มตัวแปรต่อไปนี้:

```
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.railway.app
JWT_SECRET=your-strong-secret-key-here
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://user:password@host:port/database
```

**หมายเหตุ:**
- `CORS_ORIGIN` ควรเป็น URL ของ frontend ที่ deploy บน Railway
- `JWT_SECRET` ควรเป็น random string ที่แข็งแรง (ใช้ `openssl rand -base64 32` เพื่อสร้าง)
- `DATABASE_URL` จะถูกสร้างอัตโนมัติโดย Railway เมื่อเพิ่ม PostgreSQL service

