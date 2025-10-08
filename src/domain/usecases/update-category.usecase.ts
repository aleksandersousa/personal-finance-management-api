import { Category, type CategoryType } from '@domain/models/category.model';

export interface UpdateCategoryRequest {
  id: string;
  userId: string;
  name?: string;
  description?: string;
  type?: CategoryType;
  color?: string;
  icon?: string;
}

export interface UpdateCategoryUseCase {
  execute(request: UpdateCategoryRequest): Promise<Category>;
}
