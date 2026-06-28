import { useState, useEffect, useRef, type FormEvent } from 'react';
import Modal from '../shared/Modal';
import { transactionsAPI, categoriesAPI } from '../../api/api';
import type { Category, Transaction, TransactionType, ExpenseKind } from '../../types';
import { useToast } from '../../context/ToastContext';

function DiscardModal({ open, onClose, onDiscard }: { open: boolean; onClose: () => void; onDiscard: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-xs rounded-2xl p-6 animate-scale-in bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 shadow-2xl">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Deseja descartar as alterações?</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Continuar editando</button>
          <button onClick={onDiscard} className="btn-danger flex-1 text-sm">Descartar</button>
        </div>
      </div>
    </div>
  );
}

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction?: Transaction;
}

const today = new Date().toISOString().split('T')[0];

export default function TransactionForm({ open, onClose, onSuccess, transaction }: TransactionFormProps) {
  const { toast } = useToast();
  const isEdit = !!transaction;
  const [type, setType] = useState<TransactionType>('expense');
  const [kind, setKind] = useState<ExpenseKind>('variable');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [categoryId, setCategoryId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState('2');
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
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
    setIsInstallment(false);
    setInstallmentCount('2');
    setError('');
    isDirty.current = false;
  };

  const markDirty = () => { isDirty.current = true; };

  const handleClose = () => {
    if (isDirty.current) {
      setShowDiscard(true);
      return;
    }
    reset();
    onClose();
  };

  const handleDiscard = () => {
    setShowDiscard(false);
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
        ...(isInstallment && !isEdit ? { installment_total: Number(installmentCount) } : {}),
      };
      if (isEdit && transaction) {
        await transactionsAPI.update(transaction.id, data);
      } else {
        await transactionsAPI.create(data as never);
      }
      reset();
      onSuccess();
      onClose();
      toast(isEdit ? 'Transação atualizada com sucesso' : 'Transação criada com sucesso');
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
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={() => { setType('income'); markDirty(); }}
              className={`flex-1 py-2.5 text-[13px] font-medium transition-all ${
                type === 'income'
                  ? 'bg-green-500/20 text-green-400'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Entrada
            </button>
            <button
              type="button"
              onClick={() => { setType('expense'); markDirty(); }}
              className={`flex-1 py-2.5 text-[13px] font-medium transition-all ${
                type === 'expense'
                  ? 'bg-red-500/20 text-red-400'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Saída
            </button>
          </div>
        </div>

        {/* Kind */}
        <div>
          <label className="label">Subtipo</label>
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {(['fixed', 'variable', 'custom'] as ExpenseKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => { setKind(k); markDirty(); }}
                className={`flex-1 py-2.5 text-[12px] font-medium transition-all ${
                  kind === k
                    ? 'bg-brand-500/20 text-brand-500'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {k === 'fixed' ? 'Fixo' : k === 'variable' ? 'Variável' : 'Outros'}
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

        {/* Toggles lado a lado */}
        <div className="grid grid-cols-2 gap-3">
          {/* Recorrente */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
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
            <span className="text-sm text-gray-600 dark:text-gray-300 leading-tight">Recorrente</span>
          </label>

          {/* Parcelado — só no modo criação */}
          {!isEdit && (
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div className="relative flex-shrink-0">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={isInstallment}
                  onChange={(e) => { setIsInstallment(e.target.checked); markDirty(); }}
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${isInstallment ? 'bg-orange-500' : 'bg-dark-600'}`} />
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isInstallment ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300 leading-tight">Parcelado</span>
            </label>
          )}
        </div>

        {/* Painel de parcelamento — full width abaixo dos toggles */}
        {!isEdit && isInstallment && (
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="label">Número de parcelas</label>
                <input
                  type="number"
                  className="input-field"
                  min={2}
                  max={48}
                  value={installmentCount}
                  onChange={(e) => { setInstallmentCount(e.target.value); markDirty(); }}
                />
              </div>
              <div className="flex-1">
                <label className="label">Valor por parcela</label>
                <div className="input-field bg-dark-800 text-orange-400 font-semibold">
                  {amount && Number(installmentCount) >= 2
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                        .format(parseFloat(amount.replace(',', '.')) / Number(installmentCount))
                    : '—'}
                </div>
              </div>
            </div>
            <p className="text-xs text-orange-400/70">
              💳 Serão criadas {installmentCount} transações com datas mensais consecutivas a partir da data informada.
            </p>
          </div>
        )}

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
      <DiscardModal open={showDiscard} onClose={() => setShowDiscard(false)} onDiscard={handleDiscard} />
    </Modal>
  );
}
