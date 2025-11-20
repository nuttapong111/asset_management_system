# แก้ไขปัญหา CORS Error

## 🔍 ปัญหาที่พบ

1. **CORS Error** ใน Network tab
2. `CORS_ORIGIN` ใน Railway มี trailing slash (`/`)
3. Backend อาจไม่ได้ใช้ Shared Variables

## ✅ วิธีแก้ไข

### 1. แก้ไข CORS_ORIGIN ใน Railway

**ลบ trailing slash ออกจาก `CORS_ORIGIN`:**

1. ไปที่ **Railway** > **Project Settings** > **Shared Variables** > **staging**
2. คลิกที่ `CORS_ORIGIN` เพื่อแก้ไข
3. เปลี่ยนจาก:
   ```
   https://assetmanagementsystem-staging.up.railway.app/
   ```
   เป็น:
   ```
   https://assetmanagementsystem-staging.up.railway.app
   ```
   (ลบ `/` ท้าย URL)

4. บันทึกการเปลี่ยนแปลง

### 2. ตั้งค่า CORS_ORIGIN ใน Backend Service

**สำคัญ:** Backend Service ต้องมี `CORS_ORIGIN` ใน **Service-specific Variables** ไม่ใช่แค่ Shared Variables

1. ไปที่ **Backend Service** (เช่น `amiable-charisma`) > **Settings** > **Variables**
2. เพิ่มหรือแก้ไข `CORS_ORIGIN`:
   ```
   CORS_ORIGIN=https://assetmanagementsystem-staging.up.railway.app
   ```
   (ไม่มี trailing slash)

3. หรือใช้ Shared Variable โดย reference:
   ```
   CORS_ORIGIN=${{shared.CORS_ORIGIN}}
   ```

### 3. ตรวจสอบ NEXT_PUBLIC_API_URL

ตรวจสอบว่า `NEXT_PUBLIC_API_URL` ถูกตั้งค่าถูกต้อง:

1. ไปที่ **Frontend Service** > **Settings** > **Variables**
2. หรือ **Project Settings** > **Shared Variables** > **staging**
3. ตรวจสอบว่า `NEXT_PUBLIC_API_URL` = `https://amiable-charisma-staging.up.railway.app`
   (ต้องมี `https://` และไม่มี trailing slash)

### 4. Redeploy Backend Service

หลังจากแก้ไข variables:

1. ไปที่ **Backend Service** > **Deployments**
2. คลิก **Redeploy** หรือรอให้ Railway rebuild อัตโนมัติ
3. ตรวจสอบ logs เพื่อดูว่า CORS origin ถูกตั้งค่าถูกต้อง:
   ```
   🌐 CORS configured for origin: https://assetmanagementsystem-staging.up.railway.app
   ```

## 📋 Checklist

### Backend Service Variables
- [ ] `CORS_ORIGIN` = `https://assetmanagementsystem-staging.up.railway.app` (ไม่มี trailing slash)
- [ ] `PORT` = `3001`
- [ ] `NODE_ENV` = `production`
- [ ] `JWT_SECRET` = (ตั้งค่าแล้ว)
- [ ] `DATABASE_URL` = (auto-generated)

### Frontend Service Variables
- [ ] `NEXT_PUBLIC_API_URL` = `https://amiable-charisma-staging.up.railway.app` (มี `https://` ไม่มี trailing slash)

### Shared Variables (staging)
- [ ] `CORS_ORIGIN` = `https://assetmanagementsystem-staging.up.railway.app` (ไม่มี trailing slash)
- [ ] `JWT_SECRET` = (ตั้งค่าแล้ว)
- [ ] `NEXT_PUBLIC_API_URL` = `https://amiable-charisma-staging.up.railway.app` (มี `https://` ไม่มี trailing slash)

## 🔧 Code Changes

Backend code ได้รับการอัปเดตให้ลบ trailing slash ออกจาก `CORS_ORIGIN` อัตโนมัติแล้ว

## ⚠️ ข้อควรระวัง

1. **Trailing Slash**: อย่าใส่ `/` ท้าย URL ใน environment variables
2. **Service-specific vs Shared**: Backend Service ต้องมี `CORS_ORIGIN` ใน service-specific variables หรือ reference จาก shared variables
3. **Redeploy**: ต้อง redeploy backend หลังจากแก้ไข `CORS_ORIGIN`
4. **Protocol**: ต้องใช้ `https://` สำหรับ production

## 🧪 ทดสอบ

หลังจากแก้ไขแล้ว:

1. เปิด Browser DevTools > Network tab
2. ลอง login อีกครั้ง
3. ตรวจสอบว่า request `/api/auth/login` ไม่มี CORS error
4. ตรวจสอบ Response Headers ว่ามี `Access-Control-Allow-Origin` ที่ถูกต้อง

