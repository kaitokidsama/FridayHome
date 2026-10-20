import { toIsoDate } from '../../shared/dates/isoDate';
import { pendingInvoicesByExpectedDate, type InvoiceStatus, type WithOverdue } from '../domain/invoice';
import type { InvoiceDeps } from './deps';
import type { InvoiceDetails } from './ports';

export type InvoiceListItem = WithOverdue<InvoiceDetails>;

export async function listInvoices(
  deps: Pick<InvoiceDeps, 'invoices' | 'clock'>,
  status: InvoiceStatus,
): Promise<InvoiceListItem[]> {
  const all = await deps.invoices.listDetailed();
  if (status === 'pending') {
    return pendingInvoicesByExpectedDate(all, toIsoDate(deps.clock.now()));
  }
  return all
    .filter((invoice) => invoice.status === 'received')
    .sort((a, b) => (b.receivedAt ?? '').localeCompare(a.receivedAt ?? ''))
    .map((invoice) => ({ ...invoice, overdue: false }));
}
