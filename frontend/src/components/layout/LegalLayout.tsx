import { Link, Outlet } from 'react-router-dom';

// Casca pública para páginas legais (/privacy, /terms): acessíveis sem login,
// com visual alinhado à landing. Exigência de lojas/OAuth: termos e privacidade
// precisam estar disponíveis para visitantes deslogados.
export default function LegalLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <nav className="flex items-center justify-between px-4 sm:px-6 py-4 max-w-6xl mx-auto">
        <Link to="/">
          <img src="/logo.png" alt="Planejix" className="h-10 sm:h-12 w-auto" />
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium transition-colors hidden sm:block">
            Início
          </Link>
          <Link
            to="/login"
            className="text-sm font-medium px-4 py-2 rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
          >
            Entrar
          </Link>
        </div>
      </nav>
      <main className="px-4 sm:px-6 py-8 pb-16">
        <Outlet />
      </main>
    </div>
  );
}
