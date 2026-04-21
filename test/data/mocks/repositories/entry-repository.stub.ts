import {
  AccumulatedStats,
  CategorySummaryResult,
  CreateEntryData,
  EntryRepository,
  FindEntriesByMonthFilters,
  FindEntriesByMonthResult,
  FixedEntriesSummary,
  MonthYear,
  MonthlySummaryStats,
  UpdateEntryData,
} from '@/data/protocols/repositories/entry-repository';
import { IdGenerator } from '@data/protocols/id-generator';
import { EntryModel } from '@domain/models/entry.model';

export class EntryRepositoryStub implements EntryRepository {
  private entries: Map<string, EntryModel> = new Map();
  private shouldFail = false;
  private errorToThrow: Error | null = null;
  private nextId = 1;

  constructor(private readonly idGenerator?: IdGenerator) {}

  private throwIfNeeded(): void {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
  }

  private buildEntry(id: string, data: CreateEntryData): EntryModel {
    return {
      id,
      recurrenceId: data.recurrenceId,
      userId: data.userId,
      categoryId: data.categoryId,
      description: data.description,
      amount: data.amount,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async create(data: CreateEntryData): Promise<EntryModel> {
    this.throwIfNeeded();
    const id = this.idGenerator
      ? this.idGenerator.generate()
      : `stub-entry-${Date.now()}-${this.nextId++}`;
    const entry = this.buildEntry(id, data);
    this.entries.set(id, entry);
    return entry;
  }

  async findById(id: string): Promise<EntryModel | null> {
    this.throwIfNeeded();
    return this.entries.get(id) || null;
  }

  async findByUserId(userId: string): Promise<EntryModel[]> {
    this.throwIfNeeded();
    return [...this.entries.values()].filter(entry => entry.userId === userId);
  }

  async findByUserIdAndMonth(
    userId: string,
    year: number,
    month: number,
  ): Promise<EntryModel[]> {
    const entries = await this.findByUserId(userId);
    return entries.filter(entry => {
      const dueDate = entry.dueDate;
      return dueDate.getFullYear() === year && dueDate.getMonth() + 1 === month;
    });
  }

  async findByUserIdAndMonthWithFilters(
    filters: FindEntriesByMonthFilters,
  ): Promise<FindEntriesByMonthResult> {
    let entries = await this.findByUserIdAndMonth(
      filters.userId,
      filters.year,
      filters.month,
    );
    if (filters.categoryId && filters.categoryId !== 'all') {
      entries = entries.filter(entry => entry.categoryId === filters.categoryId);
    }
    if (filters.search) {
      entries = entries.filter(entry =>
        entry.description.toLowerCase().includes(filters.search!.toLowerCase()),
      );
    }
    const total = entries.length;
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const data = entries.slice((page - 1) * limit, page * limit);
    return {
      data,
      total,
      totalIncome: 0,
      totalExpenses: 0,
    };
  }

  async getMonthlySummaryStats(): Promise<MonthlySummaryStats> {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      totalPaidExpenses: 0,
      totalUnpaidExpenses: 0,
      fixedIncome: 0,
      dynamicIncome: 0,
      fixedExpenses: 0,
      dynamicExpenses: 0,
      fixedPaidExpenses: 0,
      fixedUnpaidExpenses: 0,
      dynamicPaidExpenses: 0,
      dynamicUnpaidExpenses: 0,
      totalEntries: 0,
      incomeEntries: 0,
      expenseEntries: 0,
    };
  }

  async getCategorySummaryForMonth(): Promise<CategorySummaryResult> {
    return {
      items: [],
      allItems: [],
      incomeTotal: 0,
      expenseTotal: 0,
    };
  }

  async getFixedEntriesSummary(): Promise<FixedEntriesSummary> {
    return {
      fixedIncome: 0,
      fixedExpenses: 0,
      fixedNetFlow: 0,
      entriesCount: 0,
    };
  }

  async getCurrentBalance(): Promise<number> {
    this.throwIfNeeded();
    return 0;
  }

  async getDistinctMonthsYears(userId: string): Promise<MonthYear[]> {
    this.throwIfNeeded();
    const entries = await this.findByUserId(userId);
    const map = new Map<string, MonthYear>();
    entries.forEach(entry => {
      const year = entry.dueDate.getFullYear();
      const month = entry.dueDate.getMonth() + 1;
      const key = `${year}-${month}`;
      if (!map.has(key)) {
        map.set(key, { year, month });
      }
    });
    return [...map.values()].sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      return b.month - a.month;
    });
  }

  async getAccumulatedStats(): Promise<AccumulatedStats> {
    this.throwIfNeeded();
    return {
      totalAccumulatedIncome: 0,
      totalAccumulatedPaidExpenses: 0,
      previousMonthsUnpaidExpenses: 0,
      accumulatedBalance: 0,
    };
  }

  async update(id: string, data: UpdateEntryData): Promise<EntryModel> {
    const entry = this.entries.get(id);
    if (!entry) throw new Error('Entry not found');
    const updated: EntryModel = { ...entry, ...data, updatedAt: new Date() };
    this.entries.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.entries.delete(id)) throw new Error('Entry not found');
  }

  async softDelete(id: string): Promise<Date> {
    await this.delete(id);
    return new Date();
  }

  clear(): void {
    this.entries.clear();
    this.shouldFail = false;
    this.errorToThrow = null;
    this.nextId = 1;
  }

  seed(entries: EntryModel[]): void {
    entries.forEach(entry => this.entries.set(entry.id, entry));
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
    return this.entries.size;
  }

  hasEntry(id: string): boolean {
    return this.entries.has(id);
  }

  mockConnectionError(): void {
    this.mockFailure(new Error('Database connection failed'));
  }
}
