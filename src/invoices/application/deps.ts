import type { Clock } from '../../shared/dates/clock';
import type { IdGenerator } from '../../shared/ids/ids';
import type { ReminderScheduler } from '../../shared/notifications/ReminderScheduler';
import type { AttachmentStorage, InvoiceRepository, ReminderContentFactory } from './ports';

export interface InvoiceDeps {
  invoices: InvoiceRepository;
  scheduler: ReminderScheduler;
  attachments: AttachmentStorage;
  clock: Clock;
  newId: IdGenerator;
  reminderContent: ReminderContentFactory;
}
