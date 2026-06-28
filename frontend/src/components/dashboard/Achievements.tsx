import { useState, useEffect } from 'react';
import type { AnnualSummary, Transaction, Budget } from '../../types';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
}

function computeAchievements(
  summary: AnnualSummary | null,
  transactions: Transaction[],
  budgets: Budget[],
): Achievement[] {
  const achievements: Achievement[] = [];
  const inc = summary?.annual.totalIncome ?? 0;
  const exp = summary?.annual.totalExpenses ?? 0;
  const bal = summary?.annual.balance ?? 0;
  const txCount = transactions.length;

  achievements.push({
    id: 'first-tx',
    title: 'Primeira transação',
    description: 'Registrou sua primeira transação',
    icon: 'M5 13l4 4L19 7',
    color: '#10B981',
    unlocked: txCount >= 1,
  });

  achievements.push({
    id: 'tx-10',
    title: 'Organizado',
    description: '10+ transações registradas',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    color: '#6366f1',
    unlocked: txCount >= 10,
  });

  achievements.push({
    id: 'positive-balance',
    title: 'No azul',
    description: 'Saldo positivo no mês',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    color: '#22c55e',
    unlocked: bal > 0,
  });

  achievements.push({
    id: 'saver',
    title: 'Poupador',
    description: 'Economizou 20%+ da receita',
    icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
    color: '#F59E0B',
    unlocked: inc > 0 && (bal / inc) >= 0.2,
  });

  achievements.push({
    id: 'budget-master',
    title: 'Mestre do orçamento',
    description: 'Criou uma meta financeira',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    color: '#ec4899',
    unlocked: budgets.length >= 1,
  });

  achievements.push({
    id: 'tx-50',
    title: 'Controle total',
    description: '50+ transações registradas',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    color: '#8b5cf6',
    unlocked: txCount >= 50,
  });

  return achievements;
}

export default function Achievements({
  summary, transactions, budgets,
}: {
  summary: AnnualSummary | null;
  transactions: Transaction[];
  budgets: Budget[];
}) {
  const [showAll, setShowAll] = useState(false);
  const achievements = computeAchievements(summary, transactions, budgets);
  const unlocked = achievements.filter(a => a.unlocked).length;
  const display = showAll ? achievements : achievements.slice(0, 4);

  const [justUnlocked, setJustUnlocked] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('planejix_achievements') || '';
    const prev = new Set(stored.split(',').filter(Boolean));
    const current = achievements.filter(a => a.unlocked).map(a => a.id);
    const newOnes = current.filter(id => !prev.has(id));
    if (newOnes.length > 0) {
      setJustUnlocked(newOnes[0]);
      localStorage.setItem('planejix_achievements', current.join(','));
      setTimeout(() => setJustUnlocked(null), 3000);
    }
  }, [achievements]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          Conquistas
        </h3>
        <span className="text-[11px] text-gray-500">{unlocked}/{achievements.length}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {display.map((a) => (
          <div
            key={a.id}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all duration-300 ${
              a.unlocked ? '' : 'opacity-30 grayscale'
            } ${justUnlocked === a.id ? 'ring-2 ring-amber-400/50 animate-scale-in' : ''}`}
            style={{
              background: a.unlocked ? `${a.color}08` : 'rgba(255,255,255,0.02)',
              border: `1px solid ${a.unlocked ? `${a.color}20` : 'rgba(255,255,255,0.03)'}`,
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
              style={{ background: `${a.color}15` }}
            >
              <svg className="w-4 h-4" fill="none" stroke={a.color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={a.icon} />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-gray-900 dark:text-white truncate">{a.title}</p>
              <p className="text-[10px] text-gray-500 truncate">{a.description}</p>
            </div>
          </div>
        ))}
      </div>
      {achievements.length > 4 && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="w-full mt-3 text-[12px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
        >
          {showAll ? 'Ver menos' : `Ver todas (${achievements.length})`}
        </button>
      )}
    </div>
  );
}
