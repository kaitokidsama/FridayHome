import type { IsoDate } from '../../shared/dates/isoDate';
import { reminderTriggerTime, shouldScheduleReminder } from '../domain/reminder';
import type { InvoiceDeps } from './deps';

/** Schedules the 09:00 reminder for an expected date; returns null when not applicable. */
export async function scheduleInvoiceReminder(
  deps: Pick<InvoiceDeps, 'scheduler' | 'clock' | 'reminderContent'>,
  description: string,
  expectedDate: IsoDate | null,
): Promise<string | null> {
  if (!expectedDate) return null;
  const at = reminderTriggerTime(expectedDate);
  if (!shouldScheduleReminder(at, deps.clock.now())) return null;
  const content = deps.reminderContent({ description, expectedDate });
  return deps.scheduler.schedule({ ...content, at });
}
