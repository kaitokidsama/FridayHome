import { isInMonth, type IsoDate, type MonthKey } from '../../shared/dates/isoDate';
import type { MinorUnits } from '../../shared/money/money';
import type { Category } from './category';
import type { Transaction } from './transaction';

export interface MonthlySummary {
  totalIncome: MinorUnits;
  totalExpenses: MinorUnits;
  balance: MinorUnits;
}

export function monthlySummary(transactions: readonly Transaction[], month: MonthKey): MonthlySummary {
  let totalIncome = 0;
  let totalExpenses = 0;
  for (const transaction of transactions) {
    if (!isInMonth(transaction.date, month)) continue;
    if (transaction.kind === 'income') totalIncome += transaction.amount;
    else totalExpenses += transaction.amount;
  }
  return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses };
}

export interface CategoryBudgetProgress {
  category: Category;
  spent: MinorUnits;
  budget: MinorUnits | null;
  /** Rounded percentage of the budget spent; null when the category has no budget. */
  percentage: number | null;
  overBudget: boolean;
}

/**
 * Spending vs budget for expense categories in a month. Categories are included
 * when they have a budget or any spending, in the order given.
 */
export function categoryBudgetProgress(
  categories: readonly Category[],
  transactions: readonly Transaction[],
  month: MonthKey,
): CategoryBudgetProgress[] {
  const spentByCategory = new Map<string, MinorUnits>();
  for (const transaction of transactions) {
    if (transaction.kind !== 'expense' || !isInMonth(transaction.date, month)) continue;
    spentByCategory.set(
      transaction.categoryId,
      (spentByCategory.get(transaction.categoryId) ?? 0) + transaction.amount,
    );
  }

  return categories
    .filter((category) => category.kind === 'expense')
    .map((category) => {
      const spent = spentByCategory.get(category.id) ?? 0;
      const budget = category.monthlyBudget;
      return { category, spent, budget, ...budgetRatio(spent, budget) };
    })
    .filter((progress) => progress.budget !== null || progress.spent > 0);
}

function budgetRatio(spent: MinorUnits, budget: MinorUnits | null) {
  if (budget === null) return { percentage: null, overBudget: false };
  if (budget === 0) return { percentage: spent > 0 ? 100 : 0, overBudget: spent > 0 };
  return { percentage: Math.round((spent / budget) * 100), overBudget: spent > budget };
}

export interface TransactionDayGroup {
  date: IsoDate;
  transactions: Transaction[];
}

/** Groups transactions by date, newest date first and newest entry first within a day. */
export function groupTransactionsByDate(transactions: readonly Transaction[]): TransactionDayGroup[] {
  const sorted = [...transactions].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
  const groups: TransactionDayGroup[] = [];
  for (const transaction of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.date === transaction.date) last.transactions.push(transaction);
    else groups.push({ date: transaction.date, transactions: [transaction] });
  }
  return groups;
}
