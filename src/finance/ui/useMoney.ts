import { useMemo } from 'react';

import { useApp } from '../../composition/AppContext';
import { formatMoney, fractionDigitsFor, type MinorUnits } from '../../shared/money/money';

export function useMoney() {
  const { currency, locale } = useApp();
  return useMemo(
    () => ({
      currency,
      locale,
      fractionDigits: fractionDigitsFor(currency),
      format: (amount: MinorUnits) => formatMoney(amount, currency, locale),
    }),
    [currency, locale],
  );
}
