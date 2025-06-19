import {
  CategoryListFilters,
  CategoryListResponse,
} from '@domain/models/category.model';

export interface ListCategoriesUseCase {
  execute(filters: CategoryListFilters): Promise<CategoryListResponse>;
}
