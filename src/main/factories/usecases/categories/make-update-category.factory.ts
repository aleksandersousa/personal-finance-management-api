import { DbUpdateCategoryUseCase } from '@data/usecases/db-update-category.usecase';
import type { CategoryRepository } from '@/data/protocols';

export const makeUpdateCategoryFactory = (
  categoryRepository: CategoryRepository,
) => {
  return new DbUpdateCategoryUseCase(categoryRepository);
};
