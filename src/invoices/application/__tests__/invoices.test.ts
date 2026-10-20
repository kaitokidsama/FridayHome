import {
  FakeAttachmentStorage,
  FakeReminderScheduler,
  InMemoryInvoiceRepository,
  localClock,
  sampleTransaction,
  sequentialIds,
} from '../../../testing/fakes';
import type { Transaction } from '../../../finance/domain/transaction';
import type { Invoice } from '../../domain/invoice';
import { cancelPendingInvoice } from '../cancelPendingInvoice';
import { countPendingInvoices } from '../countPendingInvoices';
import { getInvoice } from '../getInvoice';
import { getInvoiceForTransaction } from '../getInvoiceForTransaction';
import { listInvoices } from '../listInvoices';
import { receiveInvoice } from '../receiveInvoice';
import { removeInvoicesForTransaction } from '../removeInvoicesForTransaction';
import { upsertPendingInvoice } from '../upsertPendingInvoice';

const reminderContent = ({ description }: { description: string }) => ({
  title: `Invoice due: ${description}`,
  body: 'Body',
});

const pending = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: 'inv-existing',
  transactionId: 'tx-1',
  status: 'pending',
  expectedDate: '2026-10-25',
  receivedAt: null,
  attachmentUri: null,
  notes: null,
  reminderId: 'reminder-old',
  ...overrides,
});

function setup(invoices: Invoice[] = [], transactions: Transaction[] = [sampleTransaction()]) {
  return {
    invoices: new InMemoryInvoiceRepository(invoices, () => transactions),
    scheduler: new FakeReminderScheduler(),
    attachments: new FakeAttachmentStorage(),
    clock: localClock(2026, 10, 19, 14, 30),
    newId: sequentialIds('inv'),
    reminderContent,
  };
}

describe('upsertPendingInvoice', () => {
  it('creates a pending invoice and schedules a 09:00 reminder on the expected date', async () => {
    const deps = setup();

    await upsertPendingInvoice(deps, {
      transactionId: 'tx-1',
      description: 'Plumber',
      expectedDate: '2026-10-25',
    });

    expect(deps.invoices.items).toEqual([
      {
        id: 'inv-1',
        transactionId: 'tx-1',
        status: 'pending',
        expectedDate: '2026-10-25',
        receivedAt: null,
        attachmentUri: null,
        notes: null,
        reminderId: 'reminder-1',
      },
    ]);
    const request = deps.scheduler.scheduled.get('reminder-1');
    expect(request?.title).toBe('Invoice due: Plumber');
    expect(request?.at).toEqual(new Date(2026, 9, 25, 9, 0, 0));
  });

  it('does not schedule reminders without a date or in the past', async () => {
    const deps = setup();

    await upsertPendingInvoice(deps, { transactionId: 'tx-1', description: 'A', expectedDate: null });
    await upsertPendingInvoice(deps, {
      transactionId: 'tx-2',
      description: 'B',
      expectedDate: '2026-10-19',
    });

    expect(deps.scheduler.scheduled.size).toBe(0);
    expect(deps.invoices.items.map((i) => i.reminderId)).toEqual([null, null]);
  });

  it('keeps the invoice when the scheduler is unavailable', async () => {
    const deps = setup();
    deps.scheduler.available = false;

    await upsertPendingInvoice(deps, {
      transactionId: 'tx-1',
      description: 'A',
      expectedDate: '2026-12-01',
    });

    expect(deps.invoices.items[0]).toMatchObject({ status: 'pending', reminderId: null });
  });

  it('reschedules an existing pending invoice', async () => {
    const deps = setup([pending()]);

    await upsertPendingInvoice(deps, {
      transactionId: 'tx-1',
      description: 'Plumber',
      expectedDate: '2026-11-02',
    });

    expect(deps.scheduler.cancelled).toEqual(['reminder-old']);
    expect(deps.invoices.items).toEqual([
      pending({ expectedDate: '2026-11-02', reminderId: 'reminder-1' }),
    ]);
  });

  it('leaves a received invoice untouched', async () => {
    const received = pending({ status: 'received', reminderId: null, receivedAt: '2026-10-01' });
    const deps = setup([received]);

    await upsertPendingInvoice(deps, {
      transactionId: 'tx-1',
      description: 'Plumber',
      expectedDate: '2026-11-02',
    });

    expect(deps.invoices.items).toEqual([received]);
    expect(deps.scheduler.scheduled.size).toBe(0);
  });
});

describe('cancelPendingInvoice', () => {
  it('deletes pending invoices and cancels their reminders, keeping received ones', async () => {
    const received = pending({ id: 'inv-r', status: 'received', reminderId: null });
    const deps = setup([pending(), received]);

    await cancelPendingInvoice(deps, 'tx-1');

    expect(deps.scheduler.cancelled).toEqual(['reminder-old']);
    expect(deps.invoices.items).toEqual([received]);
  });
});

