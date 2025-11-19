import pool from './connection';

/**
 * Add receipt_number column to payments table
 */
async function addReceiptNumberColumn() {
  try {
    console.log('🔄 Adding receipt_number column to payments table...');
    
    // Add receipt_number column
    await pool.query(`
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(20);
    `);
    
    // Create index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_receipt_number ON payments(receipt_number);
    `);
    
    console.log('✅ Successfully added receipt_number column to payments table');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding receipt_number column:', error);
    process.exit(1);
  }
}

addReceiptNumberColumn();

