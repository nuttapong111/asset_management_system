# การตั้งค่า Environment Variables บน Railway

## 📋 Environment Variables ที่ต้องตั้งค่า

### 🔧 Backend Service

ตั้งค่าใน **Backend Service** (staging และ production):

| Variable Name | Description | Example Value | Required |
|--------------|-------------|---------------|----------|
| `PORT` | Port ที่ backend จะรัน | `3001` | ✅ |
| `NODE_ENV` | Environment mode | `production` | ✅ |
| `CORS_ORIGIN` | Frontend URL สำหรับ CORS | `https://your-frontend.railway.app` | ✅ |
| `JWT_SECRET` | Secret key สำหรับ JWT token | `your-strong-secret-key-here` | ✅ |
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` | ⚠️ (default: 7d) |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` | ✅ (Auto-generated) |

**หมายเหตุ:**
- `DATABASE_URL` จะถูกสร้างอัตโนมัติเมื่อเพิ่ม PostgreSQL service ใน Railway
- `JWT_SECRET` ควรเป็น random string ที่แข็งแรง (ใช้ `openssl rand -base64 32` เพื่อสร้าง)

### 🎨 Frontend Service

ตั้งค่าใน **Frontend Service** (staging และ production):

| Variable Name | Description | Example Value | Required |
|--------------|-------------|---------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://your-backend.railway.app` | ✅ |
| `PORT` | Port ที่ frontend จะรัน | `3000` | ⚠️ (default: 3000) |

**⚠️ ข้อควรระวัง:**
- ใช้ `NEXT_PUBLIC_` prefix เพื่อให้ Next.js expose ตัวแปรนี้ไปยัง client-side
- **ต้องใส่ `https://` นำหน้า URL เสมอ** (ไม่ใช่แค่ domain name)
- **อย่าใส่ path หรือ trailing slash** (`/`) ท้าย URL
- ตัวอย่างที่ถูกต้อง: `https://amiable-charisma-staging.up.railway.app`
- ตัวอย่างที่ผิด: `amiable-charisma-staging.up.railway.app` (ไม่มี https://)
- ตัวอย่างที่ผิด: `https://amiable-charisma-staging.up.railway.app/` (มี trailing slash)
- ตัวอย่างที่ผิด: `https://frontend-url/backend-url` (ซ้ำซ้อน domain)

---

## 🚀 วิธีตั้งค่าใน Railway

### 1. ตั้งค่า Backend Variables

1. ไปที่ **Backend Service** > **Settings** > **Variables**
2. เพิ่มตัวแปรต่อไปนี้:

```env
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.railway.app
JWT_SECRET=your-strong-secret-key-here
JWT_EXPIRES_IN=7d
```

**สำหรับ DATABASE_URL:**
- Railway จะสร้าง `DATABASE_URL` อัตโนมัติเมื่อเพิ่ม PostgreSQL service
- หรือสามารถใช้ connection string ที่มีอยู่: `postgresql://postgres:BhOWSJgBYIbkoCaMoWcDngqgBdXnQPxm@shortline.proxy.rlwy.net:30344/railway`

### 2. ตั้งค่า Frontend Variables

1. ไปที่ **Frontend Service** > **Settings** > **Variables**
2. เพิ่มตัวแปรต่อไปนี้:

```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

**หรือใช้ Shared Variables:**
- ไปที่ **Project Settings** > **Shared Variables**
- เพิ่ม `NEXT_PUBLIC_API_URL` ใน environment ที่ต้องการ (staging/production)
- Frontend service จะสามารถ reference ตัวแปรนี้ได้

---

## 🔐 สร้าง JWT_SECRET ที่แข็งแรง

รันคำสั่งนี้ใน terminal:

```bash
openssl rand -base64 32
```

หรือใช้ online generator:
- https://www.grc.com/passwords.htm

---

## ✅ Checklist

### Backend
- [ ] `PORT` = `3001`
- [ ] `NODE_ENV` = `production`
- [ ] `CORS_ORIGIN` = Frontend URL
- [ ] `JWT_SECRET` = Random strong string
- [ ] `JWT_EXPIRES_IN` = `7d` (optional)
- [ ] `DATABASE_URL` = PostgreSQL connection string (auto-generated)

### Frontend
- [ ] `NEXT_PUBLIC_API_URL` = Backend URL
- [ ] `PORT` = `3000` (optional, default)

---

## 🔄 ตัวอย่างการตั้งค่า

### Staging Environment

**Backend:**
```env
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://asset-management-frontend-staging.railway.app
JWT_SECRET=staging-secret-key-change-this
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://postgres:password@host:port/database
```

**Frontend:**
```env
NEXT_PUBLIC_API_URL=https://asset-management-backend-staging.railway.app
```

### Production Environment

**Backend:**
```env
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://asset-management-frontend-production.railway.app
JWT_SECRET=production-secret-key-change-this
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://postgres:password@host:port/database
```

**Frontend:**
```env
NEXT_PUBLIC_API_URL=https://asset-management-backend-production.railway.app
```

---

## ⚠️ ข้อควรระวัง

1. **JWT_SECRET**: อย่าใช้ secret เดียวกันระหว่าง staging และ production
2. **CORS_ORIGIN**: ต้องตรงกับ frontend URL จริง
3. **DATABASE_URL**: Railway จะสร้างให้อัตโนมัติ แต่สามารถ override ได้
4. **NEXT_PUBLIC_API_URL**: ต้องใช้ `https://` สำหรับ production
5. **Shared Variables**: สามารถใช้ร่วมกันระหว่าง services ใน environment เดียวกัน

---

## 📝 หมายเหตุเพิ่มเติม

- หลังจากตั้งค่า variables แล้ว Railway จะ rebuild services อัตโนมัติ
- ตรวจสอบ logs เพื่อดูว่า services เริ่มต้นสำเร็จหรือไม่
- ใช้ Railway CLI เพื่อตรวจสอบ variables: `railway variables`

