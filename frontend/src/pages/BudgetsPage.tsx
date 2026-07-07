import { useState, useEffect, useCallback } from 'react';
import { budgetsAPI, categoriesAPI } from '../api/api';
import type { Budget, Category } from '../types';
import Modal from '../components/shared/Modal';
import { CardsSkeleton } from '../components/shared/Skeleton';

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface FormData {
  category_id: number | null;
  amount: string;
  period: 'monthly' | 'annual';
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({ category_id: null, amount: '', period: 'monthly' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [budgetsRes, catsRes] = await Promise.all([
        budgetsAPI.getProgress(selectedYear, selectedMonth),
        categoriesAPI.getAll(),
      ]);
      setBudgets(budgetsRes.data);
      setCategories(catsRes.data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditBudget(null);
    setFormData({ category_id: null, amount: '', period: 'monthly' });
    setError('');
    setFormOpen(true);
  };

  const openEdit = (b: Budget) => {
    setEditBudget(b);
    setFormData({ category_id: b.category_id, amount: String(b.amount), period: b.period as 'monthly' | 'annual' });
    setError('');
    setFormOpen(true);
  };

  const handleSave = async () => {
    setError('');
    const amount = parseFloat(formData.amount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      setError('Insira um valor válido');
      return;
    }
    setSaving(true);
    try {
      if (editBudget) {
        await budgetsAPI.update(editBudget.id, { amount, period: formData.period });
      } else {
        await budgetsAPI.create({ category_id: formData.category_id, amount, period: formData.period });
      }
      setFormOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Erro ao salvar meta');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await budgetsAPI.delete(deleteId);
      setDeleteId(null);
      fetchData();
    } catch {
      setDeleteId(null);
    }
  };

  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Metas Financeiras</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Orçamentos de {monthNames[selectedMonth - 1]} {selectedYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="input-field w-36"
          >
            {monthNames.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="input-field w-24"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Nova Meta</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>
      </div>

      {loading ? (
        <CardsSkeleton count={4} />
      ) : budgets.length === 0 ? (
        <div className="card text-center py-16 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-brand-600/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-900 dark:text-white font-semibold">Nenhuma meta criada</p>
          <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">Defina limites de gastos por categoria e acompanhe seu progresso mensal</p>
          <button onClick={openCreate} className="btn-primary mt-5 inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Criar primeira meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const pct = Math.min(b.percent ?? 0, 100);
            const raw = b.percent ?? 0;
            const over = raw > 100;
            const warn = raw >= 80 && !over;
            const barColor = over ? 'bg-red-500' : warn ? 'bg-yellow-500' : 'bg-green-500';
            const textColor = over ? 'text-red-400' : warn ? 'text-yellow-400' : 'text-green-400';

            return (
              <div key={b.id} className="card">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${b.category_color || '#6366f1'}22` }}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b.category_color || '#6366f1' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{b.category_name || 'Geral'}</p>
                      <p className="text-xs text-gray-500">{b.period === 'monthly' ? 'Mensal' : 'Anual'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(b)}
                      className="p-1.5 text-gray-500 hover:text-brand-500 hover:bg-brand-600/10 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteId(b.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-dark-700 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-900 dark:text-white font-medium">{fmt(b.spent ?? 0)}</span>
                    <span className="text-xs text-gray-500 ml-1">de {fmt(b.amount)}</span>
                  </div>
                  <span className={`text-sm font-semibold ${textColor}`}>
                    {raw.toFixed(0)}%
                    {over && <span className="text-xs ml-1">(excedido)</span>}
                  </span>
                </div>

                {over && (
                  <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    Limite excedido em {fmt((b.spent ?? 0) - b.amount)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editBudget ? 'Editar Meta' : 'Nova Meta'}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          {!editBudget && (
            <div>
              <label className="label">Categoria</label>
              <select
                className="input-field"
                value={formData.category_id ?? ''}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">Geral (todas as categorias)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Valor Limite (R$)</label>
            <input
              type="number"
              className="input-field"
              placeholder="0,00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              min="0.01"
              step="0.01"
            />
          </div>
          <div>
            <label className="label">Período</label>
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              {(['monthly', 'annual'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFormData({ ...formData, period: p })}
                  className={`flex-1 py-2.5 text-[13px] font-medium transition-all ${
                    formData.period === p
                      ? 'bg-brand-600/20 text-brand-500'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {p === 'monthly' ? 'Mensal' : 'Anual'}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 px-3 py-2 rounded-lg">{error}</p>
          )}
          <div className="flex gap-3">
            <button onClick={() => setFormOpen(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Salvando...' : editBudget ? 'Atualizar' : 'Criar Meta'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Excluir Meta" maxWidth="max-w-sm">
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">Tem certeza que deseja excluir esta meta?</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleDelete} className="btn-danger flex-1">Excluir</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
