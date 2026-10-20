import { validateTransactionDraft, type TransactionDraft } from '../transaction';

const draft = (overrides: Partial<TransactionDraft> = {}): TransactionDraft => ({
  kind: 'expense',
  amount: 1500,
  categoryId: 'groceries',
  date: '2026-10-19',
  description: 'Milk',
  paymentMethod: 'cash',
  ...overrides,
});

describe('validateTransactionDraft', () => {
  it('accepts a valid draft', () => {
    expect(validateTransactionDraft(draft())).toEqual([]);
  });

  it('rejects non-positive or non-integer amounts', () => {
    expect(validateTransactionDraft(draft({ amount: 0 }))).toContain('amount');
    expect(validateTransactionDraft(draft({ amount: -5 }))).toContain('amount');
    expect(validateTransactionDraft(draft({ amount: 10.5 }))).toContain('amount');
  });

  it('requires a category and a valid date', () => {
    expect(validateTransactionDraft(draft({ categoryId: '' }))).toContain('categoryId');
    expect(validateTransactionDraft(draft({ date: '2026-13-01' }))).toContain('date');
  });

  it('rejects unknown kinds and payment methods', () => {
    expect(validateTransactionDraft(draft({ kind: 'gift' as never }))).toContain('kind');
    expect(validateTransactionDraft(draft({ paymentMethod: 'crypto' as never }))).toContain(
      'paymentMethod',
    );
  });
});
