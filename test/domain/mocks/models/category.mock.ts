import {
  Category,
  CategoryType,
  CategoryCreateData,
  CategoryWithStats,
} from '@domain/models/category.model';

export const mockCategory: Category = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  name: 'Freelance Work',
  description: 'Income from freelance projects',
  type: CategoryType.INCOME,
  color: '#4CAF50',
  icon: 'work',
  userId: 'user-a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  isDefault: false,
  createdAt: new Date('2025-06-01T00:00:00Z'),
  updatedAt: new Date('2025-06-01T00:00:00Z'),
};

export const mockDefaultCategory: Category = {
  id: 'default-a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  name: 'Salary',
  description: 'Monthly salary',
  type: CategoryType.INCOME,
  color: '#2196F3',
  icon: 'account_balance_wallet',
  userId: 'user-a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  isDefault: true,
  createdAt: new Date('2025-06-01T00:00:00Z'),
  updatedAt: new Date('2025-06-01T00:00:00Z'),
};

/**
 * Factory for creating Category mock instances with variations
 */
export class MockCategoryFactory {
  static create(overrides: Partial<Category> = {}): Category {
    return { ...mockCategory, ...overrides };
  }

  static createMany(
    count: number,
    overrides: Partial<Category> = {},
  ): Category[] {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        ...overrides,
        id: `${mockCategory.id}-${index + 1}`,
        name: `${mockCategory.name} ${index + 1}`,
      }),
    );
  }

  static createValid(): Category {
    return this.create();
  }

  static createInvalid(): Partial<Category> {
    return { ...mockCategory, name: undefined };
  }

  static createDefault(): Category {
    return { ...mockDefaultCategory };
  }

  static createExpenseCategory(): Category {
    return this.create({
      name: 'Housing',
      description: 'Rent and utilities',
      type: CategoryType.EXPENSE,
      color: '#F44336',
      icon: 'home',
    });
  }

  static createWithStats(): CategoryWithStats {
    return {
      ...this.create(),
      entriesCount: 12,
      totalAmount: 60000,
      lastUsed: new Date('2025-06-01T00:00:00Z'),
    };
  }
}

export const mockCategoryCreateData: CategoryCreateData = {
  name: 'Freelance Work',
  description: 'Income from freelance projects',
  type: CategoryType.INCOME,
  color: '#4CAF50',
  icon: 'work',
  userId: 'user-a1b2c3d4-e5f6-7890-abcd-ef1234567890',
};

export class MockCategoryCreateDataFactory {
  static create(
    overrides: Partial<CategoryCreateData> = {},
  ): CategoryCreateData {
    return { ...mockCategoryCreateData, ...overrides };
  }

  static createValid(): CategoryCreateData {
    return this.create();
  }

  static createInvalid(): Partial<CategoryCreateData> {
    return { ...mockCategoryCreateData, name: '' };
  }

  static createExpense(): CategoryCreateData {
    return this.create({
      name: 'Housing',
      description: 'Rent and utilities',
      type: CategoryType.EXPENSE,
      color: '#F44336',
      icon: 'home',
    });
  }
}
