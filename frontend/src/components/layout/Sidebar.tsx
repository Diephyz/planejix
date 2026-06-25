import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/transactions',
    label: 'Transações',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    to: '/budgets',
    label: 'Metas',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    to: '/savings',
    label: 'Economia',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    to: '/categories',
    label: 'Categorias',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    to: '/import',
    label: 'Importar',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout, isAdmin, plan } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const displayName = user?.name || user?.username || '';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-[260px] z-30
          flex flex-col transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        style={{
          background: 'linear-gradient(180deg, rgba(10,10,18,0.97) 0%, rgba(8,8,14,0.99) 100%)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(16,185,129,0.06)',
        }}
      >
        <div className="flex items-center justify-center px-6 py-5" style={{ borderBottom: '1px solid rgba(16,185,129,0.06)' }}>
          <img src="/logo.png" alt="Planejix" className="h-20 w-auto dark:brightness-[1.8] dark:contrast-[1.1]" />
        </div>

        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-3 mb-2">Menu</p>
          {navItems.map((item) => {
            const isActive = item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer
                  ${isActive
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                  }
                `}
                style={isActive ? {
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.08) 100%)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  boxShadow: '0 2px 12px rgba(16,185,129,0.08)',
                } : undefined}
              >
                <span style={isActive ? { color: '#34d399' } : undefined}>{item.icon}</span>
                {item.label}
              </NavLink>
            );
          })}
          {isAdmin && (
            <>
              <div className="h-px my-3 mx-3" style={{ background: 'rgba(16,185,129,0.06)' }} />
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-3 mb-2">Admin</p>
              <NavLink
                to="/approvals"
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer
                  ${location.pathname.startsWith('/approvals')
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                  }
                `}
                style={location.pathname.startsWith('/approvals') ? {
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.08) 100%)',
                  border: '1px solid rgba(16,185,129,0.2)',
                } : undefined}
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={location.pathname.startsWith('/approvals') ? { color: '#34d399' } : undefined}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Aprovações
              </NavLink>
              <NavLink
                to="/admin"
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer
                  ${location.pathname.startsWith('/admin')
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                  }
                `}
                style={location.pathname.startsWith('/admin') ? {
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.08) 100%)',
                  border: '1px solid rgba(16,185,129,0.2)',
                } : undefined}
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={location.pathname.startsWith('/admin') ? { color: '#34d399' } : undefined}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Usuários
              </NavLink>
            </>
          )}
        </nav>

        <div className="px-3 py-4 space-y-1" style={{ borderTop: '1px solid rgba(16,185,129,0.06)' }}>
          <button
            onClick={() => setIsDark((d) => !d)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] transition-all duration-200 w-full cursor-pointer"
          >
            <div className="relative w-[18px] h-[18px] flex-shrink-0">
              <svg
                className="w-[18px] h-[18px] absolute inset-0 transition-all duration-300"
                style={{ opacity: isDark ? 1 : 0, transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.5)' }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg
                className="w-[18px] h-[18px] absolute inset-0 transition-all duration-300"
                style={{ opacity: isDark ? 0 : 1, transform: isDark ? 'rotate(90deg) scale(0.5)' : 'rotate(0deg) scale(1)' }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </div>
            {isDark ? 'Tema Claro' : 'Tema Escuro'}
          </button>

          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/[0.03] transition-all duration-200"
            onClick={() => { onClose(); navigate('/profile'); }}
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" className="w-9 h-9 rounded-xl object-cover flex-shrink-0 ring-1 ring-brand-600/30" />
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
              >
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              {user?.name && (
                <p className="text-[13px] font-medium text-white truncate">{user.name}</p>
              )}
              <p className={`text-gray-500 truncate ${user?.name ? 'text-[11px]' : 'text-[13px]'}`}>
                @{user?.username}
              </p>
            </div>
            {!isAdmin && (
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                style={plan === 'pro' ? {
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.2))',
                  color: '#6ee7b7',
                } : {
                  background: 'rgba(255,255,255,0.05)',
                  color: '#666',
                }}
              >
                {plan === 'pro' ? 'PRO' : 'FREE'}
              </span>
            )}
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/[0.06] transition-all duration-200 w-full cursor-pointer"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
