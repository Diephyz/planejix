import { useState, useEffect, useRef, useCallback } from 'react';
import { notificationsAPI } from '../../api/api';
import type { AppNotification } from '../../types';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationsAPI.getUpcoming();
      setNotifications(res.data);
    } catch {
      // silent — não interromper a navegação por causa de notificações
    }
  }, []);

  // Busca ao montar (ou seja, sempre que o usuário abre/recarrega o Planejix)
  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const count = notifications.length;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/[0.05] transition-all"
        title="Notificações"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl z-50 overflow-hidden animate-scale-in"
          style={{
            background: 'rgba(20,20,31,0.95)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          }}
        >
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-sm font-semibold text-white">Notificações</p>
            <p className="text-xs text-gray-500 mt-0.5">Contas próximas do vencimento</p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                Nenhuma conta vencendo nos próximos dias
              </div>
            ) : (
              notifications.map((n) => {
                const isToday = n.type === 'due_today';
                return (
                  <div key={n.id} className="px-4 py-3 flex items-start gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span
                      className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                        isToday ? 'bg-red-500' : 'bg-yellow-500'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-white truncate">{n.description}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {fmt(n.amount)} · vence em {fmtDate(n.date)}
                      </p>
                      <span
                        className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isToday
                            ? 'bg-red-500/15 text-red-400'
                            : 'bg-yellow-500/15 text-yellow-400'
                        }`}
                      >
                        {isToday ? 'Vence hoje' : 'Vence em 3 dias'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
