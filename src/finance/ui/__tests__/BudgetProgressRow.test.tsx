import { render, screen } from '@testing-library/react-native';

import { strings } from '../../../shared/i18n/strings';
import { formatMoney } from '../../../shared/money/money';
import type { Category } from '../../domain/category';
import { BudgetProgressRow } from '../BudgetProgressRow';

const category: Category = {
  id: 'groceries',
  name: 'Groceries',
  icon: '🛒',
  monthlyBudget: 10000,
  kind: 'expense',
};

const format = (amount: number) => formatMoney(amount, 'USD', 'en-US');

describe('BudgetProgressRow', () => {
  it('shows spending against the budget', async () => {
    await render(
      <BudgetProgressRow
        progress={{ category, spent: 5000, budget: 10000, percentage: 50, overBudget: false }}
        format={format}
      />,
    );

    expect(screen.getByText(strings.summary.spentOfBudget('$50.00', '$100.00'))).toBeOnTheScreen();
    expect(screen.getByText('50%')).toBeOnTheScreen();
    expect(screen.queryByText(new RegExp(strings.summary.overBudget))).toBeNull();
  });

  it('flags over-budget categories', async () => {
    await render(
      <BudgetProgressRow
        progress={{ category, spent: 12000, budget: 10000, percentage: 120, overBudget: true }}
        format={format}
      />,
    );

    expect(screen.getByText(`${strings.summary.overBudget} · 120%`)).toBeOnTheScreen();
  });

  it('describes categories without a budget', async () => {
    await render(
      <BudgetProgressRow
        progress={{
          category: { ...category, monthlyBudget: null },
          spent: 800,
          budget: null,
          percentage: null,
          overBudget: false,
        }}
        format={format}
      />,
    );

    expect(screen.getByText(strings.summary.spentNoBudget('$8.00'))).toBeOnTheScreen();
  });
});
