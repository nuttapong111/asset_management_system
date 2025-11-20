# การตั้งค่า Environment Variables สำหรับ Frontend

## สำหรับ Development

สร้างไฟล์ `.env.local` ในโฟลเดอร์ `frontend/` และเพิ่ม:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## สำหรับ Production (Railway)

ตั้งค่า Environment Variables ใน Railway Dashboard:

1. ไปที่ Project Settings > Variables หรือ Frontend Service > Settings > Variables
2. เพิ่มตัวแปรต่อไปนี้:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

**⚠️ ข้อควรระวัง:** 
- ใช้ `NEXT_PUBLIC_` prefix เพื่อให้ Next.js expose ตัวแปรนี้ไปยัง client-side
- **ต้องใส่ `https://` นำหน้า URL เสมอ**
- **อย่าใส่ trailing slash (`/`) ท้าย URL**
- ตัวอย่างที่ถูกต้อง: `https://amiable-charisma-staging.up.railway.app`
- ตัวอย่างที่ผิด: `amiable-charisma-staging.up.railway.app` (ไม่มี https://)
- ตัวอย่างที่ผิด: `https://amiable-charisma-staging.up.railway.app/` (มี trailing slash)

