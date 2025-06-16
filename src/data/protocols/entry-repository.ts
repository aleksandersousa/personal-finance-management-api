import { EntryModel } from '@domain/models/entry.model';

export interface CreateEntryData {
  userId: string;
  description: string;
  amount: number;
  date: Date;
  type: 'INCOME' | 'EXPENSE';
  isFixed: boolean;
  categoryId?: string;
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
}

export interface FindEntriesByMonthResult {
  data: EntryModel[];
  total: number;
  totalIncome: number;
  totalExpenses: number;
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
  update(id: string, data: Partial<CreateEntryData>): Promise<EntryModel>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<Date>;
}
