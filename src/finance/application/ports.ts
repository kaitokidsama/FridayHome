import type { IsoDate, MonthKey } from '../../shared/dates/isoDate';
import type { MinorUnits } from '../../shared/money/money';
import type { Category } from '../domain/category';
import type { Transaction } from '../domain/transaction';

export interface CategoryRepository {
  list(): Promise<Category[]>;
  getById(id: string): Promise<Category | null>;
  updateBudget(id: string, monthlyBudget: MinorUnits | null): Promise<void>;
}

export interface TransactionRepository {
  listByMonth(month: MonthKey): Promise<Transaction[]>;
  getById(id: string): Promise<Transaction | null>;
  insert(transaction: Transaction): Promise<void>;
  update(transaction: Transaction): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface SettingsRepository {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

/**
 * Port through which finance asks the invoices feature to track a pending
 * invoice for an expense. Implemented in the composition root.
 */
export interface PendingInvoiceTracker {
  setPending(input: {
    transactionId: string;
    description: string;
    expectedDate: IsoDate | null;
  }): Promise<void>;
  /** Removes a still-pending invoice for the transaction; received invoices are kept. */
  clearPending(transactionId: string): Promise<void>;
  /** Removes every invoice of a transaction that is being deleted. */
  removeAllFor(transactionId: string): Promise<void>;
}
