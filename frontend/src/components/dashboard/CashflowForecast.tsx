import type { MonthlySummary } from '../../types';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function CashflowForecast({ data }: { data: MonthlySummary[] }) {
  const currentMonth = new Date().getMonth();
  const pastMonths = data.filter((_, i) => i <= currentMonth && (data[i].income > 0 || data[i].expenses > 0));

  if (pastMonths.length < 2) return null;

  const avgIncome = pastMonths.reduce((s, m) => s + m.income, 0) / pastMonths.length;
  const avgExpenses = pastMonths.reduce((s, m) => s + m.expenses, 0) / pastMonths.length;
  const avgBalance = avgIncome - avgExpenses;
  const lastBalance = pastMonths[pastMonths.length - 1].balance;
  const projected = lastBalance + avgBalance;

  const trend = avgBalance >= 0 ? 'positive' : 'negative';
  const trendColor = trend === 'positive' ? '#10B981' : '#ef4444';

  return (
    <div
      className="rounded-2xl p-4 transition-all duration-300"
      style={{
        background: `${trendColor}06`,
        border: `1px solid ${trendColor}15`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4" fill="none" stroke={trendColor} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-[12px] font-semibold text-white">Projeção próximo mês</span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Receita média</p>
          <p className="text-[12px] sm:text-[13px] font-bold text-emerald-400 truncate">{fmt(avgIncome)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Despesa média</p>
          <p className="text-[12px] sm:text-[13px] font-bold text-red-400 truncate">{fmt(avgExpenses)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Saldo projetado</p>
          <p className="text-[12px] sm:text-[13px] font-bold truncate" style={{ color: trendColor }}>{fmt(projected)}</p>
        </div>
      </div>
      <p className="text-[11px] text-gray-500 mt-2">
        Baseado na média dos últimos {pastMonths.length} meses
      </p>
    </div>
  );
}
