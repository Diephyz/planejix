export interface User {
  id: number;
  username: string;
}

export type TransactionType = 'income' | 'expense';
export type ExpenseKind = 'fixed' | 'variable' | 'custom';

export interface Category {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  category_id: number | null;
  type: TransactionType;
  kind: ExpenseKind | null;
  description: string;
  amount: number;
  date: string;
  notes?: string;
  created_at: string;
  category_name?: string;
  category_color?: string;
}

export interface MonthlySummary {
  month: number;
  income: number;
  expenses: number;
  balance: number;
}

export interface AnnualSummary {
  monthly: MonthlySummary[];
  annual: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
  };
  byKind: {
    fixed: number;
    variable: number;
    custom: number;
  };
  largestExpense: number;
}

export interface TransactionFilters {
  month?: number | '';
  year?: number;
  type?: TransactionType | 'all';
  category_id?: number | '';
}
