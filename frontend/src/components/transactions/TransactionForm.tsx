import { useState, useEffect, useRef, type FormEvent } from 'react';
import Modal from '../shared/Modal';
import { transactionsAPI, categoriesAPI } from '../../api/api';
import type { Category, Transaction, TransactionType, ExpenseKind } from '../../types';

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction?: Transaction;
}

const today = new Date().toISOString().split('T')[0];

export default function TransactionForm({ open, onClose, onSuccess, transaction }: TransactionFormProps) {
  const isEdit = !!transaction;
  const [type, setType] = useState<TransactionType>('expense');
  const [kind, setKind] = useState<ExpenseKind>('variable');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [categoryId, setCategoryId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isDirty = useRef(false);

  useEffect(() => {
    if (open) {
      isDirty.current = false;
      categoriesAPI.getAll().then((res) => setCategories(res.data)).catch(() => {});
      if (transaction) {
        setType(transaction.type);
        setKind(transaction.kind || 'variable');
        setDescription(transaction.description);
        setAmount(String(transaction.amount));
        setDate(transaction.date);
        setCategoryId(transaction.category_id ? String(transaction.category_id) : '');
        setNotes(transaction.notes || '');
        setRecurring(!!transaction.recurring);
      } else {
        reset();
      }
    }
  }, [open, transaction]);

  const reset = () => {
    setType('expense');
    setKind('variable');
    setDescription('');
    setAmount('');
    setDate(today);
    setCategoryId('');
    setNotes('');
    setRecurring(false);
    setError('');
    isDirty.current = false;
  };

  const markDirty = () => { isDirty.current = true; };

  const handleClose = () => {
    if (isDirty.current && !window.confirm('Deseja descartar as alterações?')) return;
    reset();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!description.trim() || !amount || !date) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Valor inválido');
      return;
    }
    setLoading(true);
    try {
      const data = {
        type,
        kind,
        description: description.trim(),
        amount: numAmount,
        date,
        category_id: categoryId ? Number(categoryId) : null,
        notes: notes.trim() || undefined,
        recurring,
      };
      if (isEdit && transaction) {
        await transactionsAPI.update(transaction.id, data);
      } else {
        await transactionsAPI.create(data as never);
      }
      reset();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Erro ao salvar transação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title={isEdit ? 'Editar Transação' : 'Nova Transação'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type toggle */}
        <div>
          <label className="label">Tipo</label>
          <div className="flex rounded-lg overflow-hidden border border-dark-600">
            <button
              type="button"
              onClick={() => { setType('income'); markDirty(); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                type === 'income'
                  ? 'bg-green-600 text-white'
                  : 'bg-dark-700 text-gray-400 hover:text-white'
              }`}
            >
              Entrada
            </button>
            <button
              type="button"
              onClick={() => { setType('expense'); markDirty(); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                type === 'expense'
                  ? 'bg-red-600 text-white'
                  : 'bg-dark-700 text-gray-400 hover:text-white'
              }`}
            >
              Saída
            </button>
          </div>
        </div>

        {/* Kind */}
        <div>
          <label className="label">Subtipo</label>
          <div className="flex rounded-lg overflow-hidden border border-dark-600">
            {(['fixed', 'variable', 'custom'] as ExpenseKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => { setKind(k); markDirty(); }}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${
                  kind === k
                    ? 'bg-brand-500 text-white'
                    : 'bg-dark-700 text-gray-400 hover:text-white'
                }`}
              >
                {k === 'fixed' ? 'Fixo' : k === 'variable' ? 'Variável' : 'Personalizado'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Descrição *</label>
          <input
            type="text"
            className="input-field"
            placeholder="Ex: Aluguel, Salário..."
            value={description}
            onChange={(e) => { setDescription(e.target.value); markDirty(); }}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Valor (R$) *</label>
            <input
              type="number"
              className="input-field"
              placeholder="0,00"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); markDirty(); }}
              min="0.01"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="label">Data *</label>
            <input
              type="date"
              className="input-field"
              value={date}
              onChange={(e) => { setDate(e.target.value); markDirty(); }}
              required
            />
          </div>
        </div>

        <div>
          <label className="label">Categoria</label>
          <select
            className="input-field"
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); markDirty(); }}
          >
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Observações</label>
          <textarea
            className="input-field resize-none"
            rows={2}
            placeholder="Opcional..."
            value={notes}
            onChange={(e) => { setNotes(e.target.value); markDirty(); }}
          />
        </div>

        {/* Recurring toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div className="relative flex-shrink-0">
            <input
              type="checkbox"
              className="sr-only"
              checked={recurring}
              onChange={(e) => { setRecurring(e.target.checked); markDirty(); }}
            />
            <div className={`w-10 h-5 rounded-full transition-colors ${recurring ? 'bg-brand-500' : 'bg-dark-600'}`} />
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${recurring ? 'translate-x-5' : ''}`} />
          </div>
          <span className="text-sm text-gray-300 dark:text-gray-300">Transação recorrente</span>
        </label>

        {error && (
          <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={handleClose} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button type="submit" className="btn-primary flex-1" disabled={loading}>
            {loading ? 'Salvando...' : isEdit ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
