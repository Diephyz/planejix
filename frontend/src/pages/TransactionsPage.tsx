import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { transactionsAPI, categoriesAPI } from '../api/api';
import type { Transaction, Category, TransactionFilters } from '../types';
import TransactionTable from '../components/transactions/TransactionTable';
import TransactionFiltersComponent from '../components/transactions/TransactionFilters';
import TransactionForm from '../components/transactions/TransactionForm';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const PAGE_SIZE = 10;

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>({ year: currentYear, month: currentMonth, type: 'all', category_id: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoriesAPI.getAll();
      setCategories(res.data);
    } catch {}
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params: TransactionFilters = {};
      if (filters.year) params.year = filters.year;
      if (filters.month) params.month = filters.month as number;
      if (filters.type && filters.type !== 'all') params.type = filters.type;
      if (filters.category_id) params.category_id = filters.category_id as number;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      const res = await transactionsAPI.getAll(params);
      setTransactions(res.data);
      setPage(1);
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

  // Pagination
  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const paginated = transactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingTransaction(undefined);
  };

  const exportToExcel = () => {
    const kindLabel = (k: string | null | undefined) => {
      if (k === 'fixed') return 'Fixo';
      if (k === 'variable') return 'Variável';
      if (k === 'custom') return 'Personalizado';
      return '';
    };
    const data = transactions.map((t) => ({
      Data: t.date,
      Descrição: t.description,
      Tipo: t.type === 'income' ? 'Entrada' : 'Saída',
      Subtipo: kindLabel(t.kind),
      Categoria: t.category_name || '',
      'Valor (R$)': t.amount,
      Observações: t.notes || '',
      Recorrente: t.recurring ? 'Sim' : 'Não',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transações');
    XLSX.writeFile(wb, `planejix_transacoes_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white dark:text-white">Transações</h2>
          <p className="text-sm text-gray-400 mt-0.5">{transactions.length} registro{transactions.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="btn-secondary flex items-center gap-2 text-sm"
            title="Exportar para Excel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">Exportar Excel</span>
          </button>
          <button onClick={() => { setEditingTransaction(undefined); setFormOpen(true); }} className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Nova Transação</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>
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

      <TransactionFiltersComponent filters={filters} categories={categories} onChange={setFilters} />

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <TransactionTable transactions={paginated} onRefresh={fetchTransactions} onEdit={handleEdit} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Página {page} de {totalPages} — {transactions.length} registros
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-dark-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-dark-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
                      acc.push('...');
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          page === p
                            ? 'bg-brand-500 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-dark-700'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-dark-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-dark-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <TransactionForm
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={fetchTransactions}
        transaction={editingTransaction}
      />
    </div>
  );
}
