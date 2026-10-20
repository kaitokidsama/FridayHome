import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { addMonths, monthKeyOf, toIsoDate, type MonthKey } from '../../shared/dates/isoDate';

interface MonthContextValue {
  month: MonthKey;
  setMonth(month: MonthKey): void;
  shift(delta: number): void;
}

const MonthContext = createContext<MonthContextValue | null>(null);

/** Shares the selected month between the Summary and Transactions tabs. */
export function MonthProvider({ children }: { children: ReactNode }) {
  const [month, setMonth] = useState<MonthKey>(() => monthKeyOf(toIsoDate(new Date())));
  const value = useMemo(
    () => ({ month, setMonth, shift: (delta: number) => setMonth((m) => addMonths(m, delta)) }),
    [month],
  );
  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>;
}

export function useSelectedMonth(): MonthContextValue {
  const value = useContext(MonthContext);
  if (!value) throw new Error('useSelectedMonth must be used inside <MonthProvider>');
  return value;
}
