import { CategoryModel } from "@domain/models/category.model";

export const mockCategory: CategoryModel = {
  id: "category-123",
  name: "Food",
  type: "EXPENSE",
  userId: "user-123",
  createdAt: new Date("2025-06-01T10:00:00Z"),
  updatedAt: new Date("2025-06-01T10:00:00Z"),
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
    overrides: Partial<CategoryModel> = {}
  ): CategoryModel[] {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        ...overrides,
        id: `category-${index + 1}`,
        name: `Category ${index + 1}`,
      })
    );
  }

  static createValid(): CategoryModel {
    return this.create();
  }

  static createIncome(): CategoryModel {
    return this.create({
      type: "INCOME",
      name: "Salary",
      id: "salary-category",
    });
  }

  static createExpense(): CategoryModel {
    return this.create({
      type: "EXPENSE",
      name: "Food",
      id: "food-category",
    });
  }

  static createForUser(userId: string): CategoryModel {
    return this.create({ userId });
  }

  static createWithName(name: string): CategoryModel {
    return this.create({ name });
  }

  static createWithType(type: "INCOME" | "EXPENSE"): CategoryModel {
    return this.create({ type });
  }
}
