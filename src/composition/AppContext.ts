import { createContext, useContext } from 'react';

import type { AppServices } from './createAppServices';

export interface AppContextValue {
  services: AppServices;
  currency: string;
  locale: string;
  updateCurrency(code: string): Promise<void>;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside <AppProvider>');
  return value;
}

export const useServices = () => useApp().services;
