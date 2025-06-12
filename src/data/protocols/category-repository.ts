import { CategoryModel, CategoryType } from "@domain/models/category.model";

export interface CreateCategoryData {
  name: string;
  type: CategoryType;
  userId: string;
}

export interface CategoryRepository {
  create(data: CreateCategoryData): Promise<CategoryModel>;
  findById(id: string): Promise<CategoryModel | null>;
  findByUserId(userId: string): Promise<CategoryModel[]>;
  findByUserIdAndType(
    userId: string,
    type: CategoryType
  ): Promise<CategoryModel[]>;
  update(id: string, data: Partial<CreateCategoryData>): Promise<CategoryModel>;
  delete(id: string): Promise<void>;
}
