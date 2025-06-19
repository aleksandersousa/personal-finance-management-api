import { DbAddCategoryUseCase } from '@data/usecases/db-add-category.usecase';
import type { CategoryRepository } from '@/data/protocols';

export const makeAddCategoryFactory = (
  categoryRepository: CategoryRepository,
) => {
  return new DbAddCategoryUseCase(categoryRepository);
};
