# ระบบบริหารจัดการทรัพย์สิน (Asset Management System)

ระบบบริหารจัดการทรัพย์สินสำหรับบ้านเช่าและคอนโดเช่า พร้อมฟีเจอร์ครบถ้วนสำหรับการจัดการทรัพย์สิน สัญญาเช่า การเงิน และการบำรุงรักษา

## 🛠️ เทคโนโลยีที่ใช้

### Backend
- **Node.js** - Runtime environment
- **Hono** - Web framework ที่เร็วและเบา

### Frontend
- **Next.js** - React framework สำหรับเว็บไซต์
- **React Native** - สำหรับแอพพลิเคชั่นมือถือ
- **HeroUI** - UI Framework (โทนสว่าง ทันสมัย แบบ card)
- **Tailwind CSS** - Utility-first CSS framework
- **Leaflet** - Interactive maps
- **SweetAlert2** - Beautiful alert popups

## 📁 โครงสร้างโปรเจกต์

```
asset_management/
├── README.md
├── package.json
├── .gitignore
│
├── frontend/                    # Next.js Web Application
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── .env.local
│   ├── public/
│   │   ├── images/
│   │   └── icons/
│   ├── src/
│   │   ├── app/                 # Next.js App Router
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── login/
│   │   │   ├── forgot-password/
│   │   │   ├── dashboard/
│   │   │   ├── assets/
│   │   │   ├── contracts/
│   │   │   ├── finance/
│   │   │   ├── maintenance/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   ├── components/          # Reusable components
│   │   │   ├── common/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   └── Loading.tsx
│   │   │   ├── assets/
│   │   │   ├── contracts/
│   │   │   ├── finance/
│   │   │   └── maintenance/
│   │   ├── lib/                 # Utilities & helpers
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── utils.ts
│   │   │   └── mockData.ts
│   │   ├── hooks/               # Custom React hooks
│   │   ├── types/               # TypeScript types
│   │   │   ├── asset.ts
│   │   │   ├── contract.ts
│   │   │   ├── finance.ts
│   │   │   └── user.ts
│   │   └── styles/
│   │       └── globals.css
│   └── .next/
│
├── backend/                     # Node.js + Hono API
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   ├── src/
│   │   ├── index.ts            # Entry point
│   │   ├── routes/             # API routes
│   │   │   ├── auth.ts
│   │   │   ├── assets.ts
│   │   │   ├── contracts.ts
│   │   │   ├── finance.ts
│   │   │   ├── maintenance.ts
│   │   │   ├── reports.ts
│   │   │   └── users.ts
│   │   ├── controllers/        # Business logic
│   │   ├── models/             # Data models
│   │   ├── middleware/         # Auth, validation, etc.
│   │   ├── utils/              # Helper functions
│   │   └── db/                 # Database setup
│   └── dist/
│
├── mobile/                      # React Native App
│   ├── package.json
│   ├── app.json
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── navigation/
│   │   ├── services/
│   │   └── utils/
│   └── assets/
│
└── docs/                        # Documentation
    ├── api.md
    ├── database.md
    └── deployment.md
```

## 👥 บทบาทผู้ใช้ (User Roles)

### 1. เจ้าของ (Owner)
- จัดการทรัพย์สินทั้งหมด
- ดูรายงานการเงินและรายได้
- จัดการสัญญาเช่า
- อนุมัติการซ่อมแซม
- ดู Dashboard ภาพรวม

### 2. ผู้เช่า (Tenant)
- ดูข้อมูลทรัพย์สินที่เช่า
- ดูสัญญาเช่าของตนเอง
- ชำระค่าเช่าออนไลน์
- แจ้งปัญหา/คำร้อง
- ดูประวัติการชำระเงิน

### 3. Admin
- จัดการผู้ใช้งานทั้งหมด
- ดูรายงานทั้งหมด
- จัดการระบบ
- ตั้งค่าทั่วไป

## 📋 ฟีเจอร์หลัก

### 1. ข้อมูลพื้นฐานของสินทรัพย์
- ✅ บันทึกรายละเอียดทรัพย์สิน (ประเภท, ที่อยู่, ขนาด, จำนวนห้อง)
- ✅ อัพโหลดรูปภาพและเอกสารประกอบ
- ✅ บันทึกราคาซื้อ/ต้นทุนและมูลค่าปัจจุบัน
- ✅ สถานะของทรัพย์สิน (ว่าง, ให้เช่าแล้ว, ซ่อมแซม)
- ✅ แผนที่แสดงตำแหน่งทรัพย์สิน (Leaflet)

