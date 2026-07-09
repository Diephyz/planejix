import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { profileAPI, authAPI } from '../api/api';
import Modal from '../components/shared/Modal';

/** Redimensiona a imagem no navegador para caber no limite do backend. */
function resizeImage(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas não suportado'));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Arquivo não é uma imagem válida'));
    };
    img.src = url;
  });
}

export default function ProfilePage() {
  const { user, plan, isPro, login: setAuthUser, token, logout } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

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

  const handleAvatarFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Escolha um arquivo de imagem (JPG, PNG...)', 'error');
      return;
    }
    setAvatarUploading(true);
    try {
      const dataUrl = await resizeImage(file);
      const res = await profileAPI.updateAvatar(dataUrl);
      if (token) setAuthUser(token, res.data);
      toast('Foto de perfil atualizada');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast(msg || 'Erro ao enviar a foto', 'error');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true);
    try {
      const res = await profileAPI.updateAvatar(null);
      if (token) setAuthUser(token, res.data);
      toast('Foto removida');
    } catch {
      toast('Erro ao remover a foto', 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast('Preencha todos os campos de senha', 'error');
      return;
    }
    if (newPassword.length < 8) {
      toast('A nova senha deve ter pelo menos 8 caracteres', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('A confirmação não confere com a nova senha', 'error');
      return;
    }
    setChangingPassword(true);
    try {
      const res = await profileAPI.changePassword(currentPassword, newPassword);
      // Novo token mantém esta sessão ativa; as demais são desconectadas
      if (res.data.token && user) setAuthUser(res.data.token, user);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast('Senha alterada com sucesso');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast(msg || 'Erro ao alterar a senha', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const displayName = user?.name || user?.username || '';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-5 sm:space-y-6 pb-20 lg:pb-0">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Meu Perfil</h2>
        <p className="text-sm text-gray-400 mt-0.5">Gerencie suas informações pessoais</p>
      </div>

      {/* Avatar + Plan */}
      <div className="card flex flex-col sm:flex-row items-center gap-4 sm:gap-5 text-center sm:text-left">
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="relative group w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-brand-600/30 cursor-pointer disabled:opacity-60"
            title="Alterar foto de perfil"
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-brand-700 flex items-center justify-center text-2xl font-bold text-gray-900 dark:text-white">
                {initials}
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5">
              {avatarUploading ? (
                <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-[10px] text-white font-medium">Alterar</span>
                </>
              )}
            </div>
          </button>
          {user?.avatar_url && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              disabled={avatarUploading}
              className="text-[11px] text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
            >
              Remover foto
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleAvatarFile(e.target.files?.[0])}
          />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{displayName}</h3>
          <p className="text-sm text-gray-400">@{user?.username}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
              isPro ? 'bg-brand-600/20 text-brand-500' : plan === 'expired' ? 'bg-amber-500/20 text-amber-500' : 'bg-gray-500/20 text-gray-400'
            }`}>
              {isPro ? 'PRO' : plan === 'expired' ? 'EXPIRADA' : 'SEM ASSINATURA'}
            </span>
            {!isPro && (
              <a href="/upgrade" className="text-xs text-brand-500 hover:text-brand-500 underline">
                {plan === 'expired' ? 'Renovar' : 'Assinar'}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="card space-y-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Informações pessoais</h3>

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

      {/* Change password */}
      <div className="card space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Alterar senha</h3>
          <p className="text-xs text-gray-500 mt-0.5">Ao trocar a senha, suas outras sessões serão desconectadas</p>
        </div>

        <div>
          <label className="label">Senha atual</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="input-field"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Nova senha</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="label">Confirmar nova senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              placeholder="Repita a nova senha"
              autoComplete="new-password"
            />
          </div>
        </div>

        {newPassword && confirmPassword && newPassword !== confirmPassword && (
          <p className="text-xs text-red-400">As senhas não conferem</p>
        )}

        <div className="flex justify-end pt-1">
          <button
            onClick={handleChangePassword}
            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="btn-primary px-6 disabled:opacity-50"
          >
            {changingPassword ? 'Alterando...' : 'Alterar senha'}
          </button>
        </div>
      </div>

      {/* Plan details */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Sua assinatura</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Transações', value: 'Ilimitado' },
            { label: 'Metas de economia', value: 'Ilimitado' },
            { label: 'Relatório PDF', value: isPro ? 'Sim' : 'Não' },
            { label: 'Lembretes por e-mail', value: isPro ? 'Sim' : 'Não' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between px-3 py-2 rounded-lg bg-dark-700/50">
              <span className="text-xs text-gray-400">{item.label}</span>
              <span className={`text-xs font-semibold ${item.value === 'Não' ? 'text-gray-500' : 'text-gray-900 dark:text-white'}`}>{item.value}</span>
            </div>
          ))}
        </div>
        {!isPro && (
          <a
            href="/upgrade"
            className="block w-full text-center text-sm px-4 py-2.5 rounded-xl bg-brand-600/10 text-brand-500 hover:bg-brand-600/20 transition-colors font-medium"
          >
            Assinar o Planejix Pro — R$ 4,90/mês
          </a>
        )}
      </div>

      {/* LGPD actions */}
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Seus dados (LGPD)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={async () => {
              try {
                const res = await authAPI.exportData();
                const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `planejix_dados_${new Date().toISOString().split('T')[0]}.json`;
                a.click(); URL.revokeObjectURL(url);
                toast('Dados exportados com sucesso');
              } catch { toast('Erro ao exportar dados', 'error'); }
            }}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-gray-300 hover:text-gray-900 dark:text-white hover:bg-white/[0.03] transition-all cursor-pointer"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar meus dados
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.04] transition-all cursor-pointer"
            style={{ border: '1px solid rgba(239,68,68,0.1)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Excluir minha conta
          </button>
        </div>
        <p className="text-[11px] text-gray-600">
          Conforme a LGPD, você pode exportar ou excluir todos os seus dados a qualquer momento.{' '}
          <a href="/privacy" className="text-brand-500 underline">Política de privacidade</a>
        </p>
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

      {/* Delete account modal */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Excluir conta" maxWidth="max-w-sm">
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400 font-medium">Esta ação é irreversível!</p>
            <p className="text-xs text-gray-400 mt-1">Todos os seus dados (transações, categorias, metas, economia) serão excluídos permanentemente.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowDeleteModal(false)} className="btn-secondary flex-1">Cancelar</button>
            <button
              onClick={async () => {
                setDeleting(true);
                try {
                  await authAPI.deleteAccount();
                  logout();
                } catch { toast('Erro ao excluir conta', 'error'); }
                setDeleting(false);
              }}
              disabled={deleting}
              className="btn-danger flex-1"
            >
              {deleting ? 'Excluindo...' : 'Excluir tudo'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
