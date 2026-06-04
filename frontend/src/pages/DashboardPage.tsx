import { useState, useEffect, useCallback } from 'react';
import { transactionsAPI, budgetsAPI } from '../api/api';
import type { AnnualSummary, Transaction, Budget } from '../types';
import MonthlyBarChart from '../components/dashboard/MonthlyBarChart';
import AnnualLineChart from '../components/dashboard/AnnualLineChart';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import CategoryDonutChart from '../components/dashboard/CategoryDonutChart';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

// ── Stat card para a sidebar ──────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  accentColor: string;   // hex, ex: '#22c55e'
  textClass: string;
}

function StatCard({ title, value, icon, accentColor, textClass }: StatCardProps) {
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      <div
        className="p-2.5 rounded-xl flex-shrink-0"
        style={{ backgroundColor: `${accentColor}18` }}
      >
        <div style={{ color: accentColor }}>{icon}</div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 font-medium truncate">{title}</p>
        <p className={`text-sm font-bold mt-0.5 truncate ${textClass}`}>{fmt(value)}</p>
      </div>
    </div>
  );
}

// ── Breakdown por tipo (barra de progresso) ───────────────────────────────────
interface KindRowProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

function KindRow({ label, value, total, color }: KindRowProps) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-semibold">{fmt(value)}</span>
      </div>
      <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ backgroundColor: color, width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Dashboard principal ───────────────────────────────────────────────────────
