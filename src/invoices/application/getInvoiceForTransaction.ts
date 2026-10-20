import type { Invoice } from '../domain/invoice';
import type { InvoiceDeps } from './deps';

/** An expense has at most one invoice; prefer the received one if data ever diverges. */
export async function getInvoiceForTransaction(
  deps: Pick<InvoiceDeps, 'invoices'>,
  transactionId: string,
): Promise<Invoice | null> {
  const invoices = await deps.invoices.findByTransactionId(transactionId);
  return invoices.find((i) => i.status === 'received') ?? invoices[0] ?? null;
}
