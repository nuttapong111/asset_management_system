import pool from './connection';

/**
 * Add 'waiting_approval' status to payments table
 */
async function addWaitingApprovalStatus() {
  try {
    console.log('🔄 Adding waiting_approval status to payments table...');
    
    // Drop existing constraint
    await pool.query(`
      ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
    `);
    
    // Add new constraint with waiting_approval
    await pool.query(`
      ALTER TABLE payments ADD CONSTRAINT payments_status_check 
      CHECK (status IN ('pending', 'waiting_approval', 'paid', 'overdue'));
    `);
    
    console.log('✅ Successfully added waiting_approval status to payments table');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding waiting_approval status:', error);
    process.exit(1);
  }
}

addWaitingApprovalStatus();

