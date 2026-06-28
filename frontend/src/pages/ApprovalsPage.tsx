import { useState, useEffect } from 'react';
import { adminAPI } from '../api/api';
import type { AdminUser } from '../types';
import Modal from '../components/shared/Modal';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function UserAvatar({ name, username }: { name: string | null; username: string }) {
  const display = name || username;
  const initials = display.charAt(0).toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-gray-900 dark:text-white font-bold text-sm flex-shrink-0">
      {initials}
    </div>
  );
}

export default function ApprovalsPage() {
  const [pending, setPending] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminUser | null>(null);
  const [rejecting, setRejecting] = useState(false);

  async function loadPending() {
    try {
      const res = await adminAPI.getUsers();
      setPending(res.data.filter((u) => !u.is_admin && !u.approved));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPending(); }, []);

  async function handleApprove(user: AdminUser) {
    setApprovingId(user.id);
    try {
      await adminAPI.approveUser(user.id);
      setPending((prev) => prev.filter((u) => u.id !== user.id));
    } catch {
      // silent
    } finally {
      setApprovingId(null);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      await adminAPI.rejectUser(rejectTarget.id);
      setPending((prev) => prev.filter((u) => u.id !== rejectTarget.id));
      setRejectTarget(null);
    } catch {
      // silent
    } finally {
      setRejecting(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-20 lg:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Aprovações</h1>
        <p className="text-sm text-gray-500 mt-1">
          Cadastros aguardando liberação de acesso
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : pending.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-400 font-medium">Nenhum cadastro pendente</p>
          <p className="text-gray-500 text-sm mt-1">Todos os usuários foram revisados.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Usuário</th>
                  <th className="px-4 py-3 text-left">Cadastro</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {pending.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={u.name} username={u.username} />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{u.username}</p>
                          {u.name && <p className="text-xs text-gray-500">{u.name}</p>}
                          {u.email && <p className="text-xs text-gray-500">{u.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(u)}
                          disabled={approvingId === u.id}
                          title="Aprovar"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/25 transition-colors text-xs font-medium disabled:opacity-50"
                        >
                          {approvingId === u.id ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          Aprovar
                        </button>
                        <button
                          onClick={() => setRejectTarget(u)}
                          title="Recusar"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/25 transition-colors text-xs font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Recusar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {pending.map((u) => (
              <div key={u.id} className="card">
                <div className="flex items-start gap-3 mb-4">
                  <UserAvatar name={u.name} username={u.username} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">{u.username}</p>
                    {u.name && <p className="text-sm text-gray-500 truncate">{u.name}</p>}
                    {u.email && <p className="text-xs text-gray-500 truncate">{u.email}</p>}
                    <p className="text-xs text-gray-400 mt-1">Cadastrado em {formatDate(u.created_at)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(u)}
                    disabled={approvingId === u.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/25 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {approvingId === u.id ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    Aprovar
                  </button>
                  <button
                    onClick={() => setRejectTarget(u)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/25 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Recusar cadastro"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            Tem certeza que deseja recusar o cadastro de{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{rejectTarget?.username}</span>?
            O usuário será removido e precisará se cadastrar novamente.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setRejectTarget(null)}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-900 dark:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleReject}
              disabled={rejecting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-gray-900 dark:text-white text-sm font-medium rounded-lg transition-colors"
            >
              {rejecting ? 'Recusando...' : 'Recusar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
