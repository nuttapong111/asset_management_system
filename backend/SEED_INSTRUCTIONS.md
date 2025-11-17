# คำแนะนำการ Seed ข้อมูล

## ขั้นตอนการ Seed ข้อมูล Mock จาก Frontend ลงใน Database

### 1. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ `backend/` โดยคัดลอกจาก `.env.example`:

```bash
cp .env.example .env
```

แก้ไขไฟล์ `.env` และตั้งค่า `DATABASE_URL`:

```env
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
NODE_ENV=development
API_URL=http://localhost:3001
```

**หมายเหตุ:** แทนที่ `username`, `password`, และ `database_name` ด้วยข้อมูลจริงของคุณ

### 2. สร้าง Database (ถ้ายังไม่มี)

```bash
# ใช้ psql หรือ pgAdmin เพื่อสร้าง database
createdb database_name
# หรือ
psql -U postgres -c "CREATE DATABASE database_name;"
```

### 3. รัน Migrations

```bash
cd backend
npm run migrate
```

คำสั่งนี้จะสร้างตารางทั้งหมดใน database

### 4. Seed ข้อมูล Mock

```bash
npm run seed
```

คำสั่งนี้จะ:
- ลบข้อมูลเก่าทั้งหมด (ถ้ามี)
- ใส่ข้อมูล mock จาก frontend ลงใน database:
  - 3 users (admin, owner, tenant)
  - 17 assets (รวม parent asset และ child assets)
  - 6 contracts
  - 2 payments
  - 3 maintenance records
  - 2 financial records

### 5. ทดสอบ API

เริ่ม backend server:

```bash
npm run dev
```

ใน terminal อื่น รัน test script:

```bash
npm run test
```

หรือทดสอบด้วย curl:

```bash
# Health check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0812345678","password":"admin123"}'

# Get assets (ใช้ token จาก login)
curl http://localhost:3001/api/assets \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## ข้อมูล Mock ที่ถูก Seed

### Users
- **Admin**: 0812345678 / admin123
- **Owner**: 0823456789 / owner123
- **Tenant**: 0834567890 / tenant123

### Assets
- 6 assets หลัก (house, condo, apartment)
- 1 parent asset (land พัฒนาเป็นห้องเช่า)
- 10 child assets (ห้องเช่า 101-110)

### Contracts
- 6 contracts (1 สำหรับบ้านหลัก, 5 สำหรับห้องเช่า)

### Payments
- 2 payments (1 paid, 1 pending)

### Maintenance
- 3 maintenance records (1 in_progress, 2 pending)

### Financial Records
- 2 financial records (1 income, 1 expense)

## UUIDs ที่ใช้

Seed script ใช้ UUID ที่กำหนดไว้ล่วงหน้าเพื่อความสอดคล้อง:
- Users: `00000000-0000-0000-0000-000000000001` (admin), `00000000-0000-0000-0000-000000000002` (owner), `00000000-0000-0000-0000-000000000003` (tenant)
- Assets: `10000000-0000-0000-0000-000000000001` ถึง `10000000-0000-0000-0000-000000000011`
- Contracts: `20000000-0000-0000-0000-000000000001` ถึง `20000000-0000-0000-0000-000000000006`
- Payments: `30000000-0000-0000-0000-000000000001` ถึง `30000000-0000-0000-0000-000000000002`
- Maintenance: `40000000-0000-0000-0000-000000000001` ถึง `40000000-0000-0000-0000-000000000003`
- Financial Records: `50000000-0000-0000-0000-000000000001` ถึง `50000000-0000-0000-0000-000000000002`

