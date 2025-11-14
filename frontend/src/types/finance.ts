export type FinanceType = 'income' | 'expense';
export type IncomeCategory = 'rent' | 'utility' | 'other';
export type ExpenseCategory = 'repair' | 'tax' | 'service' | 'maintenance' | 'other';
export type PaymentStatus = 'pending' | 'paid' | 'overdue';

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
  createdAt: string;
  updatedAt: string;
}

