import pool from '../db/connection';

/**
 * Create payment reminder notifications
 * - 5 days before due_date: reminder notification
 * - Every 2 days after due_date if not paid: overdue notification
 */
export async function createPaymentNotifications(): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // Get all pending and overdue payments
    const paymentsResult = await pool.query(
      `SELECT p.*, c.tenant_id, c.start_date, c.end_date, a.owner_id, a.name as asset_name
       FROM payments p
       INNER JOIN contracts c ON c.id = p.contract_id
       INNER JOIN assets a ON a.id = c.asset_id
       WHERE p.status IN ('pending', 'waiting_approval', 'overdue')
         AND p.type = 'rent'`,
      []
    );
    
    for (const payment of paymentsResult.rows) {
      const dueDate = new Date(payment.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const dueDateStr = dueDate.toISOString().split('T')[0];
      
      const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Update payment status to overdue if past due date
      if (today > dueDate && payment.status === 'pending') {
        await pool.query(
          'UPDATE payments SET status = $1 WHERE id = $2',
          ['overdue', payment.id]
        );
        payment.status = 'overdue';
      }
      
      // Check if payment is overdue
      const isOverdue = today > dueDate;
      
      if (isOverdue) {
        // Check if we should send overdue notification (every 2 days)
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Send notification every 2 days after due date (on day 2, 4, 6, 8, etc.)
        // Start from day 2 (not day 0)
        if (daysOverdue >= 2 && daysOverdue % 2 === 0) {
          // Check if notification already exists for today
          const existingNotification = await pool.query(
            `SELECT id FROM notifications 
             WHERE user_id = $1 
               AND type = 'payment_overdue' 
               AND related_id = $2 
               AND DATE(created_at) = $3`,
            [payment.tenant_id, payment.id, todayStr]
          );
          
          if (existingNotification.rows.length === 0) {
            await pool.query(
              `INSERT INTO notifications (user_id, type, title, message, related_id, status)
               VALUES ($1, $2, $3, $4, $5, 'unread')`,
              [
                payment.tenant_id,
                'payment_overdue',
                'แจ้งเตือนค่าเช่าค้างชำระ',
                `ค่าเช่า ${Number(payment.amount).toLocaleString('th-TH')} บาท สำหรับ ${payment.asset_name || 'ทรัพย์สิน'} ค้างชำระมาแล้ว ${daysOverdue} วัน กรุณาชำระโดยเร็ว`,
                payment.id,
              ]
            );
            
            // Also notify owner
            await pool.query(
              `INSERT INTO notifications (user_id, type, title, message, related_id, status)
               VALUES ($1, $2, $3, $4, $5, 'unread')`,
              [
                payment.owner_id,
                'payment_overdue',
                'แจ้งเตือนค่าเช่าค้างชำระ',
                `ค่าเช่า ${Number(payment.amount).toLocaleString('th-TH')} บาท สำหรับ ${payment.asset_name || 'ทรัพย์สิน'} ค้างชำระมาแล้ว ${daysOverdue} วัน`,
                payment.id,
              ]
            );
          }
        }
      } else if (daysUntilDue === 5) {
        // Send reminder 5 days before due date
        const existingNotification = await pool.query(
          `SELECT id FROM notifications 
           WHERE user_id = $1 
             AND type = 'payment_due_soon' 
             AND related_id = $2 
             AND DATE(created_at) = $3`,
          [payment.tenant_id, payment.id, todayStr]
        );
        
        if (existingNotification.rows.length === 0) {
          await pool.query(
            `INSERT INTO notifications (user_id, type, title, message, related_id, status)
             VALUES ($1, $2, $3, $4, $5, 'unread')`,
            [
              payment.tenant_id,
              'payment_due_soon',
              'แจ้งเตือนค่าเช่าใกล้ครบกำหนด',
              `ค่าเช่า ${Number(payment.amount).toLocaleString('th-TH')} บาท สำหรับ ${payment.asset_name || 'ทรัพย์สิน'} ครบกำหนดชำระในอีก 5 วัน (วันที่ ${dueDateStr})`,
              payment.id,
            ]
          );
        }
      }
    }
  } catch (error) {
    console.error('Error creating payment notifications:', error);
    throw error;
  }
}

