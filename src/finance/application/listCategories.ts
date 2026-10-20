import type { Category, CategoryKind } from '../domain/category';
import type { CategoryRepository } from './ports';

export async function listCategories(
  deps: { categories: CategoryRepository },
  kind?: CategoryKind,
): Promise<Category[]> {
  const categories = await deps.categories.list();
  return kind ? categories.filter((c) => c.kind === kind) : categories;
}
