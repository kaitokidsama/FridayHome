import type { IsoDate } from '../../shared/dates/isoDate';

export type InvoiceStatus = 'pending' | 'received';

export interface Invoice {
  id: string;
  /** The expense transaction this invoice belongs to. */
  transactionId: string;
  status: InvoiceStatus;
  expectedDate: IsoDate | null;
  /** ISO timestamp, set when the invoice is received. */
  receivedAt: string | null;
  attachmentUri: string | null;
  notes: string | null;
  /** Scheduled local notification id, if any. */
  reminderId: string | null;
}

export type WithOverdue<T> = T & { overdue: boolean };

/** Pending invoices sorted by expected date (undated last), flagged overdue relative to `today`. */
export function pendingInvoicesByExpectedDate<T extends Invoice>(
  invoices: readonly T[],
  today: IsoDate,
): WithOverdue<T>[] {
  return invoices
    .filter((invoice) => invoice.status === 'pending')
    .sort((a, b) => compareExpectedDates(a.expectedDate, b.expectedDate))
    .map((invoice) => ({
      ...invoice,
      overdue: invoice.expectedDate !== null && invoice.expectedDate < today,
    }));
}

function compareExpectedDates(a: IsoDate | null, b: IsoDate | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a.localeCompare(b);
}

export interface ReceiveInvoiceDetails {
  receivedAt: string;
  attachmentUri: string | null;
  notes?: string | null;
}

export function markReceived(invoice: Invoice, details: ReceiveInvoiceDetails): Invoice {
  if (invoice.status === 'received') {
    throw new Error(`Invoice ${invoice.id} is already received`);
  }
  return {
    ...invoice,
    status: 'received',
    receivedAt: details.receivedAt,
    attachmentUri: details.attachmentUri,
    notes: details.notes === undefined ? invoice.notes : details.notes,
    reminderId: null,
  };
}
