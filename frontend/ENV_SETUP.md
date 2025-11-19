# การตั้งค่า Environment Variables สำหรับ Frontend

## สำหรับ Development

สร้างไฟล์ `.env.local` ในโฟลเดอร์ `frontend/` และเพิ่ม:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## สำหรับ Production (Railway)

ตั้งค่า Environment Variables ใน Railway Dashboard:

1. ไปที่ Project Settings > Variables
2. เพิ่มตัวแปรต่อไปนี้:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

**หมายเหตุ:** 
- ใช้ `NEXT_PUBLIC_` prefix เพื่อให้ Next.js expose ตัวแปรนี้ไปยัง client-side
- เปลี่ยน URL ให้ตรงกับ backend URL ที่ deploy บน Railway

