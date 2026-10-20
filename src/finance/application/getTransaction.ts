import type { Transaction } from '../domain/transaction';
import type { TransactionRepository } from './ports';

export function getTransaction(
  deps: { transactions: TransactionRepository },
  id: string,
): Promise<Transaction | null> {
  return deps.transactions.getById(id);
}
