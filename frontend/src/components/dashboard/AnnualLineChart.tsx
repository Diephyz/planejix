import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { MonthlySummary } from '../../types';

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-tooltip">
        <p className="text-gray-300 font-medium mb-1.5 text-[13px]">{label}</p>
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

export default function AnnualLineChart({ data }: { data: MonthlySummary[] }) {
  const chartData = data.map((d, i) => ({
    month: MONTH_NAMES[i],
    Entradas: d.income,
    Saídas: d.expenses,
    Saldo: d.balance,
  }));

  return (
    <div className="card">
      <h3 className="text-base font-semibold mb-4">Evolução Anual</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="gradAreaEntradas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradAreaSaidas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradAreaSaldo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#32324a" />
            <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
            <ReferenceLine y={0} stroke="#44445e" strokeDasharray="4 4" />
            <Area type="monotone" dataKey="Entradas" stroke="#22c55e" strokeWidth={2} fill="url(#gradAreaEntradas)" dot={{ r: 3, fill: '#22c55e' }} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey="Saídas" stroke="#ef4444" strokeWidth={2} fill="url(#gradAreaSaidas)" dot={{ r: 3, fill: '#ef4444' }} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey="Saldo" stroke="#818cf8" strokeWidth={2} strokeDasharray="5 5" fill="url(#gradAreaSaldo)" dot={{ r: 3, fill: '#818cf8' }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
