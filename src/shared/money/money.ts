/**
 * Money is always represented as an integer amount of minor units (e.g. cents).
 * Floats are only used transiently for display through Intl.NumberFormat.
 */
export type MinorUnits = number;

export const FALLBACK_CURRENCY = 'USD';

const CURRENCY_CODE = /^[A-Z]{3}$/;

export function isValidCurrencyCode(code: string): boolean {
  if (!CURRENCY_CODE.test(code)) return false;
  try {
    new Intl.NumberFormat('en-US', { style: 'currency', currency: code });
    return true;
  } catch {
    return false;
  }
}

/** Picks the stored currency, then the device currency, then USD. */
export function resolveCurrency(stored: string | null, device: string | null): string {
  if (stored && isValidCurrencyCode(stored)) return stored;
  if (device && isValidCurrencyCode(device)) return device;
  return FALLBACK_CURRENCY;
}

export function fractionDigitsFor(currency: string): number {
  const options = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).resolvedOptions();
  return options.maximumFractionDigits ?? 2;
}

/**
 * Parses user input ("12.34", "12,34", "1 234.5") into integer minor units
 * using string arithmetic so no floating point rounding happens.
 * Returns null for empty, negative, malformed or over-precise input.
 */
export function parseAmountToMinorUnits(input: string, fractionDigits: number): MinorUnits | null {
  const normalized = input.trim().replace(/[\s ]/g, '').replace(',', '.');
  if (!/^\d+(\.\d*)?$/.test(normalized)) return null;

  const [whole, fraction = ''] = normalized.split('.');
  if (fraction.length > fractionDigits) return null;

  const padded = fraction.padEnd(fractionDigits, '0');
  const value = Number.parseInt(whole + padded, 10);
  return Number.isSafeInteger(value) ? value : null;
}

/** Renders minor units as a plain decimal string suitable for a text input. */
export function toMajorUnitsString(amount: MinorUnits, fractionDigits: number): string {
  if (fractionDigits === 0) return String(amount);
  const sign = amount < 0 ? '-' : '';
  const digits = String(Math.abs(amount)).padStart(fractionDigits + 1, '0');
  const whole = digits.slice(0, digits.length - fractionDigits);
  const fraction = digits.slice(digits.length - fractionDigits);
  return `${sign}${whole}.${fraction}`;
}

export function formatMoney(amount: MinorUnits, currency: string, locale?: string): string {
  const fractionDigits = fractionDigitsFor(currency);
  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
  return formatter.format(amount / 10 ** fractionDigits);
}
