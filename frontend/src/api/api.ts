import axios from 'axios';
import type { Transaction, TransactionFilters, Category, Budget, AdminUser, AppNotification, SavingsGoal } from '../types';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('expense_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('expense_token');
      localStorage.removeItem('expense_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const profileAPI = {
  update: (data: { name?: string; email?: string }) =>
    api.put('/auth/profile', data),
};

export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  register: (username: string, password: string, name?: string, email?: string) =>
    api.post('/auth/register', { username, password, name, email }),
  googleLogin: (credential: string) =>
    api.post('/auth/google', { credential }),
  me: () => api.get('/auth/me'),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  deleteAccount: () =>
    api.delete('/auth/account'),
  exportData: () =>
    api.get('/auth/export-data'),
};

export const transactionsAPI = {
  getAll: (filters: TransactionFilters) =>
    api.get<Transaction[]>('/transactions', { params: filters }),
  getSummary: (year: number, month: number) =>
    api.get('/transactions/summary', { params: { year, month } }),
  getAccumulated: () =>
    api.get<{
      totalIncome: number;
      totalExpenses: number;
      totalBalance: number;
      history: { year: number; month: number; income: number; expenses: number; balance: number; accumulated: number }[];
    }>('/transactions/accumulated'),
  getByCategory: (year: number, month?: number) =>
    api.get<{ name: string; color: string; value: number }[]>('/transactions/by-category', { params: { year, month } }),
  create: (data: Partial<Transaction>) =>
    api.post<Transaction>('/transactions', data),
  update: (id: number, data: Partial<Transaction>) =>
    api.put<Transaction>(`/transactions/${id}`, data),
  delete: (id: number) =>
    api.delete(`/transactions/${id}`),
  deleteBulk: (year: number, month: number) =>
    api.delete('/transactions/bulk', { params: { year, month } }),
};

export const budgetsAPI = {
  getAll: () => api.get<Budget[]>('/budgets'),
  getProgress: (year: number, month: number) =>
    api.get<Budget[]>('/budgets/progress', { params: { year, month } }),
  create: (data: { category_id?: number | null; amount: number; period: string }) =>
    api.post<Budget>('/budgets', data),
  update: (id: number, data: { amount: number; period: string }) =>
    api.put<Budget>(`/budgets/${id}`, data),
  delete: (id: number) => api.delete(`/budgets/${id}`),
};

export const categoriesAPI = {
  getAll: () =>
    api.get<Category[]>('/categories'),
  create: (data: { name: string; color: string }) =>
    api.post<Category>('/categories', data),
  update: (id: number, data: { name?: string; color?: string }) =>
    api.put<Category>(`/categories/${id}`, data),
  delete: (id: number) =>
    api.delete(`/categories/${id}`),
};

export const adminAPI = {
  getUsers: () =>
    api.get<AdminUser[]>('/admin/users'),
  createUser: (data: { username: string; password: string; name?: string; expires_in_days: number }) =>
    api.post<AdminUser>('/admin/users', data),
  approveUser: (id: number) =>
    api.patch<AdminUser>(`/admin/users/${id}/approve`),
  rejectUser: (id: number) =>
    api.patch(`/admin/users/${id}/reject`),
  updateExpiry: (id: number, expires_in_days: number) =>
    api.put<AdminUser>(`/admin/users/${id}`, { expires_in_days }),
  deleteUser: (id: number) =>
    api.delete(`/admin/users/${id}`),
  updatePlan: (id: number, plan: 'free' | 'pro') =>
    api.patch(`/admin/users/${id}/plan`, { plan }),
};

export const savingsAPI = {
  getAll: () =>
    api.get<SavingsGoal[]>('/savings'),
  create: (data: { name: string; target_amount: number; deadline?: string }) =>
    api.post<SavingsGoal>('/savings', data),
  update: (id: number, data: { name?: string; target_amount?: number; deadline?: string }) =>
    api.put<SavingsGoal>(`/savings/${id}`, data),
  deposit: (id: number, amount: number) =>
    api.patch<SavingsGoal>(`/savings/${id}/deposit`, { deposit_amount: amount }),
  delete: (id: number) =>
    api.delete(`/savings/${id}`),
};

export const paymentsAPI = {
  createPreference: () =>
    api.post<{ id: string; init_point: string; sandbox_init_point: string }>('/payments/create-preference'),
  getStatus: () =>
    api.get<{ plan: string; payment_id: string | null; started_at: string | null }>('/payments/status'),
};

export const notificationsAPI = {
  getUpcoming: () =>
    api.get<AppNotification[]>('/notifications/upcoming'),
};
