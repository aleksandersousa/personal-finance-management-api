import { EntryModel } from '@domain/models/entry.model';

export interface CreateEntryData {
  amount: number;
  description: string;
  issueDate: Date;
  dueDate: Date;
  recurrenceId: string | null;
  categoryId: string | null;
  userId: string;
}

export interface UpdateEntryData {
  amount?: number;
  description?: string;
  issueDate?: Date;
  dueDate?: Date;
  recurrenceId?: string | null;
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
  categoryId?: string;
  entryType?: 'INCOME' | 'EXPENSE';
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
  totalPaidExpenses: number;
  totalUnpaidExpenses: number;
  fixedIncome: number;
  dynamicIncome: number;
  fixedExpenses: number;
  dynamicExpenses: number;
  fixedPaidExpenses: number;
  fixedUnpaidExpenses: number;
  dynamicPaidExpenses: number;
  dynamicUnpaidExpenses: number;
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
  unpaidAmount: number;
}

export interface CategorySummaryResult {
  /** Top categories (e.g. top 3) for compact UI */
  items: CategorySummaryItem[];
  /** All categories with amounts for the month, same shape as items */
  allItems: CategorySummaryItem[];
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

export interface AccumulatedStats {
  totalAccumulatedIncome: number;
  totalAccumulatedPaidExpenses: number;
  previousMonthsUnpaidExpenses: number;
  accumulatedBalance: number;
}

export interface ToggleEntryPaymentStatusResult {
  entryId: string;
  isPaid: boolean;
  paidAt: Date | null;
}

export interface MonthlyRecurringEntriesQuery {
  startDate: Date;
  endDate: Date;
}

export interface EntryMonthlyMirrorExistsQuery {
  userId: string;
  recurrenceId: string;
  issueDate: Date;
  amount: number;
  description: string;
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
  findMonthlyRecurringEntriesInRange(
    query: MonthlyRecurringEntriesQuery,
  ): Promise<EntryModel[]>;
  existsMonthlyMirroredEntry(
    query: EntryMonthlyMirrorExistsQuery,
  ): Promise<boolean>;
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
  getAccumulatedStats(
    userId: string,
    year: number,
    month: number,
  ): Promise<AccumulatedStats>;
  update(id: string, data: UpdateEntryData): Promise<EntryModel>;
  togglePaymentStatus(
    userId: string,
    entryId: string,
    isPaid: boolean,
  ): Promise<ToggleEntryPaymentStatusResult>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<Date>;
}
