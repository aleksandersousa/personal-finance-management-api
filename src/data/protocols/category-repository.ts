import {
  Category,
  CategoryType,
  CategoryCreateData,
  CategoryUpdateData,
  CategoryListFilters,
  CategoryWithStats,
} from '@domain/models/category.model';

export interface FindCategoriesWithFiltersResult {
  data: CategoryWithStats[];
  total: number;
}

export interface CategoryRepository {
  create(data: CategoryCreateData): Promise<Category>;
  findById(id: string): Promise<Category | null>;
  findByUserId(userId: string): Promise<Category[]>;
  findByUserIdAndType(userId: string, type: CategoryType): Promise<Category[]>;
  findByUserIdAndName(userId: string, name: string): Promise<Category | null>;
  findWithFilters(
    filters: CategoryListFilters,
  ): Promise<FindCategoriesWithFiltersResult>;
  update(id: string, data: CategoryUpdateData): Promise<Category>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;
  hasEntriesAssociated(categoryId: string): Promise<boolean>;
}
