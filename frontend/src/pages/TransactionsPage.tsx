import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { transactionsAPI, categoriesAPI } from '../api/api';
import type { Transaction, Category, TransactionFilters } from '../types';
import TransactionTable from '../components/transactions/TransactionTable';
import TransactionFiltersComponent from '../components/transactions/TransactionFilters';
import TransactionForm from '../components/transactions/TransactionForm';
import { TableSkeleton } from '../components/shared/Skeleton';
import { useToast } from '../context/ToastContext';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const PAGE_SIZE = 10;

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function TransactionsPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>({ year: currentYear, month: currentMonth, type: 'all', category_id: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deleteMonthOpen, setDeleteMonthOpen] = useState(false);
  const [deletingMonth, setDeletingMonth] = useState(false);

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

  const handleDeleteMonth = async () => {
    if (!filters.year || !filters.month) return;
    setDeletingMonth(true);
    try {
      const res = await transactionsAPI.deleteBulk(filters.year, filters.month as number);
      setDeleteMonthOpen(false);
      await fetchTransactions();
      toast(`${res.data.deleted} transação(ões) apagada(s) de ${MONTH_NAMES[(filters.month as number) - 1]}/${filters.year}`);
    } catch {
      toast('Erro ao apagar transações do mês');
    } finally {
      setDeletingMonth(false);
    }
  };

  const exportToExcel = () => {
    const kindLabel = (k: string | null | undefined) => {
      if (k === 'fixed') return 'Fixo';
      if (k === 'variable') return 'Variável';
      if (k === 'custom') return 'Outros';
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
    <div className="space-y-5 pb-20 lg:pb-0">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white dark:text-gray-900 dark:text-white">Transações</h2>
          <p className="text-sm text-gray-400 mt-0.5">{transactions.length} registro{transactions.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {filters.month && transactions.length > 0 && (
            <button
              onClick={() => setDeleteMonthOpen(true)}
              className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl font-medium transition-all text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20"
              title="Apagar todas as transações do mês selecionado"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="hidden sm:inline">Apagar mês</span>
            </button>
          )}
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
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl p-3 sm:p-4" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
          <p className="text-[10px] sm:text-xs text-gray-400">Entradas</p>
          <p className="text-xs sm:text-sm font-bold text-emerald-400 mt-0.5">{fmt(totalIncome)}</p>
        </div>
        <div className="rounded-xl p-3 sm:p-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
          <p className="text-[10px] sm:text-xs text-gray-400">Saídas</p>
          <p className="text-xs sm:text-sm font-bold text-red-400 mt-0.5">{fmt(totalExpense)}</p>
        </div>
        <div className="rounded-xl p-3 sm:p-4" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}>
          <p className="text-[10px] sm:text-xs text-gray-400">Saldo</p>
          <p className={`text-xs sm:text-sm font-bold mt-0.5 ${totalIncome - totalExpense >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-400'}`}>
            {fmt(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      <TransactionFiltersComponent filters={filters} categories={categories} onChange={setFilters} />

      {loading ? (
        <TableSkeleton rows={6} />
      ) : (
        <>
          <TransactionTable transactions={paginated} onRefresh={fetchTransactions} onEdit={handleEdit} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">
                Página {page} de {totalPages} — {transactions.length} registros
              </p>
              <p className="text-xs text-gray-500 sm:hidden">{page}/{totalPages}</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:text-white hover:bg-dark-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:text-white hover:bg-dark-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
                            ? 'bg-brand-600 text-gray-900 dark:text-white'
                            : 'text-gray-400 hover:text-gray-900 dark:text-white hover:bg-dark-700'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:text-white hover:bg-dark-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:text-white hover:bg-dark-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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

      {/* Modal: Apagar mês */}
      {deleteMonthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteMonthOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl p-6 animate-scale-in bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Apagar transações do mês</h3>
                <p className="text-xs text-gray-500 mt-0.5">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <p className="text-[13px] text-gray-600 dark:text-gray-300 mb-5">
              Tem certeza que deseja apagar <strong className="text-gray-900 dark:text-white">todas as {transactions.length} transações</strong> de{' '}
              <strong className="text-red-500">
                {MONTH_NAMES[(filters.month as number) - 1]}/{filters.year}
              </strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteMonthOpen(false)}
                disabled={deletingMonth}
                className="btn-secondary flex-1 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteMonth}
                disabled={deletingMonth}
                className="flex-1 text-sm py-2.5 rounded-xl font-medium text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
              >
                {deletingMonth ? 'Apagando...' : 'Apagar tudo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
