import { useState, useEffect } from 'react';
import { adminAPI } from '../api/api';
import type { AdminUser } from '../types';
import Modal from '../components/shared/Modal';

const EXPIRY_OPTIONS = [
  { label: '1 dia (teste)', value: 1 },
  { label: '7 dias', value: 7 },
  { label: '30 dias (1 mês)', value: 30 },
  { label: '90 dias (3 meses)', value: 90 },
  { label: '365 dias (1 ano)', value: 365 },
  { label: 'Sem expiração', value: 0 },
];

function getExpiryStatus(expires_at: string | null, is_admin: number, approved: number) {
  if (is_admin) return { label: 'Administrador', color: 'bg-purple-500/20 text-purple-400' };
  if (!approved) return { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400' };
  if (!expires_at) return { label: 'Sem expiração', color: 'bg-green-500/20 text-green-400' };
  const diff = Math.ceil((new Date(expires_at).getTime() - Date.now()) / 86400000);
  if (diff < 0) return { label: 'Expirado', color: 'bg-red-500/20 text-red-400' };
  if (diff <= 3) return { label: `Expira em ${diff}d`, color: 'bg-yellow-500/20 text-yellow-400' };
  return { label: `${diff} dias restantes`, color: 'bg-green-500/20 text-green-400' };
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ username: '', password: '', name: '', expires_in_days: 30 });
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const [renewTarget, setRenewTarget] = useState<AdminUser | null>(null);
  const [renewDays, setRenewDays] = useState(30);
  const [renewing, setRenewing] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [updatingPlanId, setUpdatingPlanId] = useState<number | null>(null);

  async function handlePlanChange(userId: number, plan: 'free' | 'pro') {
    setUpdatingPlanId(userId);
    try {
      await adminAPI.updatePlan(userId, plan);
      await loadUsers();
    } catch {} finally {
      setUpdatingPlanId(null);
    }
  }

  async function loadUsers() {
    try {
      const res = await adminAPI.getUsers();
      setUsers(res.data);
    } catch {
      setError('Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleCreate() {
    setCreateError('');
    if (!createForm.username || !createForm.password) {
      setCreateError('Username e senha são obrigatórios.');
      return;
    }
    setCreating(true);
    try {
      await adminAPI.createUser({
        username: createForm.username,
        password: createForm.password,
        name: createForm.name || undefined,
        expires_in_days: createForm.expires_in_days,
      });
      setCreateOpen(false);
      setCreateForm({ username: '', password: '', name: '', expires_in_days: 30 });
      await loadUsers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setCreateError(msg || 'Erro ao criar usuário.');
    } finally {
      setCreating(false);
    }
  }

  async function handleRenew() {
    if (!renewTarget) return;
    setRenewing(true);
    try {
      await adminAPI.updateExpiry(renewTarget.id, renewDays);
      setRenewTarget(null);
      await loadUsers();
    } catch {
      // silent
    } finally {
      setRenewing(false);
    }
  }

  async function handleApprove(user: AdminUser) {
    setApprovingId(user.id);
    try {
      await adminAPI.approveUser(user.id);
      await loadUsers();
    } catch {
      // silent
    } finally {
      setApprovingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminAPI.deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      await loadUsers();
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Gerenciar Usuários</h1>
          <p className="text-sm text-gray-500 mt-1">Crie e gerencie contas com prazo de validade</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Criar Usuário</span>
          <span className="sm:hidden">Criar</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-400">{error}</div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="text-gray-500 text-xs uppercase" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <tr>
                <th className="px-4 py-3 text-left">Usuário</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Nome</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Validade</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Plano</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Criado em</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {users.map((u) => {
                const status = getExpiryStatus(u.expires_at, u.is_admin, u.approved);
                return (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {u.username}
                      {u.is_admin ? (
                        <span className="ml-2 text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">admin</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{u.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{formatDate(u.expires_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {u.is_admin ? (
                        <span className="text-xs text-purple-400 font-medium">Full</span>
                      ) : (
                        <select
                          value={u.plan || 'free'}
                          onChange={(e) => handlePlanChange(u.id, e.target.value as 'free' | 'pro')}
                          disabled={updatingPlanId === u.id}
                          className="input-field text-xs py-1 px-2 w-20 disabled:opacity-50"
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      {!u.is_admin && (
                        <div className="flex items-center justify-end gap-2">
                          {!u.approved ? (
                            <button
                              onClick={() => handleApprove(u)}
                              disabled={approvingId === u.id}
                              className="text-xs px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors font-medium disabled:opacity-50"
                            >
                              {approvingId === u.id ? 'Aprovando...' : 'Aprovar'}
                            </button>
                          ) : (
                            <button
                              onClick={() => { setRenewTarget(u); setRenewDays(30); }}
                              className="text-xs px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors font-medium"
                            >
                              Renovar
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteTarget(u)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors font-medium"
                          >
                            Excluir
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-10 text-gray-400">Nenhum usuário cadastrado.</div>
          )}
        </div>
      )}

      {/* Modal: Criar usuário */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setCreateError(''); }} title="Criar Usuário">
        <div className="space-y-4">
          {createError && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{createError}</p>
          )}
          <div>
            <label className="label">Nome (opcional)</label>
            <input type="text" value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} className="input-field" placeholder="Nome completo" />
          </div>
          <div>
            <label className="label">Usuário *</label>
            <input type="text" value={createForm.username} onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))} className="input-field" placeholder="nome_usuario" />
          </div>
          <div>
            <label className="label">Senha *</label>
            <input type="password" value={createForm.password} onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))} className="input-field" placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <label className="label">Prazo de validade</label>
            <select value={createForm.expires_in_days} onChange={(e) => setCreateForm((f) => ({ ...f, expires_in_days: Number(e.target.value) }))} className="input-field">
              {EXPIRY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setCreateOpen(false); setCreateError(''); }} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleCreate} disabled={creating} className="btn-primary flex-1">{creating ? 'Criando...' : 'Criar Usuário'}</button>
          </div>
        </div>
      </Modal>

      {/* Modal: Renovar prazo */}
      <Modal open={!!renewTarget} onClose={() => setRenewTarget(null)} title={`Renovar prazo — ${renewTarget?.username}`}>
        <div className="space-y-4">
          <p className="text-[13px] text-gray-400">Selecione o novo prazo de validade a partir de hoje.</p>
          <select value={renewDays} onChange={(e) => setRenewDays(Number(e.target.value))} className="input-field">
            {EXPIRY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setRenewTarget(null)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleRenew} disabled={renewing} className="btn-primary flex-1">{renewing ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </div>
      </Modal>

      {/* Modal: Confirmar exclusão */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Excluir usuário">
        <div className="space-y-4">
          <p className="text-[13px] text-gray-300">
            Tem certeza que deseja excluir <span className="font-semibold text-white">{deleteTarget?.username}</span>?
            Todos os dados serão removidos permanentemente.
          </p>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger flex-1">{deleting ? 'Excluindo...' : 'Excluir'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
