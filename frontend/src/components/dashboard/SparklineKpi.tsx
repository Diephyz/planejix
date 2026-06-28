import { useAnimatedValue } from '../../hooks/useAnimatedValue';
import type { MonthlySummary } from '../../types';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface SparklineKpiProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  textClass: string;
  sparkData: number[];
  previousValue?: number;
  invertTrend?: boolean;
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });

  return (
    <svg width={w} height={h} className="flex-shrink-0 opacity-60">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${points.join(' ')} ${w},${h}`}
        fill={`url(#spark-${color.replace('#', '')})`}
      />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SparklineKpi({
  label, value, icon, color, textClass, sparkData, previousValue, invertTrend,
}: SparklineKpiProps) {
  const animated = useAnimatedValue(value);

  let trend: React.ReactNode = null;
  if (previousValue !== undefined && previousValue > 0) {
    const pct = ((value - previousValue) / previousValue) * 100;
    if (Math.abs(pct) >= 0.5) {
      const isUp = pct > 0;
      const isGood = invertTrend ? !isUp : isUp;
      trend = (
        <span className={`text-[10px] font-semibold ${isGood ? 'text-emerald-400' : 'text-red-400'}`}>
          {isUp ? '↑' : '↓'} {Math.abs(pct).toFixed(0)}%
        </span>
      );
    }
  }

  return (
    <div
      className="rounded-2xl p-4 transition-all duration-300 hover:translate-y-[-2px] min-w-0 bg-white dark:bg-dark-800/50 border border-gray-100 dark:border-white/5"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: `${color}15` }}>
            <div style={{ color }}>{icon}</div>
          </div>
          <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider truncate">{label}</span>
        </div>
        <MiniSparkline data={sparkData} color={color} />
      </div>
      <div className="flex items-baseline gap-2">
        <p className={`text-lg font-bold truncate ${textClass}`}>{fmt(animated)}</p>
        {trend}
      </div>
    </div>
  );
}

export function extractSparkData(monthly: MonthlySummary[], field: 'income' | 'expenses' | 'balance'): number[] {
  return monthly.map((m) => m[field]).filter((_, i) => {
    const currentMonth = new Date().getMonth();
    return i <= currentMonth;
  });
}
