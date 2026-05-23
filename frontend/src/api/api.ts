import axios from 'axios';
import type { Transaction, TransactionFilters, Category } from '../types';

const api = axios.create({ baseURL: '/api' });

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

export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  register: (username: string, password: string) =>
    api.post('/auth/register', { username, password }),
  googleLogin: (credential: string) =>
    api.post('/auth/google', { credential }),
};

export const transactionsAPI = {
  getAll: (filters: TransactionFilters) =>
    api.get<Transaction[]>('/transactions', { params: filters }),
  getSummary: (year: number) =>
    api.get('/transactions/summary', { params: { year } }),
  create: (data: Partial<Transaction>) =>
    api.post<Transaction>('/transactions', data),
  delete: (id: number) =>
    api.delete(`/transactions/${id}`),
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
