import bcrypt from 'bcryptjs';
import pool from './connection';

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const ownerPassword = await bcrypt.hash('owner123', 10);
    const tenantPassword = await bcrypt.hash('tenant123', 10);

    // Insert users
    const usersResult = await pool.query(`
      INSERT INTO users (phone, password, role, name, email) VALUES
      ('0812345678', $1, 'admin', 'ผู้ดูแลระบบ', 'admin@example.com'),
      ('0823456789', $2, 'owner', 'สมชาย ใจดี', 'owner@example.com'),
      ('0834567890', $3, 'tenant', 'สมหญิง รักดี', 'tenant@example.com')
      ON CONFLICT (phone) DO NOTHING
      RETURNING id, role
    `, [adminPassword, ownerPassword, tenantPassword]);

    console.log('✅ Users seeded');

    // Get user IDs
    const adminId = usersResult.rows.find((r: any) => r.role === 'admin')?.id;
    const ownerId = usersResult.rows.find((r: any) => r.role === 'owner')?.id;
    const tenantId = usersResult.rows.find((r: any) => r.role === 'tenant')?.id;

    if (!ownerId || !tenantId) {
      console.log('⚠️  Users not found, skipping asset seeding');
      process.exit(0);
    }

    // Insert sample assets
    const assetsResult = await pool.query(`
      INSERT INTO assets (
        owner_id, type, name, address, district, province, postal_code,
        size, rooms, purchase_price, current_value, status,
        latitude, longitude, description, is_parent
      ) VALUES
      ($1, 'house', 'บ้านเดี่ยว 2 ชั้น', '123 ถนนสุขุมวิท', 'คลองตัน', 'กรุงเทพมหานคร', '10110',
       150, 3, 5000000, 6500000, 'rented',
       13.7367, 100.5231, 'บ้านเดี่ยวสวยงาม 2 ชั้น พร้อมสวน', false),
      ($1, 'condo', 'คอนโดมิเนียมหรู', '456 ถนนสีลม', 'สีลม', 'กรุงเทพมหานคร', '10500',
       45, 1, 3000000, 4200000, 'available',
       13.7300, 100.5390, 'คอนโดมิเนียมใจกลางเมือง พร้อมสิ่งอำนวยความสะดวกครบ', false)
      RETURNING id
    `, [ownerId]);

    console.log('✅ Assets seeded');

    if (assetsResult.rows.length > 0) {
      const assetId = assetsResult.rows[0].id;

      // Insert sample contract
      const contractsResult = await pool.query(`
        INSERT INTO contracts (
          asset_id, tenant_id, start_date, end_date,
          rent_amount, deposit, insurance, status
        ) VALUES
        ($1, $2, '2024-01-01', '2024-12-31', 25000, 50000, 10000, 'active')
        RETURNING id
      `, [assetId, tenantId]);

      console.log('✅ Contracts seeded');

      if (contractsResult.rows.length > 0) {
        const contractId = contractsResult.rows[0].id;

        // Insert sample payment
        await pool.query(`
          INSERT INTO payments (contract_id, amount, type, due_date, status, paid_date)
          VALUES ($1, 25000, 'rent', '2024-02-05', 'paid', '2024-02-03')
        `, [contractId]);

        console.log('✅ Payments seeded');
      }
    }

    console.log('✅ Database seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();

