import type { PendingInvoiceTracker, TransactionRepository } from './ports';

export async function deleteTransaction(
  deps: { transactions: TransactionRepository; invoices: PendingInvoiceTracker },
  id: string,
): Promise<void> {
  await deps.invoices.removeAllFor(id);
  await deps.transactions.delete(id);
}