### 2. การจัดการสัญญาเช่า
- ✅ สร้างและจัดเก็บสัญญาเช่า
- ✅ กำหนดระยะเวลาเช่า (วันเริ่มต้น-สิ้นสุด)
- ✅ บันทึกข้อมูลผู้เช่า (ชื่อ, ติดต่อ, เอกสารประกอบ)
- ✅ เงื่อนไขการเช่า (ค่าเช่า, ค่ามัดจำ, ค่าประกัน)
- ✅ แจ้งเตือนก่อนสัญญาหมดอายุ

### 3. การจัดการการเงิน
- ✅ บันทึกรายรับ (ค่าเช่า, ค่าน้ำ-ไฟ, อื่นๆ)
- ✅ บันทึกรายจ่าย (ซ่อมแซม, ภาษี, ค่าบริการ)
- ✅ ติดตามการชำระเงินของผู้เช่า
- ✅ แจ้งเตือนค่าเช่าค้างชำระ
- ✅ รายงานกำไร-ขาดทุน

### 4. การบำรุงรักษา
- ✅ บันทึกประวัติการซ่อมแซม
- ✅ กำหนดตารางบำรุงรักษาประจำ
- ✅ แจ้งปัญหา/คำร้องจากผู้เช่า
- ✅ ติดตามสถานะการซ่อม

### 5. การรายงานและวิเคราะห์
- ✅ Dashboard แสดงภาพรวมสินทรัพย์
- ✅ อัตราการเช่า (Occupancy Rate)
- ✅ รายงานกระแสเงินสด
- ✅ ROI ของแต่ละทรัพย์สิน
- ✅ สรุปรายได้-ค่าใช้จ่ายรายเดือน/ปี

### 6. การจัดการผู้ใช้งาน
- ✅ บทบาทผู้ใช้ (เจ้าของ, ผู้จัดการ, ผู้เช่า)
- ✅ สิทธิ์การเข้าถึงข้อมูล
- ✅ ประวัติการทำงานในระบบ

### 7. การแจ้งเตือน
- ✅ แจ้งเตือนค่าเช่าถึงกำหนด
- ✅ แจ้งเตือนสัญญาใกล้หมดอายุ
- ✅ แจ้งเตือนกำหนดบำรุงรักษา
- ✅ แจ้งเตือนค่าใช้จ่ายผิดปกติ

### 8. ฟีเจอร์เสริม
- ✅ ส่งใบแจ้งหนี้อัตโนมัติ
- ✅ รับชำระเงินออนไลน์ (พร้อมใช้งาน)
- ✅ แชทติดต่อกับผู้เช่า

### 9. ระบบ Authentication
- ✅ เข้าสู่ระบบด้วยเบอร์โทรและรหัสผ่าน
- ✅ ระบบลืมรหัสผ่าน
- ✅ ระบุประเภท user อัตโนมัติจาก user_id
- ✅ JWT Token authentication

## 🚀 การติดตั้งและใช้งาน

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

เปิดเบราว์เซอร์ที่ `http://localhost:3000`

### Backend (Hono)

```bash
cd backend
npm install
npm run dev
```

API Server จะรันที่ `http://localhost:3001`

### Mobile (React Native)

```bash
cd mobile
npm install
npm run android  # หรือ npm run ios
```

## 🔐 ข้อมูล Login สำหรับทดสอบ

### Admin
- เบอร์โทร: `0812345678`
- รหัสผ่าน: `admin123`

### เจ้าของ (Owner)
- เบอร์โทร: `0823456789`
- รหัสผ่าน: `owner123`

### ผู้เช่า (Tenant)
- เบอร์โทร: `0834567890`
- รหัสผ่าน: `tenant123`

## 📝 Environment Variables

### Frontend

