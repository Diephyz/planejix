import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from '../components/auth/GoogleLoginButton';

const WA_NUMBER = '5577988023474';

function WhatsAppButton({ message }: { message: string }) {
  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      Solicitar Liberação pelo WhatsApp
    </a>
  );
}

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
                  <label className="label">Usuário ou E-mail</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Seu usuário ou e-mail"
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

              <div className="mt-5 space-y-3">
                <div className="relative flex items-center gap-3">
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
              <div className="space-y-3">
                <button
                  onClick={() => switchTab('login')}
                  className="btn-primary px-6"
                >
                  Voltar ao login
                </button>
              </div>
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
                  <label className="label">Nome</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Seu nome completo"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    autoComplete="name"
                    required
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
                  <label className="label">E-mail</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="seu@email.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    autoComplete="email"
                    required
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

              <div className="mt-4">
                <div className="relative flex items-center gap-3 mb-3">
                  <div className="flex-1 h-px bg-dark-600" />
                  <span className="text-xs text-gray-500">precisa de ajuda?</span>
                  <div className="flex-1 h-px bg-dark-600" />
                </div>
                <WhatsAppButton message="Olá! Gostaria de solicitar a liberação do meu acesso no Planejix." />
              </div>
            </>
          )}
        </div>
      </div>
      <p className="text-center text-xs text-gray-500 mt-6">Diephyz Corporation ©</p>
    </div>
  );
}
