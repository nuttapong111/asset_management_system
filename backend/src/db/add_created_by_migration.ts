import pool from './connection';

async function addCreatedByColumn() {
  try {
    console.log('🔄 กำลังเพิ่ม column created_by ในตาราง users...');
    
    // Add created_by column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL
    `);
    
    console.log('✅ เพิ่ม column created_by เรียบร้อย');
    
    // Create index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by)
    `);
    
    console.log('✅ สร้าง index idx_users_created_by เรียบร้อย');
    console.log('✅ Migration เสร็จสมบูรณ์');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration ล้มเหลว:', error);
    process.exit(1);
  }
}

addCreatedByColumn();

