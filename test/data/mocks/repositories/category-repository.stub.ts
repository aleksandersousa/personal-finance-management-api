import {
  Category,
  CategoryType,
  CategoryCreateData,
  CategoryUpdateData,
  CategoryListFilters,
} from '@domain/models/category.model';
import {
  CategoryRepository,
  FindCategoriesWithFiltersResult,
} from '@data/protocols/category-repository';

/**
 * Category Repository Stub for Data Layer Testing
 * Provides controllable implementations for testing business logic
 */
export class CategoryRepositoryStub implements CategoryRepository {
  private categories: Map<string, Category> = new Map();
  private shouldFail = false;
  private errorToThrow: Error | null = null;
  private hasEntriesAssociatedResult = false;

  async create(data: CategoryCreateData): Promise<Category> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    // Check for duplicate name
    const existing = Array.from(this.categories.values()).find(
      c => c.userId === data.userId && c.name === data.name,
    );
    if (existing) {
      throw new Error('Category name already exists');
    }

    const category: Category = {
      ...data,
      id: `stub-${Date.now()}-${Math.random()}`,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.categories.set(category.id, category);
    return category;
  }

  async findById(id: string): Promise<Category | null> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    return this.categories.get(id) || null;
  }

  async findByUserId(userId: string): Promise<Category[]> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    return Array.from(this.categories.values()).filter(
      c => c.userId === userId,
    );
  }

  async findByUserIdAndType(
    userId: string,
    type: CategoryType,
  ): Promise<Category[]> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    return Array.from(this.categories.values()).filter(
      c => c.userId === userId && c.type === type,
    );
  }

  async findByUserIdAndName(
    userId: string,
    name: string,
  ): Promise<Category | null> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    return (
      Array.from(this.categories.values()).find(
        c => c.userId === userId && c.name === name,
      ) || null
    );
  }

  async findWithFilters(
    filters: CategoryListFilters,
  ): Promise<FindCategoriesWithFiltersResult> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    let filtered = Array.from(this.categories.values()).filter(
      c => c.userId === filters.userId,
    );

    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(
        c => c.type === (filters.type as CategoryType),
      );
    }

    // Get total before pagination
    const total = filtered.length;

    // Apply pagination if provided
    if (filters.page !== undefined && filters.limit !== undefined) {
      const skip = (filters.page - 1) * filters.limit;
      filtered = filtered.slice(skip, skip + filters.limit);
    }

    const data = filtered.map(category => ({
      ...category,
      entriesCount: filters.includeStats ? 0 : undefined,
      totalAmount: filters.includeStats ? 0 : undefined,
      lastUsed: filters.includeStats ? null : undefined,
    }));

    return {
      data,
      total,
    };
  }

  async update(id: string, data: CategoryUpdateData): Promise<Category> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const existing = this.categories.get(id);
    if (!existing) {
      throw new Error('Category not found');
    }

    // Check for duplicate name if name is being updated
    if (data.name && data.name !== existing.name) {
      const duplicate = Array.from(this.categories.values()).find(
        c =>
          c.userId === existing.userId && c.name === data.name && c.id !== id,
      );
      if (duplicate) {
        throw new Error('Category name already exists');
      }
    }

    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.categories.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    this.categories.delete(id);
  }

  async softDelete(id: string): Promise<void> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    // In a real implementation, this would set a deletedAt field
    this.categories.delete(id);
  }

  async hasEntriesAssociated(_: string): Promise<boolean> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    return this.hasEntriesAssociatedResult;
  }

  // =================== Test Utility Methods ===================

  /**
   * Clear all categories and reset error state
   */
  clear(): void {
    this.categories.clear();
    this.shouldFail = false;
    this.errorToThrow = null;
    this.hasEntriesAssociatedResult = false;
  }

  /**
   * Seed the repository with predefined categories
   */
  seed(categories: Category[]): void {
    categories.forEach(category => this.categories.set(category.id, category));
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
    this.mockFailure(new Error('Database connection failed'));
  }

  findByName(userId: string, name: string): Category | null {
    return (
      Array.from(this.categories.values()).find(
        c => c.userId === userId && c.name === name,
      ) || null
    );
  }

  getAllCategories(): Category[] {
    return Array.from(this.categories.values());
  }

  /**
   * Mock the hasEntriesAssociated method to return a specific value
   */
  mockHasEntriesAssociated(hasEntries: boolean): void {
    this.hasEntriesAssociatedResult = hasEntries;
  }
}
