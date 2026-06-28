import { useState, useEffect } from 'react';
import { transactionsAPI } from '../../api/api';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

interface HistoryItem {
  year: number;
  month: number;
  income: number;
  expenses: number;
  balance: number;
  accumulated: number;
}

function MiniChart({ data }: { data: HistoryItem[] }) {
  if (data.length < 2) return null;
  const values = data.map(d => d.accumulated);
  const max = Math.max(...values);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 240;
  const h = 48;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    return `${x},${y}`;
  });

  const lastVal = values[values.length - 1];
  const color = lastVal >= 0 ? '#10B981' : '#ef4444';

  return (
    <svg width={w} height={h} className="w-full">
      <defs>
        <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${points.join(' ')} ${w},${h}`}
        fill="url(#accGrad)"
      />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AccumulatedBalance() {
  const [data, setData] = useState<{
    totalIncome: number;
    totalExpenses: number;
    totalBalance: number;
    history: HistoryItem[];
  } | null>(null);
  const [visible, setVisible] = useState(() => {
    return localStorage.getItem('planejix_balance_visible') !== 'false';
  });
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    transactionsAPI.getAccumulated()
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleVisible = () => {
    setVisible(v => {
      const next = !v;
      localStorage.setItem('planejix_balance_visible', String(next));
      return next;
    });
  };

  const animatedBalance = useAnimatedValue(data?.totalBalance ?? 0);

  if (loading) {
    return (
      <div className="rounded-2xl p-5 animate-pulse" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(5,150,105,0.04) 100%)', border: '1px solid rgba(16,185,129,0.1)' }}>
        <div className="h-4 w-24 bg-white/5 rounded mb-3" />
        <div className="h-8 w-40 bg-white/5 rounded" />
      </div>
    );
  }

  if (!data) return null;

  const lastTwo = data.history.slice(-2);
  const currentMonth = lastTwo[lastTwo.length - 1];
  const prevMonth = lastTwo.length > 1 ? lastTwo[lastTwo.length - 2] : null;
  const balanceChange = prevMonth ? currentMonth.accumulated - prevMonth.accumulated : 0;
  const changePercent = prevMonth && prevMonth.accumulated !== 0
    ? ((balanceChange / Math.abs(prevMonth.accumulated)) * 100)
    : 0;

  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(5,150,105,0.04) 100%)',
        border: '1px solid rgba(16,185,129,0.12)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span className="text-[12px] font-medium text-gray-400 uppercase tracking-wider">Saldo total</span>
        </div>
        <button
          onClick={toggleVisible}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer"
        >
          {visible ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          )}
        </button>
      </div>

      {/* Balance */}
      <div className="flex items-baseline gap-3 mb-1">
        {visible ? (
          <span className={`text-2xl sm:text-3xl font-bold ${data.totalBalance >= 0 ? 'text-white' : 'text-red-400'}`}>
            {fmt(animatedBalance)}
          </span>
        ) : (
          <span className="text-2xl sm:text-3xl font-bold text-white">
            R$ ••••••
          </span>
        )}
        {visible && changePercent !== 0 && (
          <span className={`text-xs font-semibold ${balanceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {balanceChange >= 0 ? '↑' : '↓'} {Math.abs(changePercent).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Subtitle */}
      <p className="text-[11px] text-gray-500 mb-3">
        {visible ? (
          <>
            Receita total: <span className="text-emerald-400">{fmt(data.totalIncome)}</span>
            {' · '}
            Despesa total: <span className="text-red-400">{fmt(data.totalExpenses)}</span>
          </>
        ) : (
          'Toque no olho para ver o saldo'
        )}
      </p>

      {/* Mini chart */}
      {visible && data.history.length >= 2 && (
        <div className="mb-3">
          <MiniChart data={data.history} />
        </div>
      )}

      {/* Toggle history */}
      {visible && data.history.length > 0 && (
        <>
          <button
            onClick={() => setShowHistory(v => !v)}
            className="text-[12px] text-brand-500 hover:text-brand-400 transition-colors cursor-pointer flex items-center gap-1"
          >
            <svg className={`w-3.5 h-3.5 transition-transform ${showHistory ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showHistory ? 'Ocultar comparativo' : 'Ver comparativo mensal'}
          </button>

          {showHistory && (
            <div className="mt-3 space-y-1.5 max-h-64 overflow-y-auto">
              {[...data.history].reverse().map((h, i) => (
                <div
                  key={`${h.year}-${h.month}`}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg animate-fade-in"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    animationDelay: `${i * 30}ms`,
                  }}
                >
                  <div className="min-w-[60px]">
                    <p className="text-[12px] font-medium text-white">{MONTH_NAMES[h.month - 1]} {h.year}</p>
                  </div>
                  <div className="flex-1 flex items-center gap-3 text-[11px]">
                    <span className="text-emerald-400">+{fmt(h.income)}</span>
                    <span className="text-red-400">-{fmt(h.expenses)}</span>
                  </div>
                  <div className="text-right">
                    <p className={`text-[12px] font-bold ${h.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {h.balance >= 0 ? '+' : ''}{fmt(h.balance)}
                    </p>
                    <p className="text-[10px] text-gray-500">Acum: {fmt(h.accumulated)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
