import { DbDeleteCategoryUseCase } from '@data/usecases/db-delete-category.usecase';
import type { CategoryRepository } from '@/data/protocols';

export const makeDeleteCategoryFactory = (
  categoryRepository: CategoryRepository,
) => {
  return new DbDeleteCategoryUseCase(categoryRepository);
};
