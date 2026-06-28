import { useState, type FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/api';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(email);
      setMessage(res.data.message);
    } catch {
      setMessage('Se o e-mail estiver cadastrado, você receberá instruções.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('As senhas não coincidem');
      return;
    }
    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword(token!, password);
      setMessage('Senha redefinida com sucesso!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-dark-950">
      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="Planejix" className="h-24 w-auto mx-auto mb-2" />
        </div>

        <div className="rounded-2xl p-6 bg-white dark:bg-dark-900 border border-gray-200 dark:border-emerald-900/30 shadow-xl">
          {token ? (
            <>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Nova senha</h2>
              <p className="text-sm text-gray-400 mb-5">Digite sua nova senha abaixo</p>

              {message && <div className="bg-green-900/30 border border-green-700 text-green-400 px-4 py-3 rounded-lg mb-4 text-sm">{message}</div>}
              {error && <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="label">Nova senha</label>
                  <input type="password" className="input-field" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Confirmar senha</label>
                  <input type="password" className="input-field" placeholder="Repita a senha" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? 'Redefinindo...' : 'Redefinir senha'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Esqueceu a senha?</h2>
              <p className="text-sm text-gray-400 mb-5">Informe seu e-mail para receber o link de redefinição</p>

              {message && <div className="bg-green-900/30 border border-green-700 text-green-400 px-4 py-3 rounded-lg mb-4 text-sm">{message}</div>}
              {error && <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <label className="label">E-mail</label>
                  <input type="email" className="input-field" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar link de redefinição'}
                </button>
              </form>
            </>
          )}

          <button onClick={() => navigate('/login')} className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer">
            Voltar ao login
          </button>
        </div>
      </div>
    </div>
  );
}
