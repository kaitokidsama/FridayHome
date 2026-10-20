import { fromIsoDate, type IsoDate, type MonthKey } from './isoDate';

export function formatDisplayDate(date: IsoDate, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(fromIsoDate(date));
}

export function formatShortDate(date: IsoDate, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(
    fromIsoDate(date),
  );
}

export function formatTimestampDate(timestamp: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(timestamp),
  );
}

export function formatMonthLabel(month: MonthKey, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    fromIsoDate(`${month}-01`),
  );
}
