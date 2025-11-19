export type FinanceType = 'income' | 'expense';
export type IncomeCategory = 'rent' | 'utility' | 'other';
export type ExpenseCategory = 'repair' | 'tax' | 'service' | 'maintenance' | 'other';
export type PaymentStatus = 'pending' | 'waiting_approval' | 'paid' | 'overdue';

export interface FinancialRecord {
  id: string;
  assetId?: string;
  contractId?: string;
  type: FinanceType;
  category: IncomeCategory | ExpenseCategory;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  contractId: string;
  amount: number;
  type: 'rent' | 'deposit' | 'utility' | 'other';
  dueDate: string;
  paidDate?: string;
  status: PaymentStatus;
  proofImages?: string[]; // รูปภาพหลักฐานการโอนเงิน
  receiptNumber?: string; // เลขที่ใบเสร็จ
  receiptDate?: string; // วันที่ออกใบเสร็จ
  paymentMethod?: string; // วิธีการชำระเงิน
  rejectionReason?: string; // เหตุผลในการปฏิเสธ
  createdAt: string;
  updatedAt: string;
}