#### สำหรับ Development
สร้างไฟล์ `.env.local` ในโฟลเดอร์ `frontend/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### สำหรับ Production (Railway)
ตั้งค่า Environment Variables ใน Railway Dashboard:
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

**หมายเหตุ:** ใช้ `NEXT_PUBLIC_` prefix เพื่อให้ Next.js expose ตัวแปรนี้ไปยัง client-side

ดูรายละเอียดเพิ่มเติมที่ [frontend/ENV_SETUP.md](frontend/ENV_SETUP.md)

### Backend

#### สำหรับ Development
สร้างไฟล์ `.env` ในโฟลเดอร์ `backend/`:
```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://user:password@localhost:5432/asset_management
```

#### สำหรับ Production (Railway)
ตั้งค่า Environment Variables ใน Railway Dashboard:
```env
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.railway.app
JWT_SECRET=your-strong-secret-key-here
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://user:password@host:port/database
```

**หมายเหตุ:** 
- `DATABASE_URL` จะถูกสร้างอัตโนมัติโดย Railway เมื่อเพิ่ม PostgreSQL service
- `CORS_ORIGIN` ควรเป็น URL ของ frontend ที่ deploy บน Railway

ดูรายละเอียดเพิ่มเติมที่ [backend/ENV_SETUP.md](backend/ENV_SETUP.md)

## 🎨 UI/UX Design Guidelines

- **โทนสี**: สว่าง ทันสมัย
- **รูปแบบ**: Card-based design
- **Framework**: HeroUI components
- **Styling**: Tailwind CSS
- **Responsive**: Mobile-first approach

## 📊 Database Schema (แผนผัง)

### Users
- id, phone, password, role, name, email, created_at, updated_at

### Assets
- id, owner_id, type, address, size, rooms, purchase_price, current_value, status, images, documents, created_at, updated_at

### Contracts
- id, asset_id, tenant_id, start_date, end_date, rent_amount, deposit, insurance, status, documents, created_at, updated_at

### Payments
- id, contract_id, amount, type, due_date, paid_date, status, created_at, updated_at

### Maintenance
- id, asset_id, type, description, cost, status, reported_by, created_at, updated_at

### Financial Records
- id, asset_id, type (income/expense), amount, category, description, date, created_at, updated_at

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/forgot-password` - ลืมรหัสผ่าน
- `POST /api/auth/reset-password` - รีเซ็ตรหัสผ่าน

### Assets
- `GET /api/assets` - ดึงรายการทรัพย์สิน
- `POST /api/assets` - สร้างทรัพย์สินใหม่
- `GET /api/assets/:id` - ดึงข้อมูลทรัพย์สิน
- `PUT /api/assets/:id` - อัพเดททรัพย์สิน
- `DELETE /api/assets/:id` - ลบทรัพย์สิน

### Contracts
- `GET /api/contracts` - ดึงรายการสัญญา
- `POST /api/contracts` - สร้างสัญญาใหม่
- `GET /api/contracts/:id` - ดึงข้อมูลสัญญา
- `PUT /api/contracts/:id` - อัพเดทสัญญา

### Finance
- `GET /api/finance/income` - รายรับ
- `GET /api/finance/expense` - รายจ่าย
- `POST /api/finance/record` - บันทึกรายการ
- `GET /api/finance/reports` - รายงานการเงิน

### Maintenance
- `GET /api/maintenance` - รายการบำรุงรักษา
- `POST /api/maintenance` - สร้างรายการใหม่
- `PUT /api/maintenance/:id` - อัพเดทสถานะ

### Reports
- `GET /api/reports/dashboard` - Dashboard data
- `GET /api/reports/occupancy` - อัตราการเช่า
- `GET /api/reports/roi` - ROI analysis

## 📱 Mobile App Features

- Dashboard สำหรับผู้เช่า
- แจ้งปัญหา/คำร้อง
- ดูสัญญาและประวัติการชำระเงิน
- Push notifications
- แชทกับเจ้าของ

## 🧪 Testing

```bash
# Frontend
cd frontend
npm run test

# Backend
cd backend
npm run test
```

## 📦 Deployment

### Frontend
- **Railway** (แนะนำ) - ตั้งค่า `NEXT_PUBLIC_API_URL` เป็น backend URL
- Vercel หรือ Netlify

### Backend
- **Railway** (แนะนำ) - ตั้งค่า `CORS_ORIGIN` เป็น frontend URL และ `DATABASE_URL` จาก PostgreSQL service
- Render หรือ AWS

### Mobile
- App Store (iOS)
- Google Play Store (Android)

### การ Deploy บน Railway

1. **Backend:**
   - สร้าง PostgreSQL service ใน Railway
   - Deploy backend code
   - ตั้งค่า Environment Variables (ดูที่ `backend/ENV_SETUP.md`)
   - Copy backend URL ที่ได้

2. **Frontend:**
   - Deploy frontend code
   - ตั้งค่า `NEXT_PUBLIC_API_URL` เป็น backend URL ที่ได้จากขั้นตอนที่ 1
   - ตั้งค่า `CORS_ORIGIN` ใน backend เป็น frontend URL

## 🤝 Contributing

1. Fork the project
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License

## 👨‍💻 Developer

สร้างด้วย ❤️ สำหรับการจัดการทรัพย์สินอย่างมีประสิทธิภาพ

---

**หมายเหตุ**: โปรเจกต์นี้อยู่ในระหว่างการพัฒนา ฟีเจอร์บางอย่างอาจยังไม่พร้อมใช้งาน

