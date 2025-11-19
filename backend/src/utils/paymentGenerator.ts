import pool from '../db/connection';

/**
 * Generate monthly payment records for a contract
 * - First payment: advance rent (deposit) + insurance (due on contract creation date)
 * - If deposit < rentAmount: Additional payment for remaining rent (rentAmount - deposit)
 *   - Due date: 10 days before contract start date
 *   - This payment will be deducted from the advance rent already paid
 * - Second month onwards: Monthly rent payments
 *   - Payment can be made in advance (20 days before the 1st of the month)
 *   - Due date is the 1st of the payment month (can pay until start of month)
 * Example: Payment for February -> can pay from January 20, due_date = February 1
 * 
 * @param contractId - Contract ID
 * @param startDate - Contract start date (YYYY-MM-DD)
 * @param endDate - Contract end date (YYYY-MM-DD)
 * @param rentAmount - Monthly rent amount
 * @param deposit - Advance rent amount (deposit, max 1 month)
 * @param insurance - Insurance amount (for first payment)
 * @param contractCreatedAt - Contract creation date (YYYY-MM-DD), defaults to today
 */
export async function generateMonthlyPayments(
  contractId: string,
  startDate: string,
  endDate: string,
  rentAmount: number,
  deposit: number = 0,
  insurance: number = 0,
  contractCreatedAt?: string
): Promise<void> {
  try {
    // Parse dates
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    
    // Start from the second month (skip first month as it's paid in advance)
    const firstPaymentMonth = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    
    // Generate payments for each month in the contract period (starting from month 2)
    const payments: Array<{ contractId: string; amount: number; type: string; dueDate: string }> = [];
    let currentMonth = new Date(firstPaymentMonth);
    
    // Create first payment: advance rent (deposit) + insurance
    // This is paid on contract creation date
    const firstPaymentDueDate = contractCreatedAt || new Date().toISOString().split('T')[0];
    const firstPaymentAmount = deposit + insurance;
    
    payments.push({
      contractId,
      amount: firstPaymentAmount,
      type: 'rent',
      dueDate: firstPaymentDueDate,
    });
    
    // If deposit < rentAmount, create additional payment for remaining rent
    // This payment is due 10 days before contract start date
    if (deposit < rentAmount) {
      const remainingRent = rentAmount - deposit;
      const startDateObj = new Date(startDate + 'T00:00:00');
      const remainingPaymentDueDate = new Date(startDateObj);
      remainingPaymentDueDate.setDate(remainingPaymentDueDate.getDate() - 10);
      const remainingPaymentDueDateStr = remainingPaymentDueDate.toISOString().split('T')[0];
      
      payments.push({
        contractId,
        amount: remainingRent,
        type: 'rent',
        dueDate: remainingPaymentDueDateStr,
      });
    }
    
    // Generate monthly payments starting from month 2
    // Due date is the 1st of the payment month (can pay until start of month)
    // Payment can be made in advance (20 days before) but due date is start of month
    while (currentMonth <= end) {
      // Due date is the 1st of the payment month
      // Example: Payment for February -> due_date = February 1
      // Can pay in advance (20 days before = January 20) but must pay by February 1
      const paymentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const dueDateStr = paymentMonth.toISOString().split('T')[0];
      
      payments.push({
        contractId,
        amount: rentAmount,
        type: 'rent',
        dueDate: dueDateStr,
      });
      
      // Move to next month
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    }
    
    // Insert payments into database
    for (const payment of payments) {
      // Check if payment already exists for this contract and due_date
      const existing = await pool.query(
        'SELECT id FROM payments WHERE contract_id = $1 AND due_date = $2 AND type = $3',
        [payment.contractId, payment.dueDate, payment.type]
      );
      
      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO payments (contract_id, amount, type, due_date, status)
           VALUES ($1, $2, $3, $4, 'pending')`,
          [payment.contractId, payment.amount, payment.type, payment.dueDate]
        );
      }
    }
  } catch (error) {
    console.error('Error generating monthly payments:', error);
    throw error;
  }
}

