import type { InvoiceDeps } from './deps';

export function countPendingInvoices(deps: Pick<InvoiceDeps, 'invoices'>): Promise<number> {
  return deps.invoices.countPending();
}