export default function DashboardPage() {
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [summary, setSummary] = useState<AnnualSummary | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [budgetAlerts, setBudgetAlerts] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, recentRes, budgetsRes] = await Promise.all([
        transactionsAPI.getSummary(year, month),
        transactionsAPI.getAll({ year }),
        budgetsAPI.getProgress(year, month),
      ]);
      setSummary(summaryRes.data);
      setRecent(recentRes.data.slice(0, 10));
      setBudgetAlerts(budgetsRes.data.filter((b) => (b.percent ?? 0) >= 80));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!summary) return null;

  // ── Icons ─────────────────────────────────────────────────────────────────
  const iconEntradas = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
    </svg>
  );
  const iconSaidas = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
    </svg>
  );
  const iconSaldo = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  const iconMaior = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  return (
    <div className="flex gap-6 items-start">

      {/* ══════════════════════════════════════════════════════
          LEFT STATS SIDEBAR — visível só em lg+
      ══════════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col gap-4 w-56 flex-shrink-0 sticky top-6">

        {/* Título + seletor de ano */}
        <div>
          <h2 className="text-lg font-bold text-white">Visão Geral</h2>
          <p className="text-xs text-gray-500 mt-0.5">Acompanhe suas finanças</p>
        </div>

        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="input-field flex-1 text-sm"
          >
            {monthNames.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="input-field w-20 text-sm"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* KPI Cards */}
        <StatCard
          title="Total Entradas"
          value={summary.annual.totalIncome}
          icon={iconEntradas}
          accentColor="#22c55e"
          textClass="text-green-400"
        />
        <StatCard
          title="Total Saídas"
          value={summary.annual.totalExpenses}
          icon={iconSaidas}
          accentColor="#ef4444"
          textClass="text-red-400"
        />
        <StatCard
          title="Saldo"
          value={summary.annual.balance}
          icon={iconSaldo}
          accentColor="#818cf8"
          textClass={summary.annual.balance >= 0 ? 'text-white' : 'text-red-400'}
        />
        <StatCard
          title="Maior Gasto"
          value={summary.largestExpense}
          icon={iconMaior}
          accentColor="#eab308"
          textClass="text-yellow-400"
        />

        {/* Breakdown por tipo */}
        <div
          className="rounded-2xl p-4 space-y-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Por Tipo</p>
          <KindRow
            label="Fixos"
            value={summary.byKind.fixed}
            total={summary.annual.totalExpenses}
            color="#a855f7"
          />
          <KindRow
            label="Variáveis"
            value={summary.byKind.variable}
            total={summary.annual.totalExpenses}
            color="#3b82f6"
          />
          <KindRow
            label="Outros"
            value={summary.byKind.custom}
            total={summary.annual.totalExpenses}
            color="#f97316"
          />
        </div>

        {/* Alertas de orçamento */}
        {budgetAlerts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Alertas</p>
            {budgetAlerts.map((b) => {
              const over = (b.percent ?? 0) > 100;
              return (
                <div
                  key={b.id}
                  className="rounded-xl px-3 py-2.5 text-xs"
                  style={{
                    background: over ? 'rgba(239,68,68,0.08)' : 'rgba(234,179,8,0.08)',
                    border: `1px solid ${over ? 'rgba(239,68,68,0.25)' : 'rgba(234,179,8,0.25)'}`,
                    color: over ? '#f87171' : '#facc15',
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-semibold truncate">{b.category_name || 'Geral'}</p>
                    <span className="text-xs opacity-80 ml-1 flex-shrink-0">
                      {(b.percent ?? 0).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1 bg-black/20 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: over ? '#ef4444' : '#eab308',
                        width: `${Math.min(b.percent ?? 0, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </aside>

      {/* ══════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════ */}
      <div className="flex-1 min-w-0 space-y-6">

        {/* Header mobile (oculto em lg+) */}
        <div className="flex items-center justify-between flex-wrap gap-3 lg:hidden">
          <div>
            <h2 className="text-xl font-bold text-white">Visão Geral</h2>
            <p className="text-sm text-gray-400 mt-0.5">Acompanhe suas finanças</p>
          </div>
          <div className="flex gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="input-field w-32"
            >
              {monthNames.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="input-field w-24"
            >
              {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* KPI grid mobile (oculto em lg+) */}
        <div className="grid grid-cols-2 gap-3 lg:hidden">
          {[
            { title: 'Entradas', value: summary.annual.totalIncome, color: 'border-green-500/20', text: 'text-green-400' },
            { title: 'Saídas', value: summary.annual.totalExpenses, color: 'border-red-500/20', text: 'text-red-400' },
            { title: 'Saldo', value: summary.annual.balance, color: 'border-brand-500/20', text: summary.annual.balance >= 0 ? 'text-white' : 'text-red-400' },
            { title: 'Maior Gasto', value: summary.largestExpense, color: 'border-yellow-500/20', text: 'text-yellow-400' },
          ].map((c) => (
            <div key={c.title} className={`card border ${c.color} py-3`}>
              <p className="text-xs text-gray-400">{c.title}</p>
              <p className={`text-sm font-bold mt-0.5 ${c.text}`}>{fmt(c.value)}</p>
            </div>
          ))}
        </div>

        {/* Por Tipo mobile (oculto em lg+) */}
        <div className="grid grid-cols-3 gap-2 lg:hidden">
          {[
            { label: 'Fixos', value: summary.byKind.fixed, color: '#a855f7' },
            { label: 'Variáveis', value: summary.byKind.variable, color: '#3b82f6' },
            { label: 'Outros', value: summary.byKind.custom, color: '#f97316' },
          ].map((item) => (
            <div key={item.label} className="card py-3 px-3" style={{ borderLeft: `3px solid ${item.color}` }}>
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-xs font-bold text-white mt-0.5 truncate">{fmt(item.value)}</p>
            </div>
          ))}
        </div>

        {/* Alertas mobile (oculto em lg+) */}
        {budgetAlerts.length > 0 && (
          <div className="space-y-2 lg:hidden">
            {budgetAlerts.map((b) => {
              const over = (b.percent ?? 0) > 100;
              return (
                <div
                  key={b.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
                    over
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                  }`}
                >
                  <span className="flex-1">
                    <strong>{b.category_name || 'Geral'}:</strong>{' '}
                    {over
                      ? `Excedido! ${fmt(b.spent ?? 0)} de ${fmt(b.amount)}`
                      : `${(b.percent ?? 0).toFixed(0)}% — ${fmt(b.spent ?? 0)} de ${fmt(b.amount)}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Gráfico de barras — full width */}
        <MonthlyBarChart data={summary.monthly} />

        {/* Linha 2: Donut mensal + Transações recentes */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <CategoryDonutChart mode="monthly" />
          <RecentTransactions transactions={recent} />
        </div>

        {/* Linha 3: Evolução anual */}
        <AnnualLineChart data={summary.monthly} />
      </div>
    </div>
  );
}
