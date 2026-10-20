import type { InvoiceDeps } from './deps';

export async function cancelPendingInvoice(
  deps: Pick<InvoiceDeps, 'invoices' | 'scheduler'>,
  transactionId: string,
): Promise<void> {
  const invoices = await deps.invoices.findByTransactionId(transactionId);
  for (const invoice of invoices) {
    if (invoice.status !== 'pending') continue;
    if (invoice.reminderId) await deps.scheduler.cancel(invoice.reminderId);
    await deps.invoices.deleteById(invoice.id);
  }
}
