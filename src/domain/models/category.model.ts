export interface Category {
  id: string;
  name: string;
  description?: string;
  type: CategoryType;
  color?: string;
  icon?: string;
  userId: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum CategoryType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface CategoryCreateData {
  name: string;
  description?: string;
  type: CategoryType;
  color?: string;
  icon?: string;
  userId: string;
}

export interface CategoryUpdateData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface CategoryListFilters {
  userId: string;
  type?: CategoryType | 'all';
  includeStats?: boolean;
}

export interface CategoryWithStats extends Category {
  entriesCount?: number;
  totalAmount?: number;
  lastUsed?: Date | null;
}
