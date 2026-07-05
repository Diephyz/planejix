import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  ResponsiveContainer,
} from 'recharts';
import type { MonthlySummary } from '../../types';

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

const compact = (v: number) => {
  if (v === 0) return '';
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  return String(Math.round(v));
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-tooltip">
        <p className="text-gray-700 dark:text-gray-300 font-medium mb-1.5 text-[13px]">{label}</p>
        {payload.map((p) => (
          <p key={p.name} className="text-[12px]" style={{ color: p.color }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function MonthlyBarChart({ data }: { data: MonthlySummary[] }) {
  const [viewTable, setViewTable] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 768px)').matches);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const chartData = data.map((d, i) => ({
    month: MONTH_NAMES[i],
    Entradas: d.income,
    Saídas: d.expenses,
  }));

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold">Entradas e Saídas por Mês</h3>
        <button
          onClick={() => setViewTable((v) => !v)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-600/10 transition-colors cursor-pointer"
          title={viewTable ? 'Ver como gráfico' : 'Ver como tabela'}
          aria-label={viewTable ? 'Ver como gráfico' : 'Ver como tabela'}
        >
          {viewTable ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>

      {viewTable ? (
        <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 uppercase sticky top-0 bg-white dark:bg-dark-900">
              <tr>
                <th className="text-left py-2 pr-2">Mês</th>
                <th className="text-right py-2 px-2">Entradas</th>
                <th className="text-right py-2 px-2">Saídas</th>
                <th className="text-right py-2 pl-2">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {data.map((d, i) => {
                const saldo = d.income - d.expenses;
                return (
                  <tr key={i}>
                    <td className="py-2 pr-2 text-gray-700 dark:text-gray-300">{MONTH_NAMES[i]}</td>
                    <td className="py-2 px-2 text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(d.income)}</td>
                    <td className="py-2 px-2 text-right text-red-600 dark:text-red-400">{formatCurrency(d.expenses)}</td>
                    <td className={`py-2 pl-2 text-right font-medium ${saldo >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(saldo)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 16, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="gradEntradas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="gradSaidas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.08)" />
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16,185,129,0.04)' }} />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
              <Bar dataKey="Entradas" fill="url(#gradEntradas)" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {isDesktop && <LabelList dataKey="Entradas" position="top" formatter={compact} style={{ fill: '#10B981', fontSize: 9, fontWeight: 600 }} />}
              </Bar>
              <Bar dataKey="Saídas" fill="url(#gradSaidas)" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {isDesktop && <LabelList dataKey="Saídas" position="top" formatter={compact} style={{ fill: '#ef4444', fontSize: 9, fontWeight: 600 }} />}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
