import type { Category } from '../category';
import { categoryBudgetProgress, groupTransactionsByDate, monthlySummary } from '../summary';
import type { Transaction } from '../transaction';

const tx = (overrides: Partial<Transaction>): Transaction => ({
  id: overrides.id ?? Math.random().toString(36),
  kind: 'expense',
  amount: 1000,
  categoryId: 'groceries',
  date: '2026-10-10',
  description: 'Test',
  paymentMethod: 'debit',
  createdAt: '2026-10-10T10:00:00.000Z',
  ...overrides,
});

const category = (overrides: Partial<Category>): Category => ({
  id: 'groceries',
  name: 'Groceries',
  icon: '🛒',
  monthlyBudget: null,
  kind: 'expense',
  ...overrides,
});

describe('monthlySummary', () => {
  it('sums income and expenses for the given month only', () => {
    const transactions = [
      tx({ kind: 'income', amount: 300000, categoryId: 'salary' }),
      tx({ amount: 4550 }),
      tx({ amount: 1250 }),
      tx({ amount: 99999, date: '2026-09-30' }),
      tx({ kind: 'income', amount: 5000, date: '2026-11-01' }),
    ];

    expect(monthlySummary(transactions, '2026-10')).toEqual({
      totalIncome: 300000,
      totalExpenses: 5800,
      balance: 294200,
    });
  });

  it('returns zeros for an empty month', () => {
    expect(monthlySummary([], '2026-10')).toEqual({ totalIncome: 0, totalExpenses: 0, balance: 0 });
  });

  it('can produce a negative balance', () => {
    expect(monthlySummary([tx({ amount: 700 })], '2026-10').balance).toBe(-700);
  });
});

describe('categoryBudgetProgress', () => {
  const categories = [
    category({ id: 'groceries', monthlyBudget: 10000 }),
    category({ id: 'home', name: 'Home', monthlyBudget: 5000 }),
    category({ id: 'health', name: 'Health', monthlyBudget: null }),
    category({ id: 'fun', name: 'Fun', monthlyBudget: null }),
    category({ id: 'salary', name: 'Salary', kind: 'income', monthlyBudget: null }),
  ];

  it('computes spending, percentage, and over-budget flags per expense category', () => {
    const transactions = [
      tx({ categoryId: 'groceries', amount: 2500 }),
      tx({ categoryId: 'groceries', amount: 2500 }),
      tx({ categoryId: 'home', amount: 6000 }),
      tx({ categoryId: 'health', amount: 800 }),
      tx({ categoryId: 'groceries', amount: 50000, date: '2026-09-01' }),
      tx({ kind: 'income', categoryId: 'salary', amount: 999999 }),
    ];

    const progress = categoryBudgetProgress(categories, transactions, '2026-10');

    expect(progress).toEqual([
      { category: categories[0], spent: 5000, budget: 10000, percentage: 50, overBudget: false },
      { category: categories[1], spent: 6000, budget: 5000, percentage: 120, overBudget: true },
      { category: categories[2], spent: 800, budget: null, percentage: null, overBudget: false },
    ]);
  });

  it('flags spending against a zero budget as over budget', () => {
    const progress = categoryBudgetProgress(
      [category({ monthlyBudget: 0 })],
      [tx({ amount: 1 })],
      '2026-10',
    );
    expect(progress[0]).toMatchObject({ percentage: 100, overBudget: true });
  });

  it('keeps budgeted categories even without spending', () => {
    const progress = categoryBudgetProgress([category({ monthlyBudget: 10000 })], [], '2026-10');
    expect(progress[0]).toMatchObject({ spent: 0, percentage: 0, overBudget: false });
  });

  it('treats exactly reaching the budget as not over', () => {
    const progress = categoryBudgetProgress(
      [category({ monthlyBudget: 1000 })],
      [tx({ amount: 1000 })],
      '2026-10',
    );
    expect(progress[0]).toMatchObject({ percentage: 100, overBudget: false });
  });
});

describe('groupTransactionsByDate', () => {
  it('groups by date, newest date first, newest created first within a day', () => {
    const a = tx({ id: 'a', date: '2026-10-01', createdAt: '2026-10-01T08:00:00.000Z' });
    const b = tx({ id: 'b', date: '2026-10-03', createdAt: '2026-10-03T08:00:00.000Z' });
    const c = tx({ id: 'c', date: '2026-10-01', createdAt: '2026-10-01T09:00:00.000Z' });

    expect(groupTransactionsByDate([a, b, c])).toEqual([
      { date: '2026-10-03', transactions: [b] },
      { date: '2026-10-01', transactions: [c, a] },
    ]);
  });
});
