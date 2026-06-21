import { useState, useEffect } from 'react';
import { savingsAPI } from '../api/api';
import type { SavingsGoal } from '../types';
import Modal from '../components/shared/Modal';
import { useAuth } from '../context/AuthContext';
import { CardsSkeleton } from '../components/shared/Skeleton';
import { useToast } from '../context/ToastContext';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function daysUntil(deadline: string | null) {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  return diff;
}

export default function SavingsPage() {
  const { isPro } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [form, setForm] = useState({ name: '', target_amount: '', deadline: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [depositTarget, setDepositTarget] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<SavingsGoal | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadGoals() {
    try {
      const res = await savingsAPI.getAll();
      setGoals(res.data);
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadGoals(); }, []);

  function openCreate() {
    setEditingGoal(null);
    setForm({ name: '', target_amount: '', deadline: '' });
    setFormError('');
    setFormOpen(true);
  }

  function openEdit(g: SavingsGoal) {
    setEditingGoal(g);
    setForm({ name: g.name, target_amount: String(g.target_amount), deadline: g.deadline || '' });
    setFormError('');
    setFormOpen(true);
  }

  async function handleSave() {
    setFormError('');
    if (!form.name || !form.target_amount || Number(form.target_amount) <= 0) {
      setFormError('Nome e valor da meta são obrigatórios');
      return;
    }
    setSaving(true);
    try {
      if (editingGoal) {
        await savingsAPI.update(editingGoal.id, { name: form.name, target_amount: Number(form.target_amount), deadline: form.deadline || undefined });
      } else {
        await savingsAPI.create({ name: form.name, target_amount: Number(form.target_amount), deadline: form.deadline || undefined });
      }
      setFormOpen(false);
      await loadGoals();
      toast(editingGoal ? 'Meta atualizada com sucesso' : 'Meta criada com sucesso');
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Erro ao salvar meta');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeposit() {
    if (!depositTarget || !depositAmount || Number(depositAmount) <= 0) return;
    setDepositing(true);
    try {
      await savingsAPI.deposit(depositTarget.id, Number(depositAmount));
      setDepositTarget(null);
      setDepositAmount('');
      await loadGoals();
      toast('Depósito realizado com sucesso');
    } catch {} finally {
      setDepositing(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await savingsAPI.delete(deleteTarget.id);
      setDeleteTarget(null);
      await loadGoals();
    } catch {} finally {
      setDeleting(false);
    }
  }

  const canCreate = isPro || goals.length < 3;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Metas de Economia</h2>
          <p className="text-sm text-gray-400 mt-0.5">Defina objetivos e acompanhe seu progresso</p>
        </div>
        <button
          onClick={openCreate}
          disabled={!canCreate}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
          title={canCreate ? '' : 'Limite de 3 metas no plano Free'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Meta
        </button>
      </div>

      {!canCreate && (
        <div className="text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3">
          Limite de 3 metas atingido no plano Free. <a href="/upgrade" className="underline font-semibold">Faça upgrade para o Pro</a> para metas ilimitadas.
        </div>
      )}

      {loading ? (
        <CardsSkeleton count={3} />
      ) : goals.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p>Nenhuma meta de economia criada</p>
          <p className="text-xs mt-1">Crie uma meta para começar a poupar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {goals.map((g) => {
            const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
            const completed = pct >= 100;
            const days = daysUntil(g.deadline);
            const overdue = days !== null && days < 0 && !completed;
            const progressColor = completed ? '#22c55e' : pct >= 75 ? '#eab308' : '#10b981';
            const radius = 38;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (Math.min(pct, 100) / 100) * circumference;

            return (
              <div
                key={g.id}
                className="rounded-2xl p-5 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-black/20 animate-fade-in"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {/* Header: actions */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">{g.name}</h3>
                    {g.deadline && (
                      <p className={`text-xs mt-0.5 ${overdue ? 'text-red-400' : completed ? 'text-green-400' : 'text-gray-500'}`}>
                        {overdue ? `Vencida há ${Math.abs(days!)} dias` : completed ? 'Concluída!' : `${days} dias restantes`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(g)} className="p-1.5 text-gray-500 hover:text-brand-400 hover:bg-brand-900/20 rounded-lg transition-colors" title="Editar">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => setDeleteTarget(g)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors" title="Excluir">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Circular progress + values */}
                <div className="flex items-center gap-5">
                  <div className="relative flex-shrink-0">
                    <svg width="96" height="96" viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                      <circle
                        cx="48" cy="48" r={radius} fill="none"
                        stroke={progressColor} strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                        transform="rotate(-90 48 48)"
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-white">{Math.min(pct, 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Acumulado</p>
                      <p className="text-base font-bold text-white">{fmt(g.current_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Objetivo</p>
                      <p className="text-sm text-gray-300">{fmt(g.target_amount)}</p>
                    </div>
                    {!completed && (
                      <p className="text-xs text-gray-500">
                        Falta <span className="text-white font-medium">{fmt(g.target_amount - g.current_amount)}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Action button */}
                <div className="mt-4">
                  {!completed ? (
                    <button
                      onClick={() => { setDepositTarget(g); setDepositAmount(''); }}
                      className="w-full text-sm px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Depositar
                    </button>
                  ) : (
                    <div className="w-full text-center text-sm px-4 py-2.5 rounded-xl bg-green-500/10 text-green-400 font-semibold flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Meta atingida!
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Criar/Editar meta */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingGoal ? 'Editar Meta' : 'Nova Meta de Economia'}>
        <div className="space-y-4">
          {formError && <div className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{formError}</div>}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Nome da meta *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
              placeholder="Ex: Viagem, Reserva de emergência..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Valor da meta (R$) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.target_amount}
              onChange={(e) => setForm((f) => ({ ...f, target_amount: e.target.value }))}
              className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
              placeholder="5000.00"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Prazo (opcional)</label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancelar</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? 'Salvando...' : editingGoal ? 'Salvar' : 'Criar Meta'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Depositar */}
      <Modal open={!!depositTarget} onClose={() => setDepositTarget(null)} title={`Depositar — ${depositTarget?.name}`} maxWidth="max-w-sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Falta {fmt((depositTarget?.target_amount ?? 0) - (depositTarget?.current_amount ?? 0))} para atingir a meta.
          </p>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
            placeholder="Valor do depósito"
          />
          <div className="flex gap-3">
            <button onClick={() => setDepositTarget(null)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleDeposit} disabled={depositing} className="btn-primary flex-1 disabled:opacity-50">
              {depositing ? 'Depositando...' : 'Depositar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Confirmar exclusão */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Excluir Meta" maxWidth="max-w-sm">
        <div className="space-y-4">
          <p className="text-gray-300">Tem certeza que deseja excluir a meta <span className="font-semibold text-white">"{deleteTarget?.name}"</span>?</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger flex-1 disabled:opacity-50">
              {deleting ? 'Excluindo...' : 'Excluir'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
