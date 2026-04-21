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
} from '@/data/protocols/repositories/category-repository';

export class CategoryRepositoryStub implements CategoryRepository {
  private categories: Map<string, Category> = new Map();
  private linksByUser: Map<string, Set<string>> = new Map();
  private shouldFail = false;
  private errorToThrow: Error | null = null;
  private hasEntriesAssociatedResult = false;

  private getLinkedCategoryIds(userId: string): Set<string> {
    return this.linksByUser.get(userId) ?? new Set();
  }

  private linkUserToCategory(userId: string, categoryId: string): void {
    const set = this.getLinkedCategoryIds(userId);
    set.add(categoryId);
    this.linksByUser.set(userId, set);
  }

  async create(data: CategoryCreateData): Promise<Category> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    for (const cid of this.getLinkedCategoryIds(data.userId)) {
      const c = this.categories.get(cid);
      if (c?.name === data.name) {
        throw new Error('Category name already exists');
      }
    }

    const category: Category = {
      name: data.name,
      description: data.description,
      type: data.type,
      color: data.color,
      icon: data.icon,
      id: `stub-${Date.now()}-${Math.random()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.categories.set(category.id, category);
    this.linkUserToCategory(data.userId, category.id);
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
    return Array.from(this.getLinkedCategoryIds(userId))
      .map(id => this.categories.get(id))
      .filter((c): c is Category => !!c)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async findByUserIdAndType(
    userId: string,
    type: CategoryType,
  ): Promise<Category[]> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    return (await this.findByUserId(userId)).filter(c => c.type === type);
  }

  async findByUserIdAndName(
    userId: string,
    name: string,
  ): Promise<Category | null> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    return (await this.findByUserId(userId)).find(c => c.name === name) || null;
  }

  async findWithFilters(
    filters: CategoryListFilters,
  ): Promise<FindCategoriesWithFiltersResult> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    let filtered = await this.findByUserId(filters.userId);

    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(
        c => c.type === (filters.type as CategoryType),
      );
    }

    if (filters.search && filters.search.trim()) {
      const searchLower = filters.search.trim().toLowerCase();
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchLower),
      );
    }

    const total = filtered.length;

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

    if (data.name && data.name !== existing.name) {
      for (const ids of this.linksByUser.values()) {
        if (!ids.has(id)) {
          continue;
        }
        for (const cid of ids) {
          if (cid === id) {
            continue;
          }
          const other = this.categories.get(cid);
          if (other?.name === data.name) {
            throw new Error('Category name already exists');
          }
        }
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
    for (const ids of this.linksByUser.values()) {
      ids.delete(id);
    }
  }

  async isUserLinkedToCategory(
    userId: string,
    categoryId: string,
  ): Promise<boolean> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    return this.getLinkedCategoryIds(userId).has(categoryId);
  }

  async unlinkFromUser(userId: string, categoryId: string): Promise<void> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    const ids = this.getLinkedCategoryIds(userId);
    if (!ids.has(categoryId)) {
      throw new Error('Category not found');
    }
    ids.delete(categoryId);
  }

  async hasEntriesAssociated(
    _userId: string,
    _categoryId: string,
  ): Promise<boolean> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    return this.hasEntriesAssociatedResult;
  }

  clear(): void {
    this.categories.clear();
    this.linksByUser.clear();
    this.shouldFail = false;
    this.errorToThrow = null;
    this.hasEntriesAssociatedResult = false;
  }

  seed(categories: Category[], userId?: string): void {
    categories.forEach(category => this.categories.set(category.id, category));
    if (userId) {
      categories.forEach(c => this.linkUserToCategory(userId, c.id));
    }
  }

  mockFailure(error: Error): void {
    this.shouldFail = true;
    this.errorToThrow = error;
  }

  mockSuccess(): void {
    this.shouldFail = false;
    this.errorToThrow = null;
  }

  getCount(): number {
    return this.categories.size;
  }

  hasCategory(id: string): boolean {
    return this.categories.has(id);
  }

  mockConnectionError(): void {
    this.mockFailure(new Error('Database connection failed'));
  }

  findByName(userId: string, name: string): Category | null {
    return (
      Array.from(this.getLinkedCategoryIds(userId))
        .map(id => this.categories.get(id))
        .find(c => c?.name === name) || null
    );
  }

  getAllCategories(): Category[] {
    return Array.from(this.categories.values());
  }

  mockHasEntriesAssociated(hasEntries: boolean): void {
    this.hasEntriesAssociatedResult = hasEntries;
  }
}
