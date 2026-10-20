import {
  InMemoryCategoryRepository,
  InMemorySettingsRepository,
  InMemoryTransactionRepository,
  sampleCategories,
  sampleTransaction,
} from '../../../testing/fakes';
import { CURRENCY_SETTING_KEY, getCurrency, setCurrency } from '../currency';
import { getMonthOverview } from '../getMonthOverview';
import { listCategories } from '../listCategories';
import { setCategoryBudget } from '../setCategoryBudget';

describe('getMonthOverview', () => {
  it('combines the monthly summary and budget progress', async () => {
    const deps = {
      transactions: new InMemoryTransactionRepository([
        sampleTransaction({ id: 'a', amount: 50000 }),
        sampleTransaction({ id: 'b', kind: 'income', categoryId: 'salary', amount: 200000 }),
      ]),
      categories: new InMemoryCategoryRepository(sampleCategories()),
    };

    const overview = await getMonthOverview(deps, '2026-10');

    expect(overview.summary).toEqual({ totalIncome: 200000, totalExpenses: 50000, balance: 150000 });
    expect(overview.budgets).toHaveLength(1);
    expect(overview.budgets[0]).toMatchObject({ spent: 50000, percentage: 125, overBudget: true });
  });
});

describe('listCategories', () => {
  it('filters by kind when requested', async () => {
    const categories = new InMemoryCategoryRepository(sampleCategories());
    expect((await listCategories({ categories }, 'income')).map((c) => c.id)).toEqual(['salary']);
    expect(await listCategories({ categories })).toHaveLength(3);
  });
});

describe('setCategoryBudget', () => {
  it('stores a budget in minor units', async () => {
    const categories = new InMemoryCategoryRepository(sampleCategories());

    await setCategoryBudget({ categories }, 'home', 15000);

    expect((await categories.getById('home'))?.monthlyBudget).toBe(15000);
  });

  it('clears a budget with null', async () => {
    const categories = new InMemoryCategoryRepository(sampleCategories());
    await setCategoryBudget({ categories }, 'groceries', null);
    expect((await categories.getById('groceries'))?.monthlyBudget).toBeNull();
  });

  it('rejects negative or fractional budgets', async () => {
    const categories = new InMemoryCategoryRepository(sampleCategories());
    await expect(setCategoryBudget({ categories }, 'home', -1)).rejects.toThrow('Invalid budget');
    await expect(setCategoryBudget({ categories }, 'home', 1.5)).rejects.toThrow('Invalid budget');
  });

  it('rejects budgets for unknown or income categories', async () => {
    const categories = new InMemoryCategoryRepository(sampleCategories());
    await expect(setCategoryBudget({ categories }, 'nope', 100)).rejects.toThrow('not found');
    await expect(setCategoryBudget({ categories }, 'salary', 100)).rejects.toThrow('expense');
  });
});

describe('currency', () => {
  it('defaults to the device currency, then USD', async () => {
    const settings = new InMemorySettingsRepository();
    expect(await getCurrency({ settings }, 'MXN')).toBe('MXN');
    expect(await getCurrency({ settings }, null)).toBe('USD');
  });

  it('persists a chosen currency', async () => {
    const settings = new InMemorySettingsRepository();

    await setCurrency({ settings }, 'EUR');

    expect(settings.values.get(CURRENCY_SETTING_KEY)).toBe('EUR');
    expect(await getCurrency({ settings }, 'MXN')).toBe('EUR');
  });

  it('normalizes case and rejects invalid codes', async () => {
    const settings = new InMemorySettingsRepository();
    await setCurrency({ settings }, ' gbp ');
    expect(settings.values.get(CURRENCY_SETTING_KEY)).toBe('GBP');
    await expect(setCurrency({ settings }, 'EURO')).rejects.toThrow('Invalid currency');
  });
});
