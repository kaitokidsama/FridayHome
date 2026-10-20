import type { IsoDate } from '../../shared/dates/isoDate';
import type { MinorUnits } from '../../shared/money/money';
import type { Invoice } from '../domain/invoice';

/** Read model: an invoice enriched with its expense data for display. */
export interface InvoiceDetails extends Invoice {
  description: string;
  amount: MinorUnits;
  transactionDate: IsoDate;
}

export interface InvoiceRepository {
  insert(invoice: Invoice): Promise<void>;
  update(invoice: Invoice): Promise<void>;
  getById(id: string): Promise<Invoice | null>;
  findByTransactionId(transactionId: string): Promise<Invoice[]>;
  deleteById(id: string): Promise<void>;
  listDetailed(): Promise<InvoiceDetails[]>;
  getDetailed(id: string): Promise<InvoiceDetails | null>;
  countPending(): Promise<number>;
}

/** Port for persisting attachment files inside the app sandbox. */
export interface AttachmentStorage {
  /** Copies the source file into app storage and returns the stored uri. */
  store(sourceUri: string, preferredName?: string): Promise<string>;
  remove(uri: string): Promise<void>;
}

export interface ReminderContent {
  title: string;
  body: string;
}

export type ReminderContentFactory = (input: {
  description: string;
  expectedDate: IsoDate;
}) => ReminderContent;
