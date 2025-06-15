export type CategoryType = 'INCOME' | 'EXPENSE';

export interface CategoryModel {
  id: string;
  name: string;
  type: CategoryType;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
