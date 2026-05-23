import { useState, useEffect, useCallback } from 'react';
import { transactionsAPI } from '../api/api';
import type { AnnualSummary, Transaction } from '../types';
import SummaryCard from '../components/dashboard/SummaryCard';
import MonthlyBarChart from '../components/dashboard/MonthlyBarChart';
import AnnualLineChart from '../components/dashboard/AnnualLineChart';
import RecentTransactions from '../components/dashboard/RecentTransactions';

const currentYear = new Date().getFullYear();

export default function DashboardPage() {
  const [year, setYear] = useState(currentYear);
  const [summary, setSummary] = useState<AnnualSummary | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, recentRes] = await Promise.all([
        transactionsAPI.getSummary(year),
        transactionsAPI.getAll({ year }),
      ]);
      setSummary(summaryRes.data);
      setRecent(recentRes.data.slice(0, 10));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Visão Geral</h2>
          <p className="text-sm text-gray-400 mt-0.5">Acompanhe suas finanças</p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="input-field w-28"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : summary ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              title="Total Entradas"
              value={summary.annual.totalIncome}
              color="green"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              }
            />
            <SummaryCard
              title="Total Saídas"
              value={summary.annual.totalExpenses}
              color="red"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                </svg>
              }
            />
            <SummaryCard
              title="Saldo"
              value={summary.annual.balance}
              color="indigo"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              }
            />
            <SummaryCard
              title="Maior Gasto"
              value={summary.largestExpense}
              color="yellow"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            />
          </div>

          {/* Expense by Kind */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Fixos', value: summary.byKind.fixed, color: 'bg-purple-500' },
              { label: 'Variáveis', value: summary.byKind.variable, color: 'bg-blue-500' },
              { label: 'Personalizados', value: summary.byKind.custom, color: 'bg-orange-500' },
            ].map((item) => (
              <div key={item.label} className="card flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.color} flex-shrink-0`} />
                <div>
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className="text-sm font-semibold text-white">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <MonthlyBarChart data={summary.monthly} />
            <AnnualLineChart data={summary.monthly} />
          </div>

          {/* Recent */}
          <RecentTransactions transactions={recent} />
        </>
      ) : null}
    </div>
  );
}
