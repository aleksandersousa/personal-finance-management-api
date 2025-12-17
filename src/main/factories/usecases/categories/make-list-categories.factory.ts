import { DbListCategoriesUseCase } from '@data/usecases/db-list-categories.usecase';
import { CategoryRepository } from '@/data/protocols/repositories/category-repository';
import type { Logger } from '@/data/protocols';

export const makeListCategoriesFactory = (
  categoryRepository: CategoryRepository,
  logger: Logger,
): DbListCategoriesUseCase => {
  return new DbListCategoriesUseCase(categoryRepository, logger);
};
