import {
  formatMoney,
  fractionDigitsFor,
  isValidCurrencyCode,
  parseAmountToMinorUnits,
  resolveCurrency,
  toMajorUnitsString,
} from '../money';

describe('fractionDigitsFor', () => {
  it('returns 2 for USD and EUR', () => {
    expect(fractionDigitsFor('USD')).toBe(2);
    expect(fractionDigitsFor('EUR')).toBe(2);
  });

  it('returns 0 for currencies without minor units', () => {
    expect(fractionDigitsFor('JPY')).toBe(0);
  });
});

describe('parseAmountToMinorUnits', () => {
  it('parses dot and comma decimals into integer cents', () => {
    expect(parseAmountToMinorUnits('12.34', 2)).toBe(1234);
    expect(parseAmountToMinorUnits('12,34', 2)).toBe(1234);
    expect(parseAmountToMinorUnits('12', 2)).toBe(1200);
    expect(parseAmountToMinorUnits('0.5', 2)).toBe(50);
  });

  it('avoids floating point drift', () => {
    expect(parseAmountToMinorUnits('0.29', 2)).toBe(29);
    expect(parseAmountToMinorUnits('1.005', 3)).toBe(1005);
  });

  it('ignores surrounding whitespace and thousands separators', () => {
    expect(parseAmountToMinorUnits('  1 234.50 ', 2)).toBe(123450);
  });

  it('rejects invalid, negative, or over-precise input', () => {
    expect(parseAmountToMinorUnits('', 2)).toBeNull();
    expect(parseAmountToMinorUnits('abc', 2)).toBeNull();
    expect(parseAmountToMinorUnits('-3', 2)).toBeNull();
    expect(parseAmountToMinorUnits('1.234', 2)).toBeNull();
    expect(parseAmountToMinorUnits('1.2.3', 2)).toBeNull();
  });

  it('handles currencies without decimals', () => {
    expect(parseAmountToMinorUnits('1500', 0)).toBe(1500);
    expect(parseAmountToMinorUnits('15.5', 0)).toBeNull();
  });
});

describe('toMajorUnitsString', () => {
  it('renders minor units as an editable decimal string', () => {
    expect(toMajorUnitsString(1234, 2)).toBe('12.34');
    expect(toMajorUnitsString(5, 2)).toBe('0.05');
    expect(toMajorUnitsString(1500, 0)).toBe('1500');
  });
});

describe('formatMoney', () => {
  it('formats minor units with the currency', () => {
    expect(formatMoney(123456, 'USD', 'en-US')).toBe('$1,234.56');
  });

  it('formats negative balances', () => {
    expect(formatMoney(-500, 'USD', 'en-US')).toBe('-$5.00');
  });
});

describe('currency helpers', () => {
  it('validates ISO 4217 style codes', () => {
    expect(isValidCurrencyCode('USD')).toBe(true);
    expect(isValidCurrencyCode('usd')).toBe(false);
    expect(isValidCurrencyCode('US')).toBe(false);
  });

  it('resolves stored, then device, then USD', () => {
    expect(resolveCurrency('EUR', 'MXN')).toBe('EUR');
    expect(resolveCurrency(null, 'MXN')).toBe('MXN');
    expect(resolveCurrency(null, null)).toBe('USD');
    expect(resolveCurrency(null, 'bad')).toBe('USD');
  });
});
