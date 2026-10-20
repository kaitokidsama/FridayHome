/** A calendar date in local time, formatted as YYYY-MM-DD. */
export type IsoDate = string;
/** A calendar month formatted as YYYY-MM. */
export type MonthKey = string;

const pad = (value: number) => String(value).padStart(2, '0');

export function toIsoDate(date: Date): IsoDate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parses an ISO date as local midnight. */
export function fromIsoDate(value: IsoDate): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toIsoDate(fromIsoDate(value)) === value;
}

export function monthKeyOf(date: IsoDate): MonthKey {
  return date.slice(0, 7);
}

export function isInMonth(date: IsoDate, month: MonthKey): boolean {
  return monthKeyOf(date) === month;
}

export function monthRange(month: MonthKey): { start: IsoDate; end: IsoDate } {
  const [year, monthIndex] = month.split('-').map(Number);
  const lastDay = new Date(year, monthIndex, 0).getDate();
  return { start: `${month}-01`, end: `${month}-${pad(lastDay)}` };
}

export function addMonths(month: MonthKey, delta: number): MonthKey {
  const [year, monthIndex] = month.split('-').map(Number);
  const date = new Date(year, monthIndex - 1 + delta, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}
