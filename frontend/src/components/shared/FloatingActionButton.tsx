import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function FloatingActionButton() {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/login') return null;

  const actions = [
    {
      label: 'Transação',
      icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
      onClick: () => { navigate('/transactions'); setExpanded(false); },
      color: '#10B981',
    },
    {
      label: 'Meta',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      onClick: () => { navigate('/budgets'); setExpanded(false); },
      color: '#6366f1',
    },
    {
      label: 'Economia',
      icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
      onClick: () => { navigate('/savings'); setExpanded(false); },
      color: '#F59E0B',
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 lg:hidden flex flex-col-reverse items-end gap-3">
      {expanded && (
        <>
          <div className="fixed inset-0 z-[-1]" onClick={() => setExpanded(false)} />
          {actions.map((action, i) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className="flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full text-white text-sm font-medium shadow-lg animate-scale-in cursor-pointer"
              style={{
                background: 'rgba(18,18,30,0.95)',
                border: `1px solid ${action.color}30`,
                boxShadow: `0 4px 20px rgba(0,0,0,0.4)`,
                animationDelay: `${i * 50}ms`,
              }}
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${action.color}20` }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke={action.color} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                </svg>
              </div>
              {action.label}
            </button>
          ))}
        </>
      )}

      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-14 h-14 rounded-full text-white shadow-xl flex items-center justify-center transition-all duration-300 cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #10B981, #059669)',
          boxShadow: '0 6px 24px rgba(16,185,129,0.4)',
          transform: expanded ? 'rotate(45deg)' : 'rotate(0deg)',
        }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
