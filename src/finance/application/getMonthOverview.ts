import type { MonthKey } from '../../shared/dates/isoDate';
import {
  categoryBudgetProgress,
  monthlySummary,
  type CategoryBudgetProgress,
  type MonthlySummary,
} from '../domain/summary';
import type { CategoryRepository, TransactionRepository } from './ports';

export interface MonthOverview {
  summary: MonthlySummary;
  budgets: CategoryBudgetProgress[];
}

export async function getMonthOverview(
  deps: { transactions: TransactionRepository; categories: CategoryRepository },
  month: MonthKey,
): Promise<MonthOverview> {
  const [transactions, categories] = await Promise.all([
    deps.transactions.listByMonth(month),
    deps.categories.list(),
  ]);
  return {
    summary: monthlySummary(transactions, month),
    budgets: categoryBudgetProgress(categories, transactions, month),
  };
}
