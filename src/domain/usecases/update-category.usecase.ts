import { Category } from '@domain/models/category.model';

export interface UpdateCategoryRequest {
  id: string;
  userId: string;
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateCategoryUseCase {
  execute(request: UpdateCategoryRequest): Promise<Category>;
}
