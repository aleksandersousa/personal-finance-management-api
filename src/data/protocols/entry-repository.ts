import { EntryModel } from '@domain/models/entry.model';

export interface CreateEntryData {
  amount: number;
  description: string;
  date: Date;
  type: 'INCOME' | 'EXPENSE';
  isFixed: boolean;
  categoryId: string | null;
  userId: string;
}

export interface UpdateEntryData {
  amount?: number;
  description?: string;
  date?: Date;
  type?: 'INCOME' | 'EXPENSE';
  isFixed?: boolean;
  categoryId?: string | null;
}

export interface FindEntriesByMonthFilters {
  userId: string;
  year: number;
  month: number;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  type?: 'INCOME' | 'EXPENSE' | 'all';
  categoryId?: string;
  search?: string;
}

export interface FindEntriesByMonthResult {
  data: EntryModel[];
  total: number;
  totalIncome: number;
  totalExpenses: number;
}

export interface MonthlySummaryStats {
  totalIncome: number;
  totalExpenses: number;
  fixedIncome: number;
  dynamicIncome: number;
  fixedExpenses: number;
  dynamicExpenses: number;
  totalEntries: number;
  incomeEntries: number;
  expenseEntries: number;
}

export interface CategorySummaryItem {
  categoryId: string;
  categoryName: string;
  type: 'INCOME' | 'EXPENSE';
  total: number;
  count: number;
}

export interface CategorySummaryResult {
  items: CategorySummaryItem[];
  incomeTotal: number;
  expenseTotal: number;
}

export interface FixedEntriesSummary {
  fixedIncome: number;
  fixedExpenses: number;
  fixedNetFlow: number;
  entriesCount: number;
}

export interface MonthYear {
  year: number;
  month: number;
}

export interface EntryRepository {
  create(data: CreateEntryData): Promise<EntryModel>;
  findById(id: string): Promise<EntryModel | null>;
  findByUserId(userId: string): Promise<EntryModel[]>;
  findByUserIdAndMonth(
    userId: string,
    year: number,
    month: number,
  ): Promise<EntryModel[]>;
  findByUserIdAndMonthWithFilters(
    filters: FindEntriesByMonthFilters,
  ): Promise<FindEntriesByMonthResult>;
  getMonthlySummaryStats(
    userId: string,
    year: number,
    month: number,
  ): Promise<MonthlySummaryStats>;
  getCategorySummaryForMonth(
    userId: string,
    year: number,
    month: number,
  ): Promise<CategorySummaryResult>;
  getFixedEntriesSummary(userId: string): Promise<FixedEntriesSummary>;
  getCurrentBalance(userId: string): Promise<number>;
  getDistinctMonthsYears(userId: string): Promise<MonthYear[]>;
  update(id: string, data: UpdateEntryData): Promise<EntryModel>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<Date>;
}
