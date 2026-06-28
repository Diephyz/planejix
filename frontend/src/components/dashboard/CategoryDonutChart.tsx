import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { transactionsAPI } from '../../api/api';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const renderActiveShape = (props: unknown) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value,
  } = props as {
    cx: number; cy: number; innerRadius: number; outerRadius: number;
    startAngle: number; endAngle: number; fill: string;
    payload: { name: string }; percent: number; value: number;
  };

  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#fff" fontSize={14} fontWeight={600}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#9ca3af" fontSize={12}>
        {fmt(value)} ({(percent * 100).toFixed(0)}%)
      </text>
      <Sector
        cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={(outerRadius as number) + 6}
        startAngle={startAngle} endAngle={endAngle} fill={fill}
      />
      <Sector
        cx={cx} cy={cy} innerRadius={(outerRadius as number) + 8} outerRadius={(outerRadius as number) + 10}
        startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.4}
      />
    </g>
  );
};

export default function CategoryDonutChart({ year, month }: { year: number; month: number }) {
  const [data, setData] = useState<{ name: string; color: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

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
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
        Gastos por categoria
      </h3>
      {loading ? (
        <div className="flex-1 flex items-center justify-center"><div className="spinner" /></div>
      ) : data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
          Nenhum gasto registrado
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={data}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  stroke="none"
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {data.slice(0, 5).map((cat) => {
              const pct = total > 0 ? (cat.value / total) * 100 : 0;
              return (
                <div key={cat.name} className="flex items-center gap-2 text-[12px]">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-gray-400 truncate flex-1">{cat.name}</span>
                  <span className="text-gray-900 dark:text-white font-medium">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
            {data.length > 5 && (
              <p className="text-[11px] text-gray-500 text-center">+{data.length - 5} categorias</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
