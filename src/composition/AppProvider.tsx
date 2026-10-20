import { getLocales } from 'expo-localization';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { openAppDatabase } from '../shared/db/connection';
import { ExpoReminderScheduler } from '../shared/notifications/ExpoReminderScheduler';
import { LoadingState, ErrorState } from '../shared/ui/states';
import { FileSystemAttachmentStorage } from '../invoices/infrastructure/FileSystemAttachmentStorage';
import { AppContext, type AppContextValue } from './AppContext';
import { createAppServices, type AppServices } from './createAppServices';

interface Ready {
  services: AppServices;
  currency: string;
}

function deviceLocale() {
  const [primary] = getLocales();
  return { locale: primary.languageTag, currency: primary.currencyCode };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState<Ready | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);
  const device = useMemo(deviceLocale, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const db = await openAppDatabase();
        const services = createAppServices({
          db,
          scheduler: new ExpoReminderScheduler(),
          attachments: new FileSystemAttachmentStorage(),
          deviceCurrency: device.currency,
        });
        const currency = await services.finance.getCurrency();
        if (!cancelled) setReady({ services, currency });
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught : new Error(String(caught)));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [device.currency, attempt]);

  const updateCurrency = useCallback(
    async (code: string) => {
      if (!ready) return;
      const currency = await ready.services.finance.setCurrency(code);
      setReady({ ...ready, currency });
    },
    [ready],
  );

  const value = useMemo<AppContextValue | null>(
    () => (ready ? { ...ready, locale: device.locale, updateCurrency } : null),
    [ready, device.locale, updateCurrency],
  );

  if (error) {
    return (
      <ErrorState
        message={error.message}
        onRetry={() => {
          setError(null);
          setAttempt((n) => n + 1);
        }}
      />
    );
  }
  if (!value) return <LoadingState />;
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
