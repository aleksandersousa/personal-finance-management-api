import { CategoryModel } from '@domain/models/category.model';

const mockCategory: CategoryModel = {
  id: 'category-123',
  name: 'Test Category',
  type: 'EXPENSE',
  userId: 'user-123',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

/**
 * Factory for creating Category mock instances with variations
 */
export class MockCategoryFactory {
  static create(overrides: Partial<CategoryModel> = {}): CategoryModel {
    return { ...mockCategory, ...overrides };
  }

  static createMany(
    count: number,
    overrides: Partial<CategoryModel> = {},
  ): CategoryModel[] {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        ...overrides,
        id: `category-${index + 1}`,
        name: `Category ${index + 1}`,
      }),
    );
  }
}
