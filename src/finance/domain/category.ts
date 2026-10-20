import type { MinorUnits } from '../../shared/money/money';

export type CategoryKind = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  icon: string;
  monthlyBudget: MinorUnits | null;
  kind: CategoryKind;
}

/** Seed keys double as stable category ids; display names are resolved by i18n. */
export type DefaultCategoryKey =
  | 'groceries'
  | 'home'
  | 'utilities'
  | 'health'
  | 'transport'
  | 'foodDining'
  | 'entertainment'
  | 'other'
  | 'salary'
  | 'otherIncome';

export interface DefaultCategorySeed {
  key: DefaultCategoryKey;
  icon: string;
  kind: CategoryKind;
}

export const DEFAULT_CATEGORY_SEEDS: readonly DefaultCategorySeed[] = [
  { key: 'groceries', icon: '🛒', kind: 'expense' },
  { key: 'home', icon: '🏠', kind: 'expense' },
  { key: 'utilities', icon: '💡', kind: 'expense' },
  { key: 'health', icon: '🩺', kind: 'expense' },
  { key: 'transport', icon: '🚗', kind: 'expense' },
  { key: 'foodDining', icon: '🍽️', kind: 'expense' },
  { key: 'entertainment', icon: '🎬', kind: 'expense' },
  { key: 'other', icon: '📦', kind: 'expense' },
  { key: 'salary', icon: '💼', kind: 'income' },
  { key: 'otherIncome', icon: '💰', kind: 'income' },
];

export function isValidBudget(budget: MinorUnits | null): boolean {
  return budget === null || (Number.isSafeInteger(budget) && budget >= 0);
}
