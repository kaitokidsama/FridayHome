import type { IsoDate } from '../../shared/dates/isoDate';
import type { Invoice } from '../domain/invoice';
import type { InvoiceDeps } from './deps';
import { scheduleInvoiceReminder } from './scheduleReminder';

export interface PendingInvoiceInput {
  transactionId: string;
  description: string;
  expectedDate: IsoDate | null;
}

/** Creates or reschedules the pending invoice of an expense. Received invoices are left alone. */
export async function upsertPendingInvoice(
  deps: Pick<InvoiceDeps, 'invoices' | 'scheduler' | 'clock' | 'newId' | 'reminderContent'>,
  input: PendingInvoiceInput,
): Promise<Invoice | null> {
  const existing = await deps.invoices.findByTransactionId(input.transactionId);
  if (existing.some((invoice) => invoice.status === 'received')) return null;

  const current = existing.find((invoice) => invoice.status === 'pending');
  if (current?.reminderId) await deps.scheduler.cancel(current.reminderId);

  const reminderId = await scheduleInvoiceReminder(deps, input.description, input.expectedDate);

  if (current) {
    const updated: Invoice = { ...current, expectedDate: input.expectedDate, reminderId };
    await deps.invoices.update(updated);
    return updated;
  }

  const created: Invoice = {
    id: deps.newId(),
    transactionId: input.transactionId,
    status: 'pending',
    expectedDate: input.expectedDate,
    receivedAt: null,
    attachmentUri: null,
    notes: null,
    reminderId,
  };
  await deps.invoices.insert(created);
  return created;
}
