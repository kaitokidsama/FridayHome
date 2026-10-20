import type { MonthKey } from '../../shared/dates/isoDate';
import type { Category } from '../domain/category';
import { groupTransactionsByDate, type TransactionDayGroup } from '../domain/summary';
import type { CategoryRepository, TransactionRepository } from './ports';

export interface MonthTransactions {
  groups: TransactionDayGroup[];
  categoriesById: Record<string, Category>;
}

export async function listMonthTransactions(
  deps: { transactions: TransactionRepository; categories: CategoryRepository },
  month: MonthKey,
): Promise<MonthTransactions> {
  const [transactions, categories] = await Promise.all([
    deps.transactions.listByMonth(month),
    deps.categories.list(),
  ]);
  return {
    groups: groupTransactionsByDate(transactions),
    categoriesById: Object.fromEntries(categories.map((c) => [c.id, c])),
  };
}
