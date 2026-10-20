import { markReceived, pendingInvoicesByExpectedDate, type Invoice } from '../invoice';
import { reminderTriggerTime, shouldScheduleReminder } from '../reminder';

const invoice = (overrides: Partial<Invoice>): Invoice => ({
  id: overrides.id ?? 'inv',
  transactionId: 'tx',
  status: 'pending',
  expectedDate: null,
  receivedAt: null,
  attachmentUri: null,
  notes: null,
  reminderId: null,
  ...overrides,
});

describe('pendingInvoicesByExpectedDate', () => {
  it('keeps only pending invoices sorted by expected date, undated last', () => {
    const invoices = [
      invoice({ id: 'late', expectedDate: '2026-10-25' }),
      invoice({ id: 'none', expectedDate: null }),
      invoice({ id: 'received', status: 'received', expectedDate: '2026-10-01' }),
      invoice({ id: 'early', expectedDate: '2026-10-10' }),
    ];

    const result = pendingInvoicesByExpectedDate(invoices, '2026-10-19');

    expect(result.map((i) => i.id)).toEqual(['early', 'late', 'none']);
  });

  it('flags invoices whose expected date is before today as overdue', () => {
    const result = pendingInvoicesByExpectedDate(
      [
        invoice({ id: 'past', expectedDate: '2026-10-18' }),
        invoice({ id: 'today', expectedDate: '2026-10-19' }),
        invoice({ id: 'none', expectedDate: null }),
      ],
      '2026-10-19',
    );

    expect(result.map((i) => [i.id, i.overdue])).toEqual([
      ['past', true],
      ['today', false],
      ['none', false],
    ]);
  });

  it('preserves extra read-model fields', () => {
    const [item] = pendingInvoicesByExpectedDate(
      [{ ...invoice({ expectedDate: '2026-10-20' }), description: 'Plumber' }],
      '2026-10-19',
    );
    expect(item.description).toBe('Plumber');
  });
});

describe('markReceived', () => {
  it('sets received status, timestamp, attachment and clears the reminder id', () => {
    const result = markReceived(invoice({ reminderId: 'rem-1' }), {
      receivedAt: '2026-10-19T12:00:00.000Z',
      attachmentUri: 'file:///doc/a.jpg',
      notes: 'Paper copy in drawer',
    });

    expect(result).toEqual(
      invoice({
        status: 'received',
        receivedAt: '2026-10-19T12:00:00.000Z',
        attachmentUri: 'file:///doc/a.jpg',
        notes: 'Paper copy in drawer',
        reminderId: null,
      }),
    );
  });

  it('keeps existing notes when none are provided', () => {
    const result = markReceived(invoice({ notes: 'keep' }), {
      receivedAt: '2026-10-19T12:00:00.000Z',
      attachmentUri: null,
    });
    expect(result.notes).toBe('keep');
  });

  it('refuses to mark an already received invoice', () => {
    expect(() =>
      markReceived(invoice({ status: 'received' }), {
        receivedAt: '2026-10-19T12:00:00.000Z',
        attachmentUri: null,
      }),
    ).toThrow('already received');
  });
});

describe('reminderTriggerTime', () => {
  it('returns 09:00 local time on the expected date', () => {
    const trigger = reminderTriggerTime('2026-11-03');
    expect(trigger.getFullYear()).toBe(2026);
    expect(trigger.getMonth()).toBe(10);
    expect(trigger.getDate()).toBe(3);
    expect(trigger.getHours()).toBe(9);
    expect(trigger.getMinutes()).toBe(0);
    expect(trigger.getSeconds()).toBe(0);
  });

  it('only schedules triggers in the future', () => {
    const trigger = reminderTriggerTime('2026-11-03');
    expect(shouldScheduleReminder(trigger, new Date(2026, 10, 3, 8, 59))).toBe(true);
    expect(shouldScheduleReminder(trigger, new Date(2026, 10, 3, 9, 0))).toBe(false);
  });
});
