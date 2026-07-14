import type { Transaction, ExpenseStatus } from '../types';

// Data de hoje em horário local — toISOString é UTC e vira o dia às 21h no Brasil
export function localToday(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

/**
 * Deriva o status de pagamento de uma transação. Receita não tem status (null).
 * 'overdue' (vencida) = a pagar com data já passada — derivado, nunca persistido.
 */
export function getExpenseStatus(t: Pick<Transaction, 'type' | 'date' | 'paid_at'>): ExpenseStatus | null {
  if (t.type !== 'expense') return null;
  if (t.paid_at) return 'paid';
  return t.date < localToday() ? 'overdue' : 'pending';
}

export const STATUS_LABEL: Record<ExpenseStatus, string> = {
  paid: 'Paga',
  pending: 'A pagar',
  overdue: 'Vencida',
};
