import { fromIsoDate, type IsoDate } from '../../shared/dates/isoDate';

export const REMINDER_HOUR = 9;

/** Reminders fire at 09:00 local time on the expected date. */
export function reminderTriggerTime(expectedDate: IsoDate): Date {
  const date = fromIsoDate(expectedDate);
  date.setHours(REMINDER_HOUR, 0, 0, 0);
  return date;
}

export function shouldScheduleReminder(trigger: Date, now: Date): boolean {
  return trigger.getTime() > now.getTime();
}
