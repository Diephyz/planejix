import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { profileAPI, authAPI } from '../api/api';

export default function ProfilePage() {
  const { user, plan, isPro, login: setAuthUser, token } = useAuth();
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Meu Perfil</h2>
        <p className="text-sm text-gray-400 mt-0.5">Gerencie suas informações pessoais</p>
      </div>

      {/* Avatar + Plan */}
      <div className="card flex items-center gap-5">
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt="avatar" className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 ring-2 ring-brand-500/30" />
        ) : (
          <div className="w-20 h-20 bg-brand-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 ring-2 ring-brand-500/30">
            {initials}
          </div>
        )}
        <div>
          <h3 className="text-lg font-bold text-white">{displayName}</h3>
          <p className="text-sm text-gray-400">@{user?.username}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
              isPro ? 'bg-brand-500/20 text-brand-400' : 'bg-gray-500/20 text-gray-400'
            }`}>
              {isPro ? 'PRO' : 'FREE'}
            </span>
            {!isPro && (
              <a href="/upgrade" className="text-xs text-brand-400 hover:text-brand-300 underline">
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
        <div className="grid grid-cols-2 gap-4">
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
            className="block w-full text-center text-sm px-4 py-2.5 rounded-xl bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors font-medium"
          >
            Ver planos e fazer upgrade
          </a>
        )}
      </div>
    </div>
  );
}
