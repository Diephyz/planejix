import type { Category, TransactionFilters } from '../../types';

interface FiltersProps {
  filters: TransactionFilters;
  categories: Category[];
  onChange: (f: TransactionFilters) => void;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
const months = [
  { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' }, { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' }, { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' },
];

export default function TransactionFilters({ filters, categories, onChange }: FiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <select
        className="input-field w-auto min-w-[90px]"
        value={filters.year || currentYear}
        onChange={(e) => onChange({ ...filters, year: Number(e.target.value) })}
      >
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>

      <select
        className="input-field w-auto min-w-[110px]"
        value={filters.month ?? ''}
        onChange={(e) => onChange({ ...filters, month: e.target.value ? Number(e.target.value) : '' })}
      >
        <option value="">Todos os meses</option>
        {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>

      <select
        className="input-field w-auto min-w-[100px]"
        value={filters.type || 'all'}
        onChange={(e) => onChange({ ...filters, type: e.target.value as never })}
      >
        <option value="all">Todos os tipos</option>
        <option value="income">Entradas</option>
        <option value="expense">Saídas</option>
      </select>

      <select
        className="input-field w-auto min-w-[130px]"
        value={filters.category_id ?? ''}
        onChange={(e) => onChange({ ...filters, category_id: e.target.value ? Number(e.target.value) : '' })}
      >
        <option value="">Todas as categorias</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <button
        onClick={() => onChange({ year: currentYear, month: '', type: 'all', category_id: '' })}
        className="btn-secondary text-sm px-3 py-2"
      >
        Limpar
      </button>
    </div>
  );
}
