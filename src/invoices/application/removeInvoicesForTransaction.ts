import type { InvoiceDeps } from './deps';

export async function removeInvoicesForTransaction(
  deps: Pick<InvoiceDeps, 'invoices' | 'scheduler' | 'attachments'>,
  transactionId: string,
): Promise<void> {
  const invoices = await deps.invoices.findByTransactionId(transactionId);
  for (const invoice of invoices) {
    if (invoice.reminderId) await deps.scheduler.cancel(invoice.reminderId);
    if (invoice.attachmentUri) await deps.attachments.remove(invoice.attachmentUri);
    await deps.invoices.deleteById(invoice.id);
  }
}
