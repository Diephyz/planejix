import { useState } from 'react';
import type { Transaction } from '../../types';
import { transactionsAPI } from '../../api/api';
import Modal from '../shared/Modal';
import { getExpenseStatus, STATUS_LABEL } from '../../lib/expenseStatus';

const STATUS_STYLE = {
  paid: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20',
  overdue: 'bg-red-500/10 text-red-400 hover:bg-red-500/20',
} as const;

// Badge de status de despesa (Paga/A pagar/Vencida) — clicável para alternar.
// Receita não renderiza nada.
function StatusBadge({ t, onRefresh }: { t: Transaction; onRefresh: () => void }) {
  const [busy, setBusy] = useState(false);
  const status = getExpenseStatus(t);
  if (!status) return null;

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await transactionsAPI.togglePaid(t.id, status !== 'paid');
      onRefresh();
    } catch {
      // silencioso — badge volta ao estado real no próximo refresh
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      title={status === 'paid' ? 'Clique para marcar como a pagar' : 'Clique para marcar como paga'}
      className={`text-[10px] px-2 py-0.5 rounded-full font-medium cursor-pointer transition-colors disabled:opacity-50 ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </button>
  );
}

interface TableProps {
  transactions: Transaction[];
  onRefresh: () => void;
  onEdit: (transaction: Transaction) => void;
  onAdd?: () => void;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const formatDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');

const kindLabels: Record<string, string> = {
  fixed: 'Fixo',
  variable: 'Variável',
  custom: 'Outros',
};

function MobileCard({ t, onEdit, onDelete, onRefresh }: { t: Transaction; onEdit: () => void; onDelete: () => void; onRefresh: () => void }) {
  const catColor = t.category_color || (t.type === 'income' ? '#10B981' : '#6366f1');
  return (
    <div
      className="p-3.5 rounded-xl transition-colors bg-white dark:bg-dark-800/50 border border-gray-100 dark:border-white/5"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: `${catColor}15` }}>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: catColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{t.description}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {formatDate(t.date)}
                {t.category_name && <span> · {t.category_name}</span>}
                {t.kind && <span> · {kindLabels[t.kind]}</span>}
              </p>
            </div>
            <span className={`text-[13px] font-bold flex-shrink-0 ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
            </span>
          </div>
          {t.notes && <p className="text-[11px] text-gray-500 mt-1 truncate">{t.notes}</p>}
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge t={t} onRefresh={onRefresh} />
            {!!t.recurring && (
              <span className="text-[10px] text-brand-500 bg-brand-600/10 px-2 py-0.5 rounded-full font-medium">Recorrente</span>
            )}
            {t.installment_total && t.installment_current && (
              <span className="text-[10px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full font-medium">
                {t.installment_current}/{t.installment_total}x
              </span>
            )}
            <div className="ml-auto flex items-center gap-1">
              <button onClick={onEdit} className="p-1.5 text-gray-500 hover:text-brand-500 rounded-lg transition-colors cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button onClick={onDelete} className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransactionTable({ transactions, onRefresh, onEdit, onAdd }: TableProps) {
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const handleDelete = async () => {
    if (confirmId === null) return;
    setDeleting(confirmId);
    setConfirmId(null);
    try {
      await transactionsAPI.delete(confirmId);
      onRefresh();
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="card text-center py-16 animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-brand-600/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-gray-900 dark:text-white font-semibold">Nenhuma transação encontrada</p>
        <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">Tente outros filtros ou registre sua primeira movimentação</p>
        {onAdd && (
          <button onClick={onAdd} className="btn-primary mt-5 inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova transação
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Mobile: card layout */}
      <div className="space-y-2 sm:hidden">
        {transactions.map((t) => (
          <MobileCard
            key={t.id}
            t={t}
            onEdit={() => onEdit(t)}
            onDelete={() => setConfirmId(t.id)}
            onRefresh={onRefresh}
          />
        ))}
      </div>

      {/* Desktop: table layout */}
      <div className="card overflow-x-auto p-0 hidden sm:block">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="text-left" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <th className="text-gray-400 font-medium px-5 py-3">Data</th>
              <th className="text-gray-400 font-medium px-5 py-3">Descrição</th>
              <th className="text-gray-400 font-medium px-5 py-3 hidden md:table-cell">Categoria</th>
              <th className="text-gray-400 font-medium px-5 py-3">Tipo</th>
              <th className="text-gray-400 font-medium px-5 py-3 text-right">Valor</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="last:border-0 hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3 text-gray-400 whitespace-nowrap">{formatDate(t.date)}</td>
                <td className="px-5 py-3 font-medium text-gray-900 dark:text-white max-w-[200px]">
                  <span className="truncate block">{t.description}</span>
                  {t.notes && <span className="text-xs text-gray-500 truncate block">{t.notes}</span>}
                  {!!t.recurring && (
                    <span className="text-xs text-brand-500 flex items-center gap-1 mt-0.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Recorrente
                    </span>
                  )}
                  {t.installment_total && t.installment_current && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold mt-0.5 px-1.5 py-0.5 rounded-md bg-orange-500/15 text-orange-400 w-fit">
                      {t.installment_current}/{t.installment_total}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 hidden md:table-cell">
                  {t.category_name ? (
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.category_color || '#6b7280' }} />
                      <span className="text-gray-700 dark:text-gray-300">{t.category_name}</span>
                    </span>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                      t.type === 'income' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {t.type === 'income' ? 'Entrada' : 'Saída'}
                    </span>
                    <StatusBadge t={t} onRefresh={onRefresh} />
                  </div>
                </td>
                <td className={`px-5 py-3 text-right font-semibold whitespace-nowrap ${
                  t.type === 'income' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(t)}
                      className="p-1.5 text-gray-500 hover:text-brand-500 hover:bg-brand-700/20 rounded-lg transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setConfirmId(t.id)}
                      disabled={deleting === t.id}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={confirmId !== null} onClose={() => setConfirmId(null)} title="Excluir Transação" maxWidth="max-w-sm">
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">Tem certeza que deseja excluir esta transação?</p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmId(null)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleDelete} className="btn-danger flex-1">Excluir</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
