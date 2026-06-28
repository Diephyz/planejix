import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  {
    to: '/',
    label: 'Home',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    to: '/transactions',
    label: 'Transações',
    icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  },
  {
    to: '/budgets',
    label: 'Metas',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    to: '/savings',
    label: 'Economia',
    icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    to: '/profile',
    label: 'Perfil',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
];

export default function BottomNav() {
  const location = useLocation();
  if (location.pathname === '/login') return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden flex items-center justify-around h-16 bg-white dark:bg-dark-950"
      style={{
        borderTop: '1px solid rgba(0,0,0,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {navItems.map((item) => {
        const isActive = item.to === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(item.to);
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex flex-col items-center gap-0.5 py-2 px-3 min-w-0 transition-colors duration-200"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke={isActive ? '#34d399' : '#6b7280'}
              viewBox="0 0 24 24"
              strokeWidth={isActive ? 2 : 1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            <span
              className={`text-[10px] font-medium truncate ${isActive ? 'text-brand-500' : 'text-gray-500'}`}
            >
              {item.label}
            </span>
            {isActive && (
              <div className="w-1 h-1 rounded-full bg-brand-500 mt-0.5" />
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
