import pool from './connection';

/**
 * Update asset status based on active contracts
 * - If asset has active contract within date range → status = 'rented'
 * - If asset has no active contract or all contracts expired → status = 'available'
 */
async function updateAssetStatus() {
  try {
    console.log('🔄 กำลังอัปเดตสถานะสินทรัพย์ตามสัญญา...');
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Get all assets
    const assetsResult = await pool.query('SELECT id FROM assets');
    const assets = assetsResult.rows;
    
    let updatedCount = 0;
    
    for (const asset of assets) {
      // Check for active contracts within date range
      const activeContractsResult = await pool.query(
        `SELECT id, start_date, end_date 
         FROM contracts 
         WHERE asset_id = $1 
           AND status = 'active'
           AND start_date <= $2
           AND end_date >= $2`,
        [asset.id, today]
      );
      
      if (activeContractsResult.rows.length > 0) {
        // Has active contract within date range → set to 'rented'
        const currentStatusResult = await pool.query(
          'SELECT status FROM assets WHERE id = $1',
          [asset.id]
        );
        
        if (currentStatusResult.rows[0]?.status !== 'rented') {
          await pool.query(
            'UPDATE assets SET status = $1 WHERE id = $2',
            ['rented', asset.id]
          );
          console.log(`  ✓ อัปเดตสินทรัพย์ ${asset.id} เป็น 'rented'`);
          updatedCount++;
        }
      } else {
        // No active contract or all contracts expired → set to 'available' (if not maintenance)
        const currentStatusResult = await pool.query(
          'SELECT status FROM assets WHERE id = $1',
          [asset.id]
        );
        
        const currentStatus = currentStatusResult.rows[0]?.status;
        
        // Only update if current status is 'rented', don't change 'maintenance' status
        if (currentStatus === 'rented') {
          await pool.query(
            'UPDATE assets SET status = $1 WHERE id = $2',
            ['available', asset.id]
          );
          console.log(`  ✓ อัปเดตสินทรัพย์ ${asset.id} เป็น 'available' (ไม่มีสัญญา active หรือหมดอายุแล้ว)`);
          updatedCount++;
        }
      }
    }
    
    console.log(`✅ อัปเดตสถานะสินทรัพย์เรียบร้อย: ${updatedCount} รายการ`);
    process.exit(0);
  } catch (error) {
    console.error('❌ การอัปเดตสถานะสินทรัพย์ล้มเหลว:', error);
    process.exit(1);
  }
}

updateAssetStatus();

