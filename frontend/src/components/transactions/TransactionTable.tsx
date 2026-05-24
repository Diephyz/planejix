import { useState } from 'react';
import type { Transaction } from '../../types';
import { transactionsAPI } from '../../api/api';
import Modal from '../shared/Modal';

interface TableProps {
  transactions: Transaction[];
  onRefresh: () => void;
  onEdit: (transaction: Transaction) => void;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const formatDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');

const kindLabels: Record<string, string> = {
  fixed: 'Fixo',
  variable: 'Variável',
  custom: 'Personalizado',
};

export default function TransactionTable({ transactions, onRefresh, onEdit }: TableProps) {
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
      <div className="card text-center py-12 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p>Nenhuma transação encontrada</p>
        <p className="text-xs mt-1">Tente outros filtros ou adicione uma transação</p>
      </div>
    );
  }

  return (
    <>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-600 text-left">
              <th className="text-gray-400 font-medium px-5 py-3">Data</th>
              <th className="text-gray-400 font-medium px-5 py-3">Descrição</th>
              <th className="text-gray-400 font-medium px-5 py-3 hidden md:table-cell">Categoria</th>
              <th className="text-gray-400 font-medium px-5 py-3 hidden sm:table-cell">Tipo</th>
              <th className="text-gray-400 font-medium px-5 py-3 text-right">Valor</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-dark-700 last:border-0 hover:bg-dark-700/40 transition-colors">
                <td className="px-5 py-3 text-gray-400 whitespace-nowrap">{formatDate(t.date)}</td>
                <td className="px-5 py-3 font-medium text-white max-w-[200px]">
                  <span className="truncate block">{t.description}</span>
                  {t.notes && <span className="text-xs text-gray-500 truncate block">{t.notes}</span>}
                  {!!t.recurring && (
                    <span className="text-xs text-brand-400 flex items-center gap-1 mt-0.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Recorrente
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 hidden md:table-cell">
                  {t.category_name ? (
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: t.category_color || '#6b7280' }}
                      />
                      <span className="text-gray-300">{t.category_name}</span>
                    </span>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="px-5 py-3 hidden sm:table-cell">
                  <div className="flex flex-col gap-0.5">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium w-fit ${
                      t.type === 'income'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {t.type === 'income' ? 'Entrada' : 'Saída'}
                    </span>
                    {t.kind && (
                      <span className="text-xs text-gray-500">{kindLabels[t.kind]}</span>
                    )}
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
                      className="p-1.5 text-gray-500 hover:text-brand-400 hover:bg-brand-900/20 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setConfirmId(t.id)}
                      disabled={deleting === t.id}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Excluir"
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

      {/* Delete confirmation modal */}
      <Modal open={confirmId !== null} onClose={() => setConfirmId(null)} title="Excluir Transação" maxWidth="max-w-sm">
        <div className="space-y-4">
          <p className="text-gray-300">Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.</p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmId(null)} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button onClick={handleDelete} className="btn-danger flex-1">
              Excluir
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
