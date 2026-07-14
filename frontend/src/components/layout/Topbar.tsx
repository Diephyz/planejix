import { useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';

interface TopbarProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transações',
  '/budgets': 'Metas Financeiras',
  '/savings': 'Economia',
  '/categories': 'Categorias',
  '/import': 'Importar Excel',
  '/profile': 'Meu Perfil',
  '/upgrade': 'Planos',
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  const location = useLocation();
  const title = pageTitles[location.pathname] ?? 'Planejix';

  return (
    <header
      // padding acompanha o do <main> (p-3/sm:p-4/md:p-6) para as bordas alinharem
      className="h-16 flex items-center relative px-3 sm:px-4 md:px-6 gap-3 sticky top-0 z-10 bg-white dark:bg-dark-950"
      style={{
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-1 rounded-xl text-gray-500 hover:text-gray-900 dark:text-white hover:bg-white/[0.05] transition-all cursor-pointer"
        aria-label="Abrir menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile: logo centralizado — a página já mostra o próprio título no conteúdo,
          então o texto aqui duplicava e desalinhava o topo */}
      <img
        src="/logo.png"
        alt="Planejix"
        className="h-9 w-auto lg:hidden absolute left-1/2 -translate-x-1/2"
      />

      {/* Desktop: nome da página (o logo já está na sidebar) */}
      <h1 className="text-base font-semibold text-gray-900 dark:text-white hidden lg:block truncate">{title}</h1>

      <div className="ml-auto flex items-center gap-3">
        <NotificationBell />
        <span className="text-[11px] text-gray-600 hidden sm:block font-medium">Diephyz Corporation ©</span>
      </div>
    </header>
  );
}
