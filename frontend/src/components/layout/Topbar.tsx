import { useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';

interface TopbarProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
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
  const title = pageTitles[location.pathname] ?? 'Planejix - Carteira Inteligente';

  return (
    <header
      className="h-16 flex items-center px-5 gap-4 sticky top-0 z-10 bg-white dark:bg-dark-950"
      style={{
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-white hover:bg-white/[0.05] transition-all cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <h1 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h1>
      <div className="ml-auto flex items-center gap-3">
        <NotificationBell />
        <span className="text-[11px] text-gray-600 hidden sm:block font-medium">Diephyz Corporation ©</span>
      </div>
    </header>
  );
}
