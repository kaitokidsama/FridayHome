import { isIsoDate, type IsoDate } from '../../shared/dates/isoDate';
import type { MinorUnits } from '../../shared/money/money';

export type TransactionKind = 'expense' | 'income';
export type PaymentMethod = 'cash' | 'debit' | 'credit' | 'transfer';

export const TRANSACTION_KINDS: readonly TransactionKind[] = ['expense', 'income'];
export const PAYMENT_METHODS: readonly PaymentMethod[] = ['cash', 'debit', 'credit', 'transfer'];

export interface Transaction {
  id: string;
  kind: TransactionKind;
  amount: MinorUnits;
  categoryId: string;
  date: IsoDate;
  description: string;
  paymentMethod: PaymentMethod;
  /** ISO timestamp. */
  createdAt: string;
}

export type TransactionDraft = Omit<Transaction, 'id' | 'createdAt'>;

export type TransactionField = keyof TransactionDraft;

export function validateTransactionDraft(draft: TransactionDraft): TransactionField[] {
  const errors: TransactionField[] = [];
  if (!TRANSACTION_KINDS.includes(draft.kind)) errors.push('kind');
  if (!Number.isSafeInteger(draft.amount) || draft.amount <= 0) errors.push('amount');
  if (!draft.categoryId) errors.push('categoryId');
  if (!isIsoDate(draft.date)) errors.push('date');
  if (!PAYMENT_METHODS.includes(draft.paymentMethod)) errors.push('paymentMethod');
  return errors;
}
