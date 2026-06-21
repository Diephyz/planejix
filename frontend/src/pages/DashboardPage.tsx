import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionsAPI, budgetsAPI, notificationsAPI } from '../api/api';
import type { AnnualSummary, Transaction, Budget, AppNotification } from '../types';
import MonthlyBarChart from '../components/dashboard/MonthlyBarChart';
import AnnualLineChart from '../components/dashboard/AnnualLineChart';
import { useAuth } from '../context/AuthContext';
import { generateMonthlyReport } from '../utils/generatePdf';
import WelcomeModal from '../components/shared/WelcomeModal';
import { useAnimatedValue } from '../hooks/useAnimatedValue';
import { DashboardSkeleton } from '../components/shared/Skeleton';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');

// ── KPI Card (horizontal no topo) ────────────────────────────────────────────
interface KpiProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  textClass: string;
  previousValue?: number;
  invertTrend?: boolean;
}

function KpiCard({ label, value, icon, color, textClass, previousValue, invertTrend }: KpiProps) {
  const animated = useAnimatedValue(value);
  let trend: React.ReactNode = null;
  if (previousValue !== undefined && previousValue > 0) {
    const pct = ((value - previousValue) / previousValue) * 100;
    if (Math.abs(pct) >= 0.5) {
      const isUp = pct > 0;
      const isGood = invertTrend ? !isUp : isUp;
      trend = (
        <span className={`text-[10px] font-semibold ${isGood ? 'text-green-400' : 'text-red-400'}`}>
          {isUp ? '↑' : '↓'} {Math.abs(pct).toFixed(0)}%
        </span>
      );
    }
  }
  return (
    <div
      className="rounded-2xl p-4 transition-all duration-300 hover:translate-y-[-2px] min-w-0"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg" style={{ background: `${color}15` }}>
          <div style={{ color }}>{icon}</div>
        </div>
        <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider truncate">{label}</span>
      </div>
      <p className={`text-lg font-bold truncate ${textClass}`}>{fmt(animated)}</p>
      {trend}
    </div>
  );
}

