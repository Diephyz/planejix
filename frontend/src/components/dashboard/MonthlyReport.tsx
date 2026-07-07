import type { AnnualSummary } from '../../types';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function MonthlyReport({ summary, month, year }: { summary: AnnualSummary; month: number; year: number }) {
  const { totalIncome, totalExpenses, balance } = summary.annual;
  const prev = summary.previousMonth;
  const topCats = summary.byCategoryMonth?.slice(0, 3) || [];

  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;
  const expenseChange = prev && prev.totalExpenses > 0
    ? ((totalExpenses - prev.totalExpenses) / prev.totalExpenses * 100)
    : 0;

  let grade = 'A';
  let gradeColor = '#10B981';
  if (savingsRate < 0) { grade = 'D'; gradeColor = '#ef4444'; }
  else if (savingsRate < 10) { grade = 'C'; gradeColor = '#F59E0B'; }
  else if (savingsRate < 20) { grade = 'B'; gradeColor = '#6366f1'; }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Resumo de {MONTH_NAMES[month - 1]}
        </h3>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-gray-900 dark:text-white"
          style={{ background: gradeColor }}
        >
          {grade}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-medium">Receita</p>
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{fmt(totalIncome)}</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-500/10">
          <p className="text-[10px] text-red-700 dark:text-red-400 uppercase font-medium">Despesa</p>
          <p className="text-sm font-bold text-red-700 dark:text-red-400 mt-0.5">{fmt(totalExpenses)}</p>
        </div>
        <div className="text-center p-2 rounded-lg" style={{ background: balance >= 0 ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)' }}>
          <p className="text-[10px] uppercase font-medium" style={{ color: balance >= 0 ? '#059669' : '#dc2626' }}>Saldo</p>
          <p className="text-sm font-bold mt-0.5" style={{ color: balance >= 0 ? '#059669' : '#dc2626' }}>{fmt(balance)}</p>
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-2 text-[12px] text-gray-600 dark:text-gray-400">
        <div className="flex items-start gap-2">
          <span className="text-emerald-500 mt-0.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <span>Taxa de poupança: <strong className="text-gray-900 dark:text-white">{savingsRate.toFixed(0)}%</strong> {savingsRate >= 20 ? '— Excelente!' : savingsRate >= 10 ? '— Bom, mas pode melhorar' : '— Tente economizar mais'}</span>
        </div>

        {Math.abs(expenseChange) > 5 && (
          <div className="flex items-start gap-2">
            <span className={expenseChange > 0 ? 'text-red-500 mt-0.5' : 'text-emerald-500 mt-0.5'}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expenseChange > 0 ? 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6' : 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'} />
              </svg>
            </span>
            <span>Despesas {expenseChange > 0 ? 'subiram' : 'caíram'} <strong className="text-gray-900 dark:text-white">{Math.abs(expenseChange).toFixed(0)}%</strong> vs mês anterior</span>
          </div>
        )}

        {topCats.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </span>
            <span>Top gastos: {topCats.map(c => `${c.name} (${fmt(c.value)})`).join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
