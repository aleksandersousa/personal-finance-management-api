import { CategoryRepository } from "@data/protocols/category-repository";
import { CategoryModel } from "@domain/models/category.model";

/**
 * Category Repository Stub for Data Layer Testing
 * Provides controllable implementations for testing business logic
 */
export class CategoryRepositoryStub implements CategoryRepository {
  private categories: Map<string, CategoryModel> = new Map();
  private shouldFail = false;
  private errorToThrow: Error | null = null;
  private nextId = 1;

  async create(
    data: Omit<CategoryModel, "id" | "createdAt" | "updatedAt">
  ): Promise<CategoryModel> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const category: CategoryModel = {
      ...data,
      id: `stub-category-${Date.now()}-${this.nextId++}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.categories.set(category.id, category);
    return category;
  }

  async findById(id: string): Promise<CategoryModel | null> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    return this.categories.get(id) || null;
  }

  async findByUserId(userId: string): Promise<CategoryModel[]> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    return Array.from(this.categories.values()).filter(
      (category) => category.userId === userId
    );
  }

  async findByUserIdAndType(
    userId: string,
    type: "INCOME" | "EXPENSE"
  ): Promise<CategoryModel[]> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    return Array.from(this.categories.values()).filter(
      (category) => category.userId === userId && category.type === type
    );
  }

  async update(
    id: string,
    data: Partial<CategoryModel>
  ): Promise<CategoryModel> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const existing = this.categories.get(id);
    if (!existing) {
      throw new Error("Category not found");
    }

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.categories.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    if (!this.categories.has(id)) {
      throw new Error("Category not found");
    }

    this.categories.delete(id);
  }

  // =================== Test Utility Methods ===================

  /**
   * Clear all categories and reset error state
   */
  clear(): void {
    this.categories.clear();
    this.shouldFail = false;
    this.errorToThrow = null;
    this.nextId = 1;
  }

  /**
   * Seed the repository with predefined categories
   */
  seed(categories: CategoryModel[]): void {
    categories.forEach((category) =>
      this.categories.set(category.id, category)
    );
  }

  /**
   * Configure the stub to throw an error on next operation
   */
  mockFailure(error: Error): void {
    this.shouldFail = true;
    this.errorToThrow = error;
  }

  /**
   * Configure the stub to operate normally
   */
  mockSuccess(): void {
    this.shouldFail = false;
    this.errorToThrow = null;
  }

  /**
   * Get the number of categories in the stub
   */
  getCount(): number {
    return this.categories.size;
  }

  /**
   * Check if a category exists by ID
   */
  hasCategory(id: string): boolean {
    return this.categories.has(id);
  }

  /**
   * Simulate connection errors
   */
  mockConnectionError(): void {
    this.mockFailure(new Error("Database connection failed"));
  }
}