describe('removeInvoicesForTransaction', () => {
  it('deletes all invoices, cancels reminders and removes attachments', async () => {
    const received = pending({
      id: 'inv-r',
      status: 'received',
      reminderId: null,
      attachmentUri: 'file:///documents/attachments/a.jpg',
    });
    const deps = setup([pending(), received]);

    await removeInvoicesForTransaction(deps, 'tx-1');

    expect(deps.invoices.items).toEqual([]);
    expect(deps.scheduler.cancelled).toEqual(['reminder-old']);
    expect(deps.attachments.removed).toEqual(['file:///documents/attachments/a.jpg']);
  });
});

describe('receiveInvoice', () => {
  it('stores the attachment, cancels the reminder and marks it received', async () => {
    const deps = setup([pending()]);

    const result = await receiveInvoice(deps, {
      invoiceId: 'inv-existing',
      attachment: { uri: 'file:///tmp/photo.jpg', name: 'photo.jpg' },
      notes: 'Emailed',
    });

    expect(deps.scheduler.cancelled).toEqual(['reminder-old']);
    expect(result).toEqual(
      pending({
        status: 'received',
        receivedAt: new Date(2026, 9, 19, 14, 30).toISOString(),
        attachmentUri: 'file:///documents/attachments/inv-existing-photo.jpg',
        notes: 'Emailed',
        reminderId: null,
      }),
    );
    expect(deps.invoices.items[0]).toEqual(result);
    expect(deps.attachments.stored.get(result.attachmentUri!)).toBe('file:///tmp/photo.jpg');
  });

  it('allows receiving without an attachment', async () => {
    const deps = setup([pending({ reminderId: null })]);

    const result = await receiveInvoice(deps, { invoiceId: 'inv-existing', attachment: null });

    expect(result).toMatchObject({ status: 'received', attachmentUri: null });
    expect(deps.scheduler.cancelled).toEqual([]);
  });

  it('throws for missing or already received invoices', async () => {
    const deps = setup([pending({ status: 'received' })]);
    await expect(receiveInvoice(deps, { invoiceId: 'nope', attachment: null })).rejects.toThrow(
      'not found',
    );
    await expect(
      receiveInvoice(deps, { invoiceId: 'inv-existing', attachment: null }),
    ).rejects.toThrow('already received');
    expect(deps.attachments.stored.size).toBe(0);
  });

  it('removes the stored attachment if persisting fails', async () => {
    const deps = setup([pending()]);
    deps.invoices.update = async () => {
      throw new Error('disk full');
    };

    await expect(
      receiveInvoice(deps, {
        invoiceId: 'inv-existing',
        attachment: { uri: 'file:///tmp/photo.jpg', name: 'photo.jpg' },
      }),
    ).rejects.toThrow('disk full');
    expect(deps.attachments.removed).toEqual([
      'file:///documents/attachments/inv-existing-photo.jpg',
    ]);
  });
});

describe('listInvoices', () => {
  const transactions = [
    sampleTransaction({ id: 'tx-1', description: 'Plumber' }),
    sampleTransaction({ id: 'tx-2', description: 'Dentist' }),
    sampleTransaction({ id: 'tx-3', description: 'Electrician' }),
  ];
  const invoices = [
    pending({ id: 'p-late', transactionId: 'tx-1', expectedDate: '2026-10-30' }),
    pending({ id: 'p-overdue', transactionId: 'tx-2', expectedDate: '2026-10-01' }),
    pending({
      id: 'r-old',
      transactionId: 'tx-3',
      status: 'received',
      receivedAt: '2026-09-01T10:00:00.000Z',
    }),
    pending({
      id: 'r-new',
      transactionId: 'tx-3',
      status: 'received',
      receivedAt: '2026-10-01T10:00:00.000Z',
    }),
  ];

  it('lists pending invoices by expected date with overdue flags', async () => {
    const deps = setup(invoices, transactions);

    const result = await listInvoices(deps, 'pending');

    expect(result.map((i) => [i.id, i.description, i.overdue])).toEqual([
      ['p-overdue', 'Dentist', true],
      ['p-late', 'Plumber', false],
    ]);
  });

  it('lists received invoices newest first', async () => {
    const deps = setup(invoices, transactions);

    const result = await listInvoices(deps, 'received');

    expect(result.map((i) => [i.id, i.overdue])).toEqual([
      ['r-new', false],
      ['r-old', false],
    ]);
  });
});

describe('getInvoice and countPendingInvoices', () => {
  it('returns invoice details with an overdue flag', async () => {
    const deps = setup([pending({ expectedDate: '2026-10-18' })]);

    expect(await getInvoice(deps, 'inv-existing')).toMatchObject({
      description: 'Weekly groceries',
      overdue: true,
    });
    expect(await getInvoice(deps, 'missing')).toBeNull();
  });

  it('finds the invoice of a transaction', async () => {
    const deps = setup([pending()]);
    expect((await getInvoiceForTransaction(deps, 'tx-1'))?.id).toBe('inv-existing');
    expect(await getInvoiceForTransaction(deps, 'tx-9')).toBeNull();
  });

  it('counts pending invoices', async () => {
    const deps = setup([pending(), pending({ id: 'x', status: 'received' })]);
    expect(await countPendingInvoices(deps)).toBe(1);
  });
});
