import type { Clock } from '../shared/dates/clock';
import { monthKeyOf, type MonthKey } from '../shared/dates/isoDate';
import type { IdGenerator } from '../shared/ids/ids';
import type { MinorUnits } from '../shared/money/money';
import type { ReminderRequest, ReminderScheduler } from '../shared/notifications/ReminderScheduler';
import type { Category } from '../finance/domain/category';
import type { Transaction } from '../finance/domain/transaction';
import type {
  CategoryRepository,
  PendingInvoiceTracker,
  SettingsRepository,
  TransactionRepository,
} from '../finance/application/ports';
import type { Invoice } from '../invoices/domain/invoice';
import type {
  AttachmentStorage,
  InvoiceDetails,
  InvoiceRepository,
} from '../invoices/application/ports';

export class InMemoryCategoryRepository implements CategoryRepository {
  constructor(public items: Category[] = []) {}
  async list() {
    return this.items.map((c) => ({ ...c }));
  }
  async getById(id: string) {
    const found = this.items.find((c) => c.id === id);
    return found ? { ...found } : null;
  }
  async updateBudget(id: string, monthlyBudget: MinorUnits | null) {
    this.items = this.items.map((c) => (c.id === id ? { ...c, monthlyBudget } : c));
  }
}

export class InMemoryTransactionRepository implements TransactionRepository {
  constructor(public items: Transaction[] = []) {}
  async listByMonth(month: MonthKey) {
    return this.items.filter((t) => monthKeyOf(t.date) === month).map((t) => ({ ...t }));
  }
  async getById(id: string) {
    const found = this.items.find((t) => t.id === id);
    return found ? { ...found } : null;
  }
  async insert(transaction: Transaction) {
    this.items.push({ ...transaction });
  }
  async update(transaction: Transaction) {
    this.items = this.items.map((t) => (t.id === transaction.id ? { ...transaction } : t));
  }
  async delete(id: string) {
    this.items = this.items.filter((t) => t.id !== id);
  }
}

export class InMemorySettingsRepository implements SettingsRepository {
  values = new Map<string, string>();
  async get(key: string) {
    return this.values.get(key) ?? null;
  }
  async set(key: string, value: string) {
    this.values.set(key, value);
  }
}

export class InMemoryInvoiceRepository implements InvoiceRepository {
  constructor(
    public items: Invoice[] = [],
    private readonly transactions: () => Transaction[] = () => [],
  ) {}
  async insert(invoice: Invoice) {
    this.items.push({ ...invoice });
  }
  async update(invoice: Invoice) {
    this.items = this.items.map((i) => (i.id === invoice.id ? { ...invoice } : i));
  }
  async getById(id: string) {
    const found = this.items.find((i) => i.id === id);
    return found ? { ...found } : null;
  }
  async findByTransactionId(transactionId: string) {
    return this.items.filter((i) => i.transactionId === transactionId).map((i) => ({ ...i }));
  }
  async deleteById(id: string) {
    this.items = this.items.filter((i) => i.id !== id);
  }
  async listDetailed() {
    return this.items.flatMap((i) => this.detail(i) ?? []);
  }
  async getDetailed(id: string) {
    const found = this.items.find((i) => i.id === id);
    return found ? this.detail(found) : null;
  }
  async countPending() {
    return this.items.filter((i) => i.status === 'pending').length;
  }
  private detail(invoice: Invoice): InvoiceDetails | null {
    const transaction = this.transactions().find((t) => t.id === invoice.transactionId);
    if (!transaction) return null;
    return {
      ...invoice,
      description: transaction.description,
      amount: transaction.amount,
      transactionDate: transaction.date,
    };
  }
}

export class FakeReminderScheduler implements ReminderScheduler {
  scheduled = new Map<string, ReminderRequest>();
  cancelled: string[] = [];
  available = true;
  private counter = 0;
  async schedule(request: ReminderRequest) {
    if (!this.available) return null;
    const id = `reminder-${++this.counter}`;
    this.scheduled.set(id, request);
    return id;
  }
  async cancel(reminderId: string) {
    this.cancelled.push(reminderId);
    this.scheduled.delete(reminderId);
  }
}

export class FakeAttachmentStorage implements AttachmentStorage {
  stored = new Map<string, string>();
  removed: string[] = [];
  async store(sourceUri: string, preferredName?: string) {
    const uri = `file:///documents/attachments/${preferredName ?? sourceUri.split('/').pop()}`;
    this.stored.set(uri, sourceUri);
    return uri;
  }
  async remove(uri: string) {
    this.removed.push(uri);
    this.stored.delete(uri);
  }
}

export class FakePendingInvoiceTracker implements PendingInvoiceTracker {
  calls: { method: keyof PendingInvoiceTracker; args: unknown }[] = [];
  async setPending(input: Parameters<PendingInvoiceTracker['setPending']>[0]) {
    this.calls.push({ method: 'setPending', args: input });
  }
  async clearPending(transactionId: string) {
    this.calls.push({ method: 'clearPending', args: transactionId });
  }
  async removeAllFor(transactionId: string) {
    this.calls.push({ method: 'removeAllFor', args: transactionId });
  }
}

export const fixedClock = (iso: string): Clock => ({ now: () => new Date(iso) });

/** A clock at the given local date and time. */
export const localClock = (
  year: number,
  month: number,
  day: number,
  hour = 12,
  minute = 0,
): Clock => ({ now: () => new Date(year, month - 1, day, hour, minute) });

export const sequentialIds = (prefix = 'id'): IdGenerator => {
  let counter = 0;
  return () => `${prefix}-${++counter}`;
};

export const sampleCategories = (): Category[] => [
  { id: 'groceries', name: 'Groceries', icon: '🛒', monthlyBudget: 40000, kind: 'expense' },
  { id: 'home', name: 'Home', icon: '🏠', monthlyBudget: null, kind: 'expense' },
  { id: 'salary', name: 'Salary', icon: '💼', monthlyBudget: null, kind: 'income' },
];

export const sampleTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  kind: 'expense',
  amount: 2500,
  categoryId: 'groceries',
  date: '2026-10-10',
  description: 'Weekly groceries',
  paymentMethod: 'debit',
  createdAt: '2026-10-10T10:00:00.000Z',
  ...overrides,
});
