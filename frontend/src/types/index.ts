export interface User {
  id: number;
  username: string;
  name?: string | null;
  avatar_url?: string | null;
  is_admin?: boolean;
}

export interface AdminUser {
  id: number;
  username: string;
  name: string | null;
  email: string | null;
  is_admin: number;
  approved: number;
  expires_at: string | null;
  created_at: string;
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
  recurring?: boolean;
  installment_total?: number | null;
  installment_current?: number | null;
  installment_group_id?: number | null;
  created_at: string;
  category_name?: string;
  category_color?: string;
}

export interface Budget {
  id: number;
  user_id: number;
  category_id: number | null;
  amount: number;
  period: 'monthly' | 'annual';
  category_name?: string;
  category_color?: string;
  spent?: number;
  percent?: number;
}

export interface MonthlySummary {
  month: number;
  income: number;
  expenses: number;
  balance: number;
}

export interface CategorySlice {
  name: string;
  color: string;
  value: number;
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
  byCategoryYear: CategorySlice[];
  byCategoryMonth: CategorySlice[];
  largestExpense: number;
}

export interface TransactionFilters {
  month?: number | '';
  year?: number;
  type?: TransactionType | 'all';
  category_id?: number | '';
  date_from?: string;
  date_to?: string;
}

export interface AppNotification {
  id: number;
  description: string;
  amount: number;
  date: string;
  type: 'due_today' | 'due_in_3_days';
}
