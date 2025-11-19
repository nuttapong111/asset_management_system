import pool from './connection';

/**
 * Reset all contracts and set all assets status to 'available'
 * WARNING: This will delete all contracts and reset all asset statuses
 */
async function resetContractsAndAssets() {
  try {
    console.log('🔄 Starting reset process...');

    // Delete all contracts
    const deleteContractsResult = await pool.query('DELETE FROM contracts RETURNING id');
    console.log(`✅ Deleted ${deleteContractsResult.rows.length} contracts`);

    // Delete all payments (since they depend on contracts)
    const deletePaymentsResult = await pool.query('DELETE FROM payments RETURNING id');
    console.log(`✅ Deleted ${deletePaymentsResult.rows.length} payments`);

    // Update all assets status to 'available'
    const updateAssetsResult = await pool.query(
      "UPDATE assets SET status = 'available' RETURNING id"
    );
    console.log(`✅ Updated ${updateAssetsResult.rows.length} assets to 'available' status`);

    console.log('✅ Reset completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting contracts and assets:', error);
    process.exit(1);
  }
}

resetContractsAndAssets();

