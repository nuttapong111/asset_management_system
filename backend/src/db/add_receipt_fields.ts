import pool from './connection';

/**
 * Add receipt_date and payment_method columns to payments table
 */
async function addReceiptFields() {
  try {
    console.log('🔄 Adding receipt_date and payment_method columns to payments table...');
    
    // Add receipt_date column
    await pool.query(`
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_date DATE;
    `);
    
    // Add payment_method column
    await pool.query(`
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
    `);
    
    console.log('✅ Successfully added receipt_date and payment_method columns to payments table');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding receipt fields:', error);
    process.exit(1);
  }
}

addReceiptFields();

