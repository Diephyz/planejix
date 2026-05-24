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
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [regUsername, setRegUsername] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

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
    setRegError('');
    setRegLoading(true);
    try {
      await authAPI.register(regUsername, regPassword, regName || undefined, regEmail || undefined);
      setRegSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setRegError(msg || 'Erro ao criar conta');
    } finally {
      setRegLoading(false);
    }
  };

  const switchTab = (next: 'login' | 'register') => {
    setTab(next);
    setError('');
    setRegError('');
    setRegSuccess(false);
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
          <div className="flex border-b border-dark-600 mb-5 -mx-6 px-6">
            <button
              onClick={() => switchTab('login')}
              className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${
                tab === 'login'
                  ? 'text-brand-400 border-brand-400'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => switchTab('register')}
              className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${
                tab === 'register'
                  ? 'text-brand-400 border-brand-400'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              Criar conta
            </button>
          </div>

          {tab === 'login' ? (
            <>
              {error && (
                <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

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

              <div className="mt-5">
                <div className="relative flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-dark-600" />
                  <span className="text-xs text-gray-500">ou continue com</span>
                  <div className="flex-1 h-px bg-dark-600" />
                </div>
                <GoogleLoginButton />
              </div>
            </>
          ) : regSuccess ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Cadastro enviado!</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Seu cadastro foi recebido com sucesso.<br />
                Aguarde a aprovação do administrador para acessar o sistema.
              </p>
              <button
                onClick={() => switchTab('login')}
                className="btn-primary px-6"
              >
                Voltar ao login
              </button>
            </div>
          ) : (
            <>
              {regError && (
                <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
                  {regError}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="label">Nome (opcional)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Seu nome completo"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className="label">Usuário</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Mínimo 3 caracteres"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
                <div>
                  <label className="label">E-mail (opcional)</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="seu@email.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="label">Senha</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Mínimo 6 caracteres"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <button type="submit" className="btn-primary w-full mt-2" disabled={regLoading}>
                  {regLoading ? 'Criando conta...' : 'Criar conta'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <p className="text-center text-xs text-gray-500 mt-6">Diephyz Corporation ©</p>
    </div>
  );
}
