interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'green' | 'red' | 'indigo' | 'yellow';
  subtitle?: string;
}

const colorMap = {
  green: {
    bg: 'bg-green-500/10',
    icon: 'text-green-400',
    value: 'text-green-400',
    border: 'border-green-500/20',
  },
  red: {
    bg: 'bg-red-500/10',
    icon: 'text-red-400',
    value: 'text-red-400',
    border: 'border-red-500/20',
  },
  indigo: {
    bg: 'bg-brand-500/10',
    icon: 'text-brand-500',
    value: 'text-white',
    border: 'border-brand-500/20',
  },
  yellow: {
    bg: 'bg-yellow-500/10',
    icon: 'text-yellow-400',
    value: 'text-yellow-400',
    border: 'border-yellow-500/20',
  },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function SummaryCard({ title, value, icon, color, subtitle }: SummaryCardProps) {
  const c = colorMap[color];
  return (
    <div className={`card border ${c.border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${c.value}`}>{formatCurrency(value)}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`${c.bg} p-3 rounded-xl`}>
          <div className={c.icon}>{icon}</div>
        </div>
      </div>
    </div>
  );
}
