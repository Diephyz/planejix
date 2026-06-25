import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { profileAPI, authAPI } from '../api/api';

export default function ProfilePage() {
  const { user, plan, isPro, login: setAuthUser, token, logout } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      authAPI.me().then((res) => {
        setEmail(res.data.email || '');
        setName(res.data.name || '');
      }).catch(() => {});
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await profileAPI.update({ name: name || undefined, email: email || undefined });
      if (token) setAuthUser(token, res.data);
      toast('Perfil atualizado com sucesso');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast(msg || 'Erro ao atualizar perfil', 'error');
    } finally {
      setSaving(false);
    }
  };

  const displayName = user?.name || user?.username || '';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-5 sm:space-y-6 pb-20 lg:pb-0">
      <div>
        <h2 className="text-xl font-bold text-white">Meu Perfil</h2>
        <p className="text-sm text-gray-400 mt-0.5">Gerencie suas informações pessoais</p>
      </div>

      {/* Avatar + Plan */}
      <div className="card flex flex-col sm:flex-row items-center gap-4 sm:gap-5 text-center sm:text-left">
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt="avatar" className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 ring-2 ring-brand-600/30" />
        ) : (
          <div className="w-20 h-20 bg-brand-700 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 ring-2 ring-brand-600/30">
            {initials}
          </div>
        )}
        <div>
          <h3 className="text-lg font-bold text-white">{displayName}</h3>
          <p className="text-sm text-gray-400">@{user?.username}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
              isPro ? 'bg-brand-600/20 text-brand-500' : 'bg-gray-500/20 text-gray-400'
            }`}>
              {isPro ? 'PRO' : 'FREE'}
            </span>
            {!isPro && (
              <a href="/upgrade" className="text-xs text-brand-500 hover:text-brand-500 underline">
                Fazer upgrade
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="card space-y-5">
        <h3 className="text-sm font-semibold text-white">Informações pessoais</h3>

        <div>
          <label className="label">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="Seu nome completo"
          />
        </div>

        <div>
          <label className="label">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="seu@email.com"
          />
          <p className="text-xs text-gray-500 mt-1">Usado para lembretes de vencimento e relatórios mensais</p>
        </div>

        <div>
          <label className="label">Usuário</label>
          <input
            type="text"
            value={user?.username || ''}
            disabled
            className="input-field opacity-50 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">O nome de usuário não pode ser alterado</p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary px-6 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>

      {/* Plan details */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-white">Seu plano</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Transações/mês', value: isPro ? 'Ilimitado' : '50' },
            { label: 'Metas de economia', value: isPro ? 'Ilimitado' : '3' },
            { label: 'Relatório PDF', value: isPro ? 'Sim' : 'Não' },
            { label: 'Lembretes por e-mail', value: isPro ? 'Sim' : 'Não' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between px-3 py-2 rounded-lg bg-dark-700/50">
              <span className="text-xs text-gray-400">{item.label}</span>
              <span className={`text-xs font-semibold ${item.value === 'Não' ? 'text-gray-500' : 'text-white'}`}>{item.value}</span>
            </div>
          ))}
        </div>
        {!isPro && (
          <a
            href="/upgrade"
            className="block w-full text-center text-sm px-4 py-2.5 rounded-xl bg-brand-600/10 text-brand-500 hover:bg-brand-600/20 transition-colors font-medium"
          >
            Ver planos e fazer upgrade
          </a>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/[0.06] transition-all cursor-pointer"
        style={{ border: '1px solid rgba(239,68,68,0.15)' }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span className="text-sm font-medium">Sair da conta</span>
      </button>
    </div>
  );
}
