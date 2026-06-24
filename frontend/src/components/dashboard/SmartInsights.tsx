import type { AnnualSummary, Budget } from '../../types';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface InsightItem {
  icon: string;
  text: string;
  type: 'success' | 'warning' | 'danger' | 'info';
}

function generateInsights(summary: AnnualSummary, budgetAlerts: Budget[]): InsightItem[] {
  const insights: InsightItem[] = [];
  const { totalIncome, totalExpenses, balance } = summary.annual;
  const prev = summary.previousMonth;

  if (totalExpenses > 0 && prev && prev.totalExpenses > 0) {
    const pctChange = ((totalExpenses - prev.totalExpenses) / prev.totalExpenses) * 100;
    if (pctChange > 15) {
      insights.push({
        icon: 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6',
        text: `Suas despesas subiram ${pctChange.toFixed(0)}% comparado ao mês anterior`,
        type: 'danger',
      });
    } else if (pctChange < -10) {
      insights.push({
        icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
        text: `Parabéns! Despesas caíram ${Math.abs(pctChange).toFixed(0)}% vs mês anterior`,
        type: 'success',
      });
    }
  }

  if (balance > 0 && totalIncome > 0) {
    const savingsRate = (balance / totalIncome) * 100;
    if (savingsRate >= 30) {
      insights.push({
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        text: `Taxa de poupança de ${savingsRate.toFixed(0)}% — excelente controle financeiro!`,
        type: 'success',
      });
    } else if (savingsRate < 10 && savingsRate >= 0) {
      insights.push({
        icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
        text: `Poupando apenas ${savingsRate.toFixed(0)}% da receita. Tente reduzir gastos variáveis`,
        type: 'warning',
      });
    }
  }

  if (balance < 0) {
    insights.push({
      icon: 'M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      text: `Saldo negativo de ${fmt(Math.abs(balance))}. Revise seus gastos este mês`,
      type: 'danger',
    });
  }

  if (budgetAlerts.length > 0) {
    const overBudget = budgetAlerts.filter(b => (b.percent ?? 0) > 100);
    if (overBudget.length > 0) {
      const names = overBudget.map(b => b.category_name || 'Geral').join(', ');
      insights.push({
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        text: `Orçamento excedido em: ${names}`,
        type: 'danger',
      });
    }
  }

  const byCat = summary.byCategoryMonth;
  if (byCat && byCat.length > 0) {
    const top = byCat[0];
    if (totalExpenses > 0) {
      const pct = (top.value / totalExpenses) * 100;
      if (pct > 40) {
        insights.push({
          icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
          text: `${top.name} representa ${pct.toFixed(0)}% dos gastos (${fmt(top.value)})`,
          type: 'info',
        });
      }
    }
  }

  if (totalIncome > 0 && prev && prev.totalIncome > 0) {
    const pctChange = ((totalIncome - prev.totalIncome) / prev.totalIncome) * 100;
    if (pctChange > 10) {
      insights.push({
        icon: 'M7 11l5-5m0 0l5 5m-5-5v12',
        text: `Receita cresceu ${pctChange.toFixed(0)}% este mês. Continue assim!`,
        type: 'success',
      });
    }
  }

  return insights.slice(0, 3);
}

const typeStyles: Record<string, { bg: string; border: string; iconColor: string }> = {
  success: { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.15)', iconColor: '#10B981' },
  warning: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)', iconColor: '#F59E0B' },
  danger: { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.15)', iconColor: '#ef4444' },
  info: { bg: 'rgba(99,102,241,0.06)', border: 'rgba(99,102,241,0.15)', iconColor: '#6366f1' },
};

export default function SmartInsights({ summary, budgetAlerts }: { summary: AnnualSummary; budgetAlerts: Budget[] }) {
  const insights = generateInsights(summary, budgetAlerts);
  if (insights.length === 0) return null;

  return (
    <div className="space-y-2">
      {insights.map((insight, i) => {
        const style = typeStyles[insight.type];
        return (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 rounded-xl animate-fade-in"
            style={{
              background: style.bg,
              border: `1px solid ${style.border}`,
              animationDelay: `${i * 100}ms`,
            }}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke={style.iconColor} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={insight.icon} />
            </svg>
            <p className="text-[13px] text-gray-300">{insight.text}</p>
          </div>
        );
      })}
    </div>
  );
}
