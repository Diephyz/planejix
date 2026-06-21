import { useState } from 'react';
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
  const [showDateRange, setShowDateRange] = useState(!!(filters.date_from || filters.date_to));

  const toggleDateRange = () => {
    if (showDateRange) {
      setShowDateRange(false);
      onChange({ ...filters, date_from: undefined, date_to: undefined });
    } else {
      setShowDateRange(true);
      onChange({ ...filters, month: '', year: undefined });
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
        {!showDateRange && (
          <>
            <select
              className="input-field text-sm"
              value={filters.year || currentYear}
              onChange={(e) => onChange({ ...filters, year: Number(e.target.value) })}
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>

            <select
              className="input-field text-sm"
              value={filters.month ?? ''}
              onChange={(e) => onChange({ ...filters, month: e.target.value ? Number(e.target.value) : '' })}
            >
              <option value="">Todos</option>
              {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </>
        )}

        <select
          className="input-field text-sm"
          value={filters.type || 'all'}
          onChange={(e) => onChange({ ...filters, type: e.target.value as never })}
        >
          <option value="all">Todos tipos</option>
          <option value="income">Entradas</option>
          <option value="expense">Saídas</option>
        </select>

        <select
          className="input-field text-sm"
          value={filters.category_id ?? ''}
          onChange={(e) => onChange({ ...filters, category_id: e.target.value ? Number(e.target.value) : '' })}
        >
          <option value="">Categorias</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <button
          onClick={toggleDateRange}
          className={`btn-secondary text-sm px-3 py-2 flex items-center justify-center gap-1.5 ${showDateRange ? 'border-brand-500 text-brand-400' : ''}`}
          title="Filtrar por período personalizado"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="hidden sm:inline">Período</span>
        </button>

        <button
          onClick={() => {
            setShowDateRange(false);
            onChange({ year: currentYear, month: new Date().getMonth() + 1, type: 'all', category_id: '' });
          }}
          className="btn-secondary text-sm px-3 py-2"
        >
          Limpar
        </button>
      </div>

      {showDateRange && (
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 whitespace-nowrap">De:</label>
            <input
              type="date"
              className="input-field w-auto"
              value={filters.date_from || ''}
              onChange={(e) => onChange({ ...filters, date_from: e.target.value || undefined })}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 whitespace-nowrap">Até:</label>
            <input
              type="date"
              className="input-field w-auto"
              value={filters.date_to || ''}
              onChange={(e) => onChange({ ...filters, date_to: e.target.value || undefined })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
