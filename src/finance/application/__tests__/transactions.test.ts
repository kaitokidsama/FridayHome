import {
  FakePendingInvoiceTracker,
  InMemoryCategoryRepository,
  InMemoryTransactionRepository,
  fixedClock,
  sampleCategories,
  sampleTransaction,
  sequentialIds,
} from '../../../testing/fakes';
import type { TransactionDraft } from '../../domain/transaction';
import { deleteTransaction } from '../deleteTransaction';
import { getTransaction } from '../getTransaction';
import { listMonthTransactions } from '../listMonthTransactions';
import { saveTransaction, type SaveTransactionDeps } from '../saveTransaction';

const draft = (overrides: Partial<TransactionDraft> = {}): TransactionDraft => ({
  kind: 'expense',
  amount: 4599,
  categoryId: 'groceries',
  date: '2026-10-19',
  description: 'Supermarket',
  paymentMethod: 'credit',
  ...overrides,
});

const noInvoice = { pending: false, expectedDate: null };

function setup(existing = [] as ReturnType<typeof sampleTransaction>[]) {
  const deps: SaveTransactionDeps & {
    transactions: InMemoryTransactionRepository;
    invoices: FakePendingInvoiceTracker;
  } = {
    transactions: new InMemoryTransactionRepository(existing),
    categories: new InMemoryCategoryRepository(sampleCategories()),
    invoices: new FakePendingInvoiceTracker(),
    newId: sequentialIds('tx'),
    clock: fixedClock('2026-10-19T15:00:00.000Z'),
  };
  return deps;
}

describe('saveTransaction (add)', () => {
  it('creates a transaction with a generated id and timestamp', async () => {
    const deps = setup();

    const result = await saveTransaction(deps, { draft: draft(), invoice: noInvoice });

    expect(result).toEqual({
      ok: true,
      transaction: {
        ...draft(),
        id: 'tx-1',
        createdAt: '2026-10-19T15:00:00.000Z',
      },
    });
    expect(deps.transactions.items).toHaveLength(1);
    expect(deps.invoices.calls).toEqual([]);
  });

  it('trims the description', async () => {
    const deps = setup();
    const result = await saveTransaction(deps, {
      draft: draft({ description: '  Bakery  ' }),
      invoice: noInvoice,
    });
    expect(result.ok && result.transaction.description).toBe('Bakery');
  });

  it('returns validation errors without saving', async () => {
    const deps = setup();

    const result = await saveTransaction(deps, {
      draft: draft({ amount: 0 }),
      invoice: noInvoice,
    });

    expect(result).toEqual({ ok: false, errors: ['amount'] });
    expect(deps.transactions.items).toHaveLength(0);
  });

  it('rejects unknown categories and categories of the other kind', async () => {
    const deps = setup();

    const unknown = await saveTransaction(deps, {
      draft: draft({ categoryId: 'nope' }),
      invoice: noInvoice,
    });
    const mismatched = await saveTransaction(deps, {
      draft: draft({ categoryId: 'salary' }),
      invoice: noInvoice,
    });

    expect(unknown).toEqual({ ok: false, errors: ['categoryId'] });
    expect(mismatched).toEqual({ ok: false, errors: ['categoryId'] });
  });

  it('asks the invoice tracker to track a pending invoice for an expense', async () => {
    const deps = setup();

    await saveTransaction(deps, {
      draft: draft(),
      invoice: { pending: true, expectedDate: '2026-10-25' },
    });

    expect(deps.invoices.calls).toEqual([
      {
        method: 'setPending',
        args: { transactionId: 'tx-1', description: 'Supermarket', expectedDate: '2026-10-25' },
      },
    ]);
  });

  it('rejects an invalid expected date for a pending invoice', async () => {
    const deps = setup();

    const result = await saveTransaction(deps, {
      draft: draft(),
      invoice: { pending: true, expectedDate: '2026-02-31' },
    });

    expect(result).toEqual({ ok: false, errors: ['expectedDate'] });
    expect(deps.transactions.items).toHaveLength(0);
  });

  it('ignores the invoice option for income', async () => {
    const deps = setup();

    await saveTransaction(deps, {
      draft: draft({ kind: 'income', categoryId: 'salary' }),
      invoice: { pending: true, expectedDate: '2026-10-25' },
    });

    expect(deps.invoices.calls).toEqual([]);
  });
});

describe('saveTransaction (edit)', () => {
  it('updates fields but keeps id and createdAt', async () => {
    const existing = sampleTransaction();
    const deps = setup([existing]);

    const result = await saveTransaction(deps, {
      id: existing.id,
      draft: draft({ amount: 100 }),
      invoice: noInvoice,
    });

    expect(result.ok).toBe(true);
    expect(deps.transactions.items[0]).toEqual({
      ...draft({ amount: 100 }),
      id: existing.id,
      createdAt: existing.createdAt,
    });
  });

  it('clears a pending invoice when the option is turned off', async () => {
    const existing = sampleTransaction();
    const deps = setup([existing]);

    await saveTransaction(deps, { id: existing.id, draft: draft(), invoice: noInvoice });

    expect(deps.invoices.calls).toEqual([{ method: 'clearPending', args: existing.id }]);
  });

  it('updates the pending invoice when it stays on', async () => {
    const existing = sampleTransaction();
    const deps = setup([existing]);

    await saveTransaction(deps, {
      id: existing.id,
      draft: draft({ description: 'Hardware store' }),
      invoice: { pending: true, expectedDate: '2026-11-01' },
    });

    expect(deps.invoices.calls).toEqual([
      {
        method: 'setPending',
        args: { transactionId: existing.id, description: 'Hardware store', expectedDate: '2026-11-01' },
      },
    ]);
  });

  it('throws when editing a missing transaction', async () => {
    const deps = setup();
    await expect(
      saveTransaction(deps, { id: 'missing', draft: draft(), invoice: noInvoice }),
    ).rejects.toThrow('not found');
  });
});

describe('deleteTransaction', () => {
  it('removes invoices first, then the transaction', async () => {
    const existing = sampleTransaction();
    const transactions = new InMemoryTransactionRepository([existing]);
    const invoices = new FakePendingInvoiceTracker();

    await deleteTransaction({ transactions, invoices }, existing.id);

    expect(invoices.calls).toEqual([{ method: 'removeAllFor', args: existing.id }]);
    expect(transactions.items).toEqual([]);
  });
});

describe('getTransaction', () => {
  it('returns the transaction or null', async () => {
    const existing = sampleTransaction();
    const transactions = new InMemoryTransactionRepository([existing]);

    expect(await getTransaction({ transactions }, existing.id)).toEqual(existing);
    expect(await getTransaction({ transactions }, 'missing')).toBeNull();
  });
});

describe('listMonthTransactions', () => {
  it('groups the month transactions by date and resolves categories', async () => {
    const a = sampleTransaction({ id: 'a', date: '2026-10-01' });
    const b = sampleTransaction({ id: 'b', date: '2026-10-05', categoryId: 'home' });
    const other = sampleTransaction({ id: 'c', date: '2026-09-30' });
    const deps = {
      transactions: new InMemoryTransactionRepository([a, b, other]),
      categories: new InMemoryCategoryRepository(sampleCategories()),
    };

    const result = await listMonthTransactions(deps, '2026-10');

    expect(result.groups.map((g) => g.date)).toEqual(['2026-10-05', '2026-10-01']);
    expect(result.categoriesById.home.name).toBe('Home');
  });
});
