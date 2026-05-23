import { useState, useEffect, useCallback } from 'react';
import { transactionsAPI, categoriesAPI } from '../api/api';
import type { Transaction, Category, TransactionFilters } from '../types';
import TransactionTable from '../components/transactions/TransactionTable';
import TransactionFilters from '../components/transactions/TransactionFilters';
import TransactionForm from '../components/transactions/TransactionForm';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>({ year: currentYear, month: currentMonth, type: 'all', category_id: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoriesAPI.getAll();
      setCategories(res.data);
    } catch {}
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (filters.year) params.year = filters.year;
      if (filters.month) params.month = filters.month as number;
      if (filters.type && filters.type !== 'all') params.type = filters.type;
      if (filters.category_id) params.category_id = filters.category_id as number;
      const res = await transactionsAPI.getAll(params as TransactionFilters);
      setTransactions(res.data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Transações</h2>
          <p className="text-sm text-gray-400 mt-0.5">{transactions.length} registro{transactions.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setFormOpen(true)} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Nova Transação</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card border border-green-500/20 py-3">
          <p className="text-xs text-gray-400">Entradas</p>
          <p className="text-sm font-bold text-green-400 mt-0.5">{fmt(totalIncome)}</p>
        </div>
        <div className="card border border-red-500/20 py-3">
          <p className="text-xs text-gray-400">Saídas</p>
          <p className="text-sm font-bold text-red-400 mt-0.5">{fmt(totalExpense)}</p>
        </div>
        <div className="card border border-brand-500/20 py-3">
          <p className="text-xs text-gray-400">Saldo</p>
          <p className={`text-sm font-bold mt-0.5 ${totalIncome - totalExpense >= 0 ? 'text-white' : 'text-red-400'}`}>
            {fmt(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      <TransactionFilters filters={filters} categories={categories} onChange={setFilters} />

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <TransactionTable transactions={transactions} onRefresh={fetchTransactions} />
      )}

      <TransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={fetchTransactions}
      />
    </div>
  );
}
