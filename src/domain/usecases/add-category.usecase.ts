import { Category, CategoryCreateData } from '@domain/models/category.model';

export interface AddCategoryUseCase {
  execute(data: CategoryCreateData): Promise<Category>;
}
