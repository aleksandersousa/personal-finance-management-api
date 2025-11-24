import {
  CreateEntryData,
  EntryRepository,
  FindEntriesByMonthFilters,
  FindEntriesByMonthResult,
  CategorySummaryItem,
  FixedEntriesSummary,
  MonthlySummaryStats,
  MonthYear,
} from '@data/protocols/entry-repository';
import { EntryModel } from '@domain/models/entry.model';
import { IdGenerator } from '@data/protocols/id-generator';

/**
 * Entry Repository Stub for Data Layer Testing
 * Provides controllable implementations for testing business logic
 */
export class EntryRepositoryStub implements EntryRepository {
  private entries: Map<string, EntryModel> = new Map();
  private shouldFail = false;
  private errorToThrow: Error | null = null;
  private nextId = 1;
  private idGenerator?: IdGenerator;

  constructor(idGenerator?: IdGenerator) {
    this.idGenerator = idGenerator;
  }

  async create(data: CreateEntryData): Promise<EntryModel> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const id = this.idGenerator
      ? this.idGenerator.generate()
      : `stub-entry-${Date.now()}-${this.nextId++}`;

    const entry: EntryModel = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.entries.set(entry.id, entry);
    return entry;
  }

  async findById(id: string): Promise<EntryModel | null> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    return this.entries.get(id) || null;
  }

  async findByUserId(userId: string): Promise<EntryModel[]> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    return Array.from(this.entries.values()).filter(
      entry => entry.userId === userId,
    );
  }

  async findByUserIdAndMonth(
    userId: string,
    year: number,
    month: number,
  ): Promise<EntryModel[]> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    return Array.from(this.entries.values()).filter(entry => {
      const entryDate = new Date(entry.date);
      return (
        entry.userId === userId &&
        entryDate.getFullYear() === year &&
        entryDate.getMonth() === month - 1
      ); // Month is 0-indexed
    });
  }

  async findByUserIdAndMonthWithFilters(
    filters: FindEntriesByMonthFilters,
  ): Promise<FindEntriesByMonthResult> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const {
      userId,
      year,
      month,
      page = 1,
      limit = 20,
      sort = 'date',
      order = 'desc',
      type = 'all',
      categoryId,
    } = filters;

    // Get base entries for the month
    let entries = await this.findByUserIdAndMonth(userId, year, month);

    // Apply type filter
    if (type && type !== 'all') {
      entries = entries.filter(entry => entry.type === type);
    }

    // Apply category filter
    if (categoryId && categoryId !== 'all') {
      entries = entries.filter(entry => entry.categoryId === categoryId);
    }

    // Apply sorting
    entries.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sort) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'description':
          aValue = a.description;
          bValue = b.description;
          break;
        case 'date':
        default:
          aValue = a.date;
          bValue = b.date;
          break;
      }

      if (order === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    // Calculate totals
    const totalIncome = entries
      .filter(entry => entry.type === 'INCOME')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalExpenses = entries
      .filter(entry => entry.type === 'EXPENSE')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const total = entries.length;

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEntries = entries.slice(startIndex, endIndex);

    return {
      data: paginatedEntries,
      total,
      totalIncome,
      totalExpenses,
    };
  }

  async update(
    id: string,
    data: Partial<CreateEntryData>,
  ): Promise<EntryModel> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const existing = this.entries.get(id);
    if (!existing) {
      throw new Error('Entry not found');
    }

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.entries.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    if (!this.entries.has(id)) {
      throw new Error('Entry not found');
    }

    this.entries.delete(id);
  }

  async softDelete(id: string): Promise<Date> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const entry = this.entries.get(id);
    if (!entry) {
      throw new Error('Entry not found');
    }

    const deletedAt = new Date();
    const updatedEntry = { ...entry, deletedAt };
    this.entries.set(id, updatedEntry);
    return deletedAt;
  }

  async getMonthlySummaryStats(
    userId: string,
    year: number,
    month: number,
  ): Promise<MonthlySummaryStats> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const entriesForMonth = await this.findByUserIdAndMonth(
      userId,
      year,
      month,
    );

    const totalIncome = entriesForMonth
      .filter(entry => entry.type === 'INCOME')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalExpenses = entriesForMonth
      .filter(entry => entry.type === 'EXPENSE')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const fixedIncome = entriesForMonth
      .filter(entry => entry.type === 'INCOME' && entry.isFixed)
      .reduce((sum, entry) => sum + entry.amount, 0);

    const dynamicIncome = entriesForMonth
      .filter(entry => entry.type === 'INCOME' && !entry.isFixed)
      .reduce((sum, entry) => sum + entry.amount, 0);

    const fixedExpenses = entriesForMonth
      .filter(entry => entry.type === 'EXPENSE' && entry.isFixed)
      .reduce((sum, entry) => sum + entry.amount, 0);

    const dynamicExpenses = entriesForMonth
      .filter(entry => entry.type === 'EXPENSE' && !entry.isFixed)
      .reduce((sum, entry) => sum + entry.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      fixedIncome,
      dynamicIncome,
      fixedExpenses,
      dynamicExpenses,
      totalEntries: entriesForMonth.length,
      incomeEntries: entriesForMonth.filter(entry => entry.type === 'INCOME')
        .length,
      expenseEntries: entriesForMonth.filter(entry => entry.type === 'EXPENSE')
        .length,
    };
  }

  async getCategorySummaryForMonth(
    userId: string,
    year: number,
    month: number,
  ): Promise<CategorySummaryItem[]> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const entriesForMonth = await this.findByUserIdAndMonth(
      userId,
      year,
      month,
    );
    const categorizedEntries = entriesForMonth.filter(
      entry => entry.categoryId,
    );

    // Group by category and type
    const categoryGroups = new Map<string, CategorySummaryItem>();

    categorizedEntries.forEach(entry => {
      const key = `${entry.categoryId}-${entry.type}`;
      if (!categoryGroups.has(key)) {
        categoryGroups.set(key, {
          categoryId: entry.categoryId,
          categoryName: 'Test Category',
          type: entry.type,
          total: 0,
          count: 0,
        });
      }

      const group = categoryGroups.get(key)!;
      group.total += entry.amount;
      group.count += 1;
    });

    return Array.from(categoryGroups.values());
  }

  async getFixedEntriesSummary(userId: string): Promise<FixedEntriesSummary> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const userEntries = await this.findByUserId(userId);
    const fixedEntries = userEntries.filter(entry => entry.isFixed === true);

    const fixedIncome = fixedEntries
      .filter(entry => entry.type === 'INCOME')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const fixedExpenses = fixedEntries
      .filter(entry => entry.type === 'EXPENSE')
      .reduce((sum, entry) => sum + entry.amount, 0);

    return {
      fixedIncome,
      fixedExpenses,
      fixedNetFlow: fixedIncome - fixedExpenses,
      entriesCount: fixedEntries.length,
    };
  }

  async getCurrentBalance(userId: string): Promise<number> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const userEntries = await this.findByUserId(userId);
    const totalIncome = userEntries
      .filter(entry => entry.type === 'INCOME')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalExpenses = userEntries
      .filter(entry => entry.type === 'EXPENSE')
      .reduce((sum, entry) => sum + entry.amount, 0);

    return totalIncome - totalExpenses;
  }

  async getDistinctMonthsYears(userId: string): Promise<MonthYear[]> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const userEntries = await this.findByUserId(userId);
    const monthsYearsMap = new Map<string, MonthYear>();

    userEntries.forEach(entry => {
      if (!entry.deletedAt) {
        const entryDate = new Date(entry.date);
        const year = entryDate.getFullYear();
        const month = entryDate.getMonth() + 1; // Month is 1-indexed
        const key = `${year}-${month}`;

        if (!monthsYearsMap.has(key)) {
          monthsYearsMap.set(key, { year, month });
        }
      }
    });

    return Array.from(monthsYearsMap.values()).sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year; // Descending by year
      }
      return b.month - a.month; // Descending by month
    });
  }

  // =================== Test Utility Methods ===================

  /**
   * Clear all entries and reset error state
   */
  clear(): void {
    this.entries.clear();
    this.shouldFail = false;
    this.errorToThrow = null;
    this.nextId = 1;
  }

  /**
   * Seed the repository with predefined entries
   */
  seed(entries: EntryModel[]): void {
    entries.forEach(entry => this.entries.set(entry.id, entry));
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
   * Get the number of entries in the stub
   */
  getCount(): number {
    return this.entries.size;
  }

  /**
   * Check if an entry exists by ID
   */
  hasEntry(id: string): boolean {
    return this.entries.has(id);
  }

  /**
   * Simulate connection errors
   */
  mockConnectionError(): void {
    this.mockFailure(new Error('Database connection failed'));
  }
}
