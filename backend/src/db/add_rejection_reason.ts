import pool from './connection';

async function addRejectionReasonColumn() {
  try {
    console.log('Adding rejection_reason column to payments table...');
    
    // Check if column already exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      AND column_name = 'rejection_reason'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('Column rejection_reason already exists');
      return;
    }
    
    // Add rejection_reason column
    await pool.query(`
      ALTER TABLE payments 
      ADD COLUMN rejection_reason TEXT
    `);
    
    console.log('✅ Successfully added rejection_reason column to payments table');
  } catch (error) {
    console.error('❌ Error adding rejection_reason column:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

addRejectionReasonColumn();

