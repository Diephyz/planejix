import { useState } from 'react';
import { transactionsAPI } from '../../api/api';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const SUGGESTIONS = [
  'Quanto gastei este mês?',
  'Qual meu maior gasto?',
  'Como estão minhas finanças?',
  'Quanto economizei?',
];

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

async function processQuestion(question: string): Promise<string> {
  const q = question.toLowerCase();

  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const summaryRes = await transactionsAPI.getSummary(year, month);
    const s = summaryRes.data;
    const { totalIncome, totalExpenses, balance } = s.annual;

    const accRes = await transactionsAPI.getAccumulated();
    const acc = accRes.data;

    if (q.includes('gaste') || q.includes('despesa') || q.includes('saíd')) {
      const topCat = s.byCategoryMonth?.[0];
      let resp = `Este mês você gastou ${fmt(totalExpenses)} no total.`;
      if (topCat) resp += ` A categoria com maior gasto foi ${topCat.name} (${fmt(topCat.value)}).`;
      if (s.previousMonth && s.previousMonth.totalExpenses > 0) {
        const pct = ((totalExpenses - s.previousMonth.totalExpenses) / s.previousMonth.totalExpenses) * 100;
        if (pct > 5) resp += ` Isso é ${pct.toFixed(0)}% a mais que o mês passado.`;
        else if (pct < -5) resp += ` Isso é ${Math.abs(pct).toFixed(0)}% a menos que o mês passado. Bom trabalho!`;
      }
      return resp;
    }

    if (q.includes('maior gasto') || q.includes('mais gaste')) {
      const topCat = s.byCategoryMonth?.[0];
      if (topCat) {
        const pct = totalExpenses > 0 ? ((topCat.value / totalExpenses) * 100).toFixed(0) : '0';
        return `Seu maior gasto este mês é em ${topCat.name}: ${fmt(topCat.value)} (${pct}% do total). O maior valor individual foi ${fmt(s.largestExpense)}.`;
      }
      return `Seu maior gasto individual este mês foi ${fmt(s.largestExpense)}.`;
    }

    if (q.includes('economi') || q.includes('poup') || q.includes('sobr')) {
      if (balance > 0) {
        const rate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(0) : '0';
        return `Você economizou ${fmt(balance)} este mês (${rate}% da receita). ${Number(rate) >= 20 ? 'Excelente taxa de poupança!' : 'Tente alcançar pelo menos 20% de economia.'}`;
      }
      return `Este mês seu saldo está negativo em ${fmt(Math.abs(balance))}. Revise seus gastos para voltar ao positivo.`;
    }

    if (q.includes('receita') || q.includes('ganh') || q.includes('entrad')) {
      let resp = `Sua receita este mês é ${fmt(totalIncome)}.`;
      if (s.previousMonth && s.previousMonth.totalIncome > 0) {
        const pct = ((totalIncome - s.previousMonth.totalIncome) / s.previousMonth.totalIncome) * 100;
        if (Math.abs(pct) > 5) resp += ` ${pct > 0 ? 'Aumento' : 'Redução'} de ${Math.abs(pct).toFixed(0)}% vs mês anterior.`;
      }
      return resp;
    }

    if (q.includes('saldo') || q.includes('total') || q.includes('patrimônio') || q.includes('patrimonio') || q.includes('tenho')) {
      return `Seu saldo total acumulado é ${fmt(acc.totalBalance)}. Este mês: receita ${fmt(totalIncome)}, despesa ${fmt(totalExpenses)}, saldo ${fmt(balance)}.`;
    }

    if (q.includes('finanças') || q.includes('financ') || q.includes('como est') || q.includes('resumo')) {
      const ratio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 100;
      let health = '';
      if (ratio <= 50) health = 'Suas finanças estão excelentes!';
      else if (ratio <= 75) health = 'Suas finanças estão saudáveis.';
      else if (ratio <= 95) health = 'Atenção: seus gastos estão altos em relação à receita.';
      else health = 'Situação crítica: gastos ultrapassando a receita.';

      return `${health} Receita: ${fmt(totalIncome)}, Despesas: ${fmt(totalExpenses)}, Saldo do mês: ${fmt(balance)}. Saldo acumulado total: ${fmt(acc.totalBalance)}.`;
    }

    if (q.includes('dica') || q.includes('sugest') || q.includes('conselho') || q.includes('ajud')) {
      const tips = [];
      if (totalIncome > 0 && (balance / totalIncome) < 0.2) tips.push('Tente economizar pelo menos 20% da sua receita mensal.');
      const topCat = s.byCategoryMonth?.[0];
      if (topCat && totalExpenses > 0 && (topCat.value / totalExpenses) > 0.4) tips.push(`${topCat.name} representa mais de 40% dos seus gastos. Considere reduzir.`);
      if (balance < 0) tips.push('Seu saldo está negativo. Priorize cortar gastos variáveis.');
      tips.push('Registre todas as despesas, mesmo as pequenas. Elas somam no final do mês.');
      return tips.join(' ');
    }

    return `Este mês: Receita ${fmt(totalIncome)}, Despesas ${fmt(totalExpenses)}, Saldo ${fmt(balance)}. Saldo total: ${fmt(acc.totalBalance)}. Pergunte algo mais específico como "Quanto gastei?" ou "Qual meu maior gasto?".`;

  } catch {
    return 'Não consegui acessar seus dados. Verifique sua conexão e tente novamente.';
  }
}

export default function FinanceAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Olá! Sou seu assistente financeiro. Pergunte sobre seus gastos, receitas, economia ou peça dicas!' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (text?: string) => {
    const q = text || input.trim();
    if (!q || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);

    const answer = await processQuestion(q);
    setMessages(prev => [...prev, { role: 'assistant', text: answer }]);
    setLoading(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-30 w-12 h-12 rounded-full flex items-center justify-center text-gray-900 dark:text-white shadow-lg cursor-pointer transition-all hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 20px rgba(16,185,129,0.4)' }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden shadow-2xl animate-scale-in flex flex-col bg-white dark:bg-dark-900" style={{ maxHeight: '500px', border: '1px solid rgba(16,185,129,0.15)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Assistente financeiro</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-gray-900 dark:text-white/70 hover:text-gray-900 dark:text-white cursor-pointer">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ maxHeight: '320px' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-xl text-[13px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-emerald-500 text-gray-900 dark:text-white rounded-br-sm'
                  : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-bl-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-dark-700 px-4 py-2 rounded-xl rounded-bl-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-100 dark:border-dark-700">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte sobre suas finanças..."
            className="flex-1 text-[13px] px-3 py-2 rounded-lg bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-400"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-900 dark:text-white disabled:opacity-30 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
