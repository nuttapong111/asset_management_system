# Debug CORS Issues

## 🔍 วิธีตรวจสอบ CORS Error

### 1. ตรวจสอบ Backend Logs ใน Railway

1. ไปที่ **Backend Service** (amiable-charisma) > **Logs**
2. ดูข้อความเมื่อ backend เริ่มต้น:
   ```
   🌐 CORS configured for origins: https://assetmanagementsystem-staging.up.railway.app
   📝 CORS_ORIGIN env var: https://assetmanagementsystem-staging.up.railway.app
   ```

3. เมื่อมี request เข้ามา ควรเห็น:
   ```
   🔍 CORS request from origin: https://assetmanagementsystem-staging.up.railway.app
   ✅ CORS: Allowing origin: https://assetmanagementsystem-staging.up.railway.app
   ```

4. หาก origin ไม่ match จะเห็น:
   ```
   ⚠️  CORS blocked origin: [origin], allowed: [allowed origins]
   ```

### 2. ตรวจสอบ Environment Variables

**ใน Backend Service Variables:**
- [ ] `CORS_ORIGIN` = `https://assetmanagementsystem-staging.up.railway.app` (ไม่มี trailing slash)
- [ ] ตรวจสอบว่าไม่มีช่องว่างก่อนหรือหลัง URL

**ใน Shared Variables (staging):**
- [ ] `CORS_ORIGIN` = `https://assetmanagementsystem-staging.up.railway.app` (ไม่มี trailing slash)

### 3. ตรวจสอบ Browser DevTools

1. เปิด **Network tab** ใน DevTools
2. ดู request ที่มี CORS error
3. ตรวจสอบ **Request Headers**:
   - `Origin`: ควรเป็น `https://assetmanagementsystem-staging.up.railway.app`
4. ตรวจสอบ **Response Headers**:
   - `Access-Control-Allow-Origin`: ควรเป็น `https://assetmanagementsystem-staging.up.railway.app`
   - `Access-Control-Allow-Credentials`: ควรเป็น `true`

### 4. ทดสอบด้วย curl

```bash
curl -X OPTIONS https://amiable-charisma-staging.up.railway.app/api/auth/login \
  -H "Origin: https://assetmanagementsystem-staging.up.railway.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

ควรเห็น response headers:
```
< Access-Control-Allow-Origin: https://assetmanagementsystem-staging.up.railway.app
< Access-Control-Allow-Credentials: true
< Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
```

## 🔧 วิธีแก้ไข

### หาก Backend Logs แสดงว่า CORS_ORIGIN ไม่ถูกตั้งค่า

1. ตรวจสอบว่า Backend Service มี `CORS_ORIGIN` ใน **Service Variables**
2. ตรวจสอบว่าไม่มี trailing slash
3. **Redeploy Backend Service** หลังจากแก้ไข

### หาก Origin ไม่ Match

1. ตรวจสอบว่า origin ที่ส่งมาจาก frontend ตรงกับ `CORS_ORIGIN` หรือไม่
2. ตรวจสอบว่าไม่มี trailing slash ในทั้งสองฝั่ง
3. ตรวจสอบว่าใช้ `https://` ทั้งสองฝั่ง

### หากยังไม่ได้ผล

1. ลองใช้ wildcard (ไม่แนะนำสำหรับ production):
   ```
   CORS_ORIGIN=*
   ```

2. หรือใช้ multiple origins (comma-separated):
   ```
   CORS_ORIGIN=https://assetmanagementsystem-staging.up.railway.app,https://assetmanagementsystem-production.up.railway.app
   ```

## 📋 Checklist

- [ ] Backend logs แสดง CORS configuration ถูกต้อง
- [ ] Backend logs แสดงว่า origin ถูก allow
- [ ] Browser DevTools แสดง `Access-Control-Allow-Origin` header
- [ ] `CORS_ORIGIN` ใน Backend Service Variables ถูกต้อง
- [ ] `CORS_ORIGIN` ใน Shared Variables ถูกต้อง
- [ ] Backend Service ได้ rebuild/redeploy แล้ว

