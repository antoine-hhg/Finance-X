
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string; // ISO format
  type: TransactionType;
  isRecurring?: boolean;
  recurringId?: string;
}

export interface RecurringTransaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  type: TransactionType;
  dayOfMonth: number;
  lastProcessedMonth?: string; // YYYY-MM
}

export interface Budget {
  category: string;
  limit: number;
}

export interface FinanceData {
  transactions: Transaction[];
  budgets: Budget[];
  recurring: RecurringTransaction[];
  hasSeenLanding?: boolean;
}

export const CATEGORIES = [
  'Groceries',
  'Rent',
  'Salary',
  'Entertainment',
  'Transport',
  'Shopping',
  'Utilities',
  'Dining',
  'Investments',
  'Subscriptions',
  'Other'
];