// ── Health indicator ─────────────────────────────────────────────────────────
function HealthBadge({ income, expenses }: { income: number; expenses: number }) {
  const ratio = income > 0 ? (expenses / income) * 100 : 100;
  let status: string, statusColor: string, bgColor: string, emoji: string;
  if (ratio <= 50) {
    status = 'Excelente'; statusColor = '#22c55e'; bgColor = 'rgba(34,197,94,0.1)'; emoji = '🟢';
  } else if (ratio <= 75) {
    status = 'Saudável'; statusColor = '#22c55e'; bgColor = 'rgba(34,197,94,0.08)'; emoji = '🟢';
  } else if (ratio <= 95) {
    status = 'Atenção'; statusColor = '#eab308'; bgColor = 'rgba(234,179,8,0.08)'; emoji = '🟡';
  } else {
    status = 'Crítico'; statusColor = '#ef4444'; bgColor = 'rgba(239,68,68,0.08)'; emoji = '🔴';
  }
  return (
    <div
      className="rounded-2xl p-4 transition-all duration-300 hover:translate-y-[-2px] min-w-0"
      style={{ background: bgColor, border: `1px solid ${statusColor}20` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">{emoji}</span>
        <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Saúde</span>
      </div>
      <p className="text-lg font-bold" style={{ color: statusColor }}>{status}</p>
      <span className="text-[10px] text-gray-500">{ratio.toFixed(0)}% da receita gasta</span>
    </div>
  );
}

// ── Upcoming payments ────────────────────────────────────────────────────────
function UpcomingPayments({ items }: { items: AppNotification[] }) {
  if (items.length === 0) {
    return (
      <div className="card h-full flex flex-col">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Próximos vencimentos
        </h3>
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
          Nenhuma conta vencendo
        </div>
      </div>
    );
  }
  return (
    <div className="card h-full flex flex-col">
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Próximos vencimentos
      </h3>
      <div className="space-y-2 flex-1">
        {items.slice(0, 5).map((n) => {
          const isToday = n.type === 'due_today';
          return (
            <div
              key={n.id}
              className="flex items-center gap-3 px-3 py-2 rounded-xl"
              style={{
                background: isToday ? 'rgba(239,68,68,0.06)' : 'rgba(234,179,8,0.06)',
                border: `1px solid ${isToday ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)'}`,
              }}
            >
              <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${isToday ? 'bg-red-500' : 'bg-yellow-500'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-white truncate">{n.description}</p>
                <p className="text-[11px] text-gray-500">{fmtDate(n.date)} {isToday ? '· Vence hoje!' : '· Em 3 dias'}</p>
              </div>
              <span className="text-[13px] font-bold text-white flex-shrink-0">{fmt(n.amount)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Recent transactions with category icons ──────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  'Alimentação': 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z',
  'Transporte': 'M8 17h8M8 17v-4m8 4v-4m-8 0h8m-8 0H5a1 1 0 01-1-1V8a4 4 0 014-4h8a4 4 0 014 4v4a1 1 0 01-1 1h-3',
  'Moradia': 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  'Saúde': 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  'Educação': 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  'Lazer': 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'Salário': 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};
const DEFAULT_ICON = 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z';

function groupByDate(transactions: Transaction[]): { label: string; items: Transaction[] }[] {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const groups: Record<string, Transaction[]> = {};
  for (const t of transactions) {
    const key = t.date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 3)
    .map(([date, items]) => ({
      label: date === today ? 'Hoje' : date === yesterday ? 'Ontem' : fmtDate(date),
      items,
    }));
}

function EnhancedRecentTransactions({ transactions }: { transactions: Transaction[] }) {
  const groups = groupByDate(transactions);
  if (transactions.length === 0) {
    return (
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Transações recentes
        </h3>
        <div className="text-center py-8 text-gray-500 text-sm">Nenhuma transação ainda</div>
      </div>
    );
  }
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Transações recentes
      </h3>
      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">{g.label}</p>
            <div className="space-y-1.5">
              {g.items.slice(0, 4).map((t) => {
                const iconPath = CATEGORY_ICONS[t.category_name || ''] || DEFAULT_ICON;
                const catColor = t.category_color || (t.type === 'income' ? '#22c55e' : '#6366f1');
                return (
                  <div key={t.id} className="flex items-center gap-3 py-1.5 px-2 rounded-xl hover:bg-white/[0.02] transition-colors">
                    <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: `${catColor}15` }}>
                      <svg className="w-4 h-4" fill="none" stroke={catColor} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={iconPath} />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-white truncate">{t.description}</p>
                      <p className="text-[11px] text-gray-500 truncate">{t.category_name || 'Sem categoria'}</p>
                    </div>
                    <span className={`text-[13px] font-bold flex-shrink-0 ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Top categories (replaces donut) ──────────────────────────────────────────
function TopCategories({ year, month }: { year: number; month: number }) {
  const [data, setData] = useState<{ name: string; color: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    transactionsAPI
      .getByCategory(year, month)
      .then((res) => setData(res.data.filter((d) => d.value > 0)))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [year, month]);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="card h-full flex flex-col">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        Gastos por categoria
      </h3>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="spinner" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
          Nenhum gasto registrado
        </div>
      ) : (
        <div className="space-y-3 flex-1">
          {data.slice(0, 6).map((cat, i) => {
            const pct = total > 0 ? (cat.value / total) * 100 : 0;
            return (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-white opacity-30 w-4 text-right flex-shrink-0">{i + 1}</span>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-[13px] text-gray-300 truncate">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-[13px] font-bold text-white">{fmt(cat.value)}</span>
                    <span className="text-[11px] text-gray-500 w-10 text-right">{pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden ml-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ backgroundColor: cat.color, width: `${pct}%`, opacity: 0.8 }}
                  />
                </div>
              </div>
            );
          })}
          {data.length > 6 && (
            <p className="text-[11px] text-gray-500 text-center mt-2">+{data.length - 6} categorias</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Dashboard principal ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const { isPro } = useAuth();
  const navigate = useNavigate();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem('planejix_onboarded'));
  const [summary, setSummary] = useState<AnnualSummary | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [budgetAlerts, setBudgetAlerts] = useState<Budget[]>([]);
  const [upcoming, setUpcoming] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, recentRes, budgetsRes, notifRes] = await Promise.all([
        transactionsAPI.getSummary(year, month),
        transactionsAPI.getAll({ year, month }),
        budgetsAPI.getProgress(year, month),
        notificationsAPI.getUpcoming(),
      ]);
      setSummary(summaryRes.data);
      setRecent(recentRes.data.slice(0, 20));
      setBudgetAlerts(budgetsRes.data.filter((b) => (b.percent ?? 0) >= 80));
      setUpcoming(notifRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  if (loading) return <DashboardSkeleton />;
  if (!summary) return null;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ─── Header + Quick Actions + Period Selector ─────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Visão Geral</h2>
          <p className="text-[13px] text-gray-500 mt-0.5">{monthNames[month - 1]} de {year}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="input-field w-28 text-sm py-2">
            {monthNames.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input-field w-20 text-sm py-2">
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => navigate('/transactions')} className="btn-primary flex items-center gap-1.5 text-sm py-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Nova transação</span>
          </button>
          {isPro && summary && (
            <button
              onClick={() => generateMonthlyReport(summary, year, month)}
              className="btn-secondary flex items-center gap-1.5 text-sm py-2"
              title="Baixar PDF"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden md:inline">PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── KPI Cards (horizontal, all screens) ──────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Receitas"
          value={summary.annual.totalIncome}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>}
          color="#22c55e" textClass="text-green-400"
          previousValue={summary.previousMonth?.totalIncome}
        />
        <KpiCard
          label="Despesas"
          value={summary.annual.totalExpenses}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg>}
          color="#ef4444" textClass="text-red-400"
          previousValue={summary.previousMonth?.totalExpenses}
          invertTrend
        />
        <KpiCard
          label="Saldo"
          value={summary.annual.balance}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="#818cf8" textClass={summary.annual.balance >= 0 ? 'text-white' : 'text-red-400'}
          previousValue={summary.previousMonth?.balance}
        />
        <KpiCard
          label="Maior gasto"
          value={summary.largestExpense}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
          color="#eab308" textClass="text-yellow-400"
          previousValue={summary.previousMonth?.largestExpense}
          invertTrend
        />
        <HealthBadge income={summary.annual.totalIncome} expenses={summary.annual.totalExpenses} />
      </div>

      {/* ─── Budget alerts ────────────────────────────────────────────── */}
      {budgetAlerts.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {budgetAlerts.map((b) => {
            const over = (b.percent ?? 0) > 100;
            return (
              <div
                key={b.id}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                style={{
                  background: over ? 'rgba(239,68,68,0.06)' : 'rgba(234,179,8,0.06)',
                  border: `1px solid ${over ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)'}`,
                  color: over ? '#f87171' : '#facc15',
                }}
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-semibold">{b.category_name || 'Geral'}</span>
                <span className="opacity-70">{(b.percent ?? 0).toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Row 1: Area chart (main) + Upcoming payments ─────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <AnnualLineChart data={summary.monthly} />
        </div>
        <UpcomingPayments items={upcoming} />
      </div>

      {/* ─── Row 2: Top categories + Recent transactions ─────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TopCategories year={year} month={month} />
        <EnhancedRecentTransactions transactions={recent} />
      </div>

      {/* ─── Row 3: Bar chart (secondary) ─────────────────────────────── */}
      <MonthlyBarChart data={summary.monthly} />

      <WelcomeModal
        open={showWelcome}
        onClose={() => { setShowWelcome(false); localStorage.setItem('planejix_onboarded', '1'); }}
      />
    </div>
  );
}
