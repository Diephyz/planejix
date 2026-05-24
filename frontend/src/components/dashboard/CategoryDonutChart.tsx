import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Sector } from 'recharts';
import { transactionsAPI } from '../../api/api';

interface Slice { name: string; color: string; value: number; }
interface Props { mode: 'monthly' | 'annual'; }

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const RADIAN = Math.PI / 180;

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const renderLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: {
  cx: number; cy: number; midAngle: number;
  innerRadius: number; outerRadius: number; percent: number;
}) => {
  if (percent < 0.04) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
  return (
    <g>
      {/* Outer glow ring */}
      <Sector
        cx={cx} cy={cy}
        innerRadius={outerRadius + 4}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.3}
      />
      {/* Main sector slightly expanded */}
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 5}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      {/* Center text */}
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={700}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#9ca3af" fontSize={11}>
        {fmt(payload.value)}
      </text>
      <text x={cx} y={cy + 26} textAnchor="middle" fill="#6b7280" fontSize={11}>
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    </g>
  );
};

export default function CategoryDonutChart({ mode }: Props) {
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<Slice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  useEffect(() => {
    setLoading(true);
    setActiveIndex(undefined);
    transactionsAPI
      .getByCategory(year, mode === 'monthly' ? month : undefined)
      .then((res) => setData(res.data.filter((d) => d.value > 0)))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [year, month, mode]);

  const title = mode === 'monthly'
    ? `Despesas — ${MONTHS[month - 1]} ${year}`
    : `Despesas — Ano ${year}`;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-gray-300">{title}</h3>
        <div className="flex gap-2">
          {mode === 'monthly' && (
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="input-field py-1 text-xs w-32"
            >
              {MONTHS.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
          )}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="input-field py-1 text-xs w-24"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[300px]">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-gray-500 text-sm">
          Nenhum gasto registrado
        </div>
      ) : (
        <div
          className="h-[300px] select-none"
          onMouseDown={(e) => e.preventDefault()}
          style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="48%"
                innerRadius={65}
                outerRadius={100}
                dataKey="value"
                paddingAngle={3}
                labelLine={false}
                label={activeIndex === undefined ? renderLabel : undefined}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(undefined)}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} opacity={activeIndex === undefined || activeIndex === i ? 1 : 0.5} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                formatter={(value) => <span style={{ color: '#9ca3af' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
