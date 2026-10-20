import { markReceived, type Invoice } from '../domain/invoice';
import type { InvoiceDeps } from './deps';

export interface ReceiveInvoiceInput {
  invoiceId: string;
  attachment: { uri: string; name?: string } | null;
  notes?: string | null;
}

export async function receiveInvoice(
  deps: Pick<InvoiceDeps, 'invoices' | 'scheduler' | 'attachments' | 'clock'>,
  input: ReceiveInvoiceInput,
): Promise<Invoice> {
  const invoice = await deps.invoices.getById(input.invoiceId);
  if (!invoice) throw new Error(`Invoice ${input.invoiceId} not found`);
  if (invoice.status === 'received') throw new Error(`Invoice ${invoice.id} is already received`);

  const attachmentUri = input.attachment
    ? await deps.attachments.store(
        input.attachment.uri,
        `${invoice.id}-${input.attachment.name ?? 'attachment'}`,
      )
    : null;

  const received = markReceived(invoice, {
    receivedAt: deps.clock.now().toISOString(),
    attachmentUri,
    notes: input.notes,
  });

  try {
    await deps.invoices.update(received);
  } catch (error) {
    if (attachmentUri) await deps.attachments.remove(attachmentUri);
    throw error;
  }

  if (invoice.reminderId) await deps.scheduler.cancel(invoice.reminderId);
  return received;
}
