import { DbListCategoriesUseCase } from '@data/usecases/db-list-categories.usecase';
import { CategoryRepository } from '@data/protocols/category-repository';

export const makeListCategoriesFactory = (
  categoryRepository: CategoryRepository,
): DbListCategoriesUseCase => {
  return new DbListCategoriesUseCase(categoryRepository);
};
