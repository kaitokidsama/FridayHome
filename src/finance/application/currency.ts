import { isValidCurrencyCode, resolveCurrency } from '../../shared/money/money';
import type { SettingsRepository } from './ports';

export const CURRENCY_SETTING_KEY = 'currency';

export async function getCurrency(
  deps: { settings: SettingsRepository },
  deviceCurrency: string | null,
): Promise<string> {
  return resolveCurrency(await deps.settings.get(CURRENCY_SETTING_KEY), deviceCurrency);
}

export async function setCurrency(
  deps: { settings: SettingsRepository },
  code: string,
): Promise<string> {
  const normalized = code.trim().toUpperCase();
  if (!isValidCurrencyCode(normalized)) throw new Error(`Invalid currency: ${code}`);
  await deps.settings.set(CURRENCY_SETTING_KEY, normalized);
  return normalized;
}
