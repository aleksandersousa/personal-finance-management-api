import { EntryModel } from '../models/entry.model';

export interface ListEntriesByMonthRequest {
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
  isPaid?: boolean | 'all';
}

export interface ListEntriesByMonthResponse {
  data: EntryModel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    entriesCount: number;
  };
}

export interface ListEntriesByMonthUseCase {
  execute(
    request: ListEntriesByMonthRequest,
  ): Promise<ListEntriesByMonthResponse>;
}
