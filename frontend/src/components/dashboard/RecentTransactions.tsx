import type { Transaction } from '../../types';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');

const kindLabels: Record<string, string> = {
  fixed: 'Fixo',
  variable: 'Variável',
  custom: 'Personalizado',
};

export default function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="card">
        <h3 className="text-base font-semibold mb-4">Transações Recentes</h3>
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>Nenhuma transação ainda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-base font-semibold mb-4">Transações Recentes</h3>
      <div className="space-y-3">
        {transactions.slice(0, 8).map((t) => (
          <div key={t.id} className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0">
            <div className="flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: t.category_color || (t.type === 'income' ? '#22c55e' : '#ef4444') }}
              />
              <div>
                <p className="text-sm font-medium text-white truncate max-w-[180px]">{t.description}</p>
                <p className="text-xs text-gray-500">
                  {formatDate(t.date)}
                  {t.category_name && ` · ${t.category_name}`}
                  {t.kind && ` · ${kindLabels[t.kind] ?? t.kind}`}
                </p>
              </div>
            </div>
            <span className={`text-sm font-semibold flex-shrink-0 ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
