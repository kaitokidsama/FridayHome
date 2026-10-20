import { toIsoDate } from '../../shared/dates/isoDate';
import type { InvoiceDeps } from './deps';
import type { InvoiceListItem } from './listInvoices';

export async function getInvoice(
  deps: Pick<InvoiceDeps, 'invoices' | 'clock'>,
  id: string,
): Promise<InvoiceListItem | null> {
  const invoice = await deps.invoices.getDetailed(id);
  if (!invoice) return null;
  const today = toIsoDate(deps.clock.now());
  const overdue =
    invoice.status === 'pending' && invoice.expectedDate !== null && invoice.expectedDate < today;
  return { ...invoice, overdue };
}
