import { useLocation } from 'react-router-dom';

interface TopbarProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/transactions': 'Transações',
  '/categories': 'Categorias',
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  const location = useLocation();
  const title = pageTitles[location.pathname] ?? 'Planejix - Carteira Inteligente';

  return (
    <header className="h-16 bg-dark-800 border-b border-dark-600 flex items-center px-4 gap-4 sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-700 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <h1 className="text-lg font-semibold text-white">{title}</h1>
    </header>
  );
}
