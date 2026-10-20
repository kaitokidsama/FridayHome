import type { MinorUnits } from '../../shared/money/money';
import { isValidBudget } from '../domain/category';
import type { CategoryRepository } from './ports';

export async function setCategoryBudget(
  deps: { categories: CategoryRepository },
  categoryId: string,
  monthlyBudget: MinorUnits | null,
): Promise<void> {
  if (!isValidBudget(monthlyBudget)) throw new Error(`Invalid budget: ${monthlyBudget}`);
  const category = await deps.categories.getById(categoryId);
  if (!category) throw new Error(`Category ${categoryId} not found`);
  if (category.kind !== 'expense') throw new Error('Budgets apply to expense categories only');
  await deps.categories.updateBudget(categoryId, monthlyBudget);
}
