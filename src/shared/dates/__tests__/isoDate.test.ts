import {
  addMonths,
  fromIsoDate,
  isIsoDate,
  isInMonth,
  monthKeyOf,
  monthRange,
  toIsoDate,
} from '../isoDate';

describe('isoDate', () => {
  it('converts a local Date to YYYY-MM-DD', () => {
    expect(toIsoDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });

  it('parses an ISO date as local midnight', () => {
    const date = fromIsoDate('2026-03-09');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(9);
    expect(date.getHours()).toBe(0);
  });

  it('validates ISO dates', () => {
    expect(isIsoDate('2026-02-28')).toBe(true);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('2026-2-3')).toBe(false);
    expect(isIsoDate('')).toBe(false);
  });

  it('derives month keys and month ranges', () => {
    expect(monthKeyOf('2026-10-19')).toBe('2026-10');
    expect(monthRange('2026-02')).toEqual({ start: '2026-02-01', end: '2026-02-28' });
    expect(monthRange('2028-02')).toEqual({ start: '2028-02-01', end: '2028-02-29' });
  });

  it('adds months across year boundaries', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-05', 0)).toBe('2026-05');
  });

  it('checks month membership', () => {
    expect(isInMonth('2026-10-01', '2026-10')).toBe(true);
    expect(isInMonth('2026-11-01', '2026-10')).toBe(false);
  });
});
