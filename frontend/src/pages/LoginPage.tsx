import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from '../components/auth/GoogleLoginButton';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const switchTab = (t: 'login' | 'register') => {
    setTab(t);
    setError('');
    setUsername('');
    setName('');
    setPassword('');
    setConfirm('');
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login(username, password);
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('As senhas não coincidem');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.register(username, password, name.trim() || undefined);
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Planejix" className="h-52 w-auto mx-auto mb-3" />
          <p className="text-gray-400">Controle seus gastos com facilidade</p>
        </div>

        <div className="card">
          {/* Tabs */}
          <div className="flex bg-dark-700 rounded-lg p-1 mb-6">
            <button
              onClick={() => switchTab('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === 'login'
                  ? 'bg-brand-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => switchTab('register')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === 'register'
                  ? 'bg-brand-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Criar conta
            </button>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label">Usuário</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              <div>
                <label className="label">Senha</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="label">Nome completo</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Usuário</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Mínimo 3 caracteres"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  minLength={3}
                  required
                />
              </div>
              <div>
                <label className="label">Senha</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div>
                <label className="label">Confirmar senha</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Repita a senha"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
                {loading ? 'Criando conta...' : 'Criar conta'}
              </button>
            </form>
          )}

          <div className="mt-5">
            <div className="relative flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-dark-600" />
              <span className="text-xs text-gray-500">ou continue com</span>
              <div className="flex-1 h-px bg-dark-600" />
            </div>
            <GoogleLoginButton />
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-gray-500 mt-6">Diephyz Corporation ©</p>
    </div>
  );
}
