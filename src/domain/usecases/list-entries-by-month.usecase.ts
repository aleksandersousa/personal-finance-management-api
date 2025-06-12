import { EntryModel } from "../models/entry.model";

export interface ListEntriesByMonthRequest {
  userId: string;
  year: number;
  month: number;
}

export interface ListEntriesByMonthUseCase {
  execute(request: ListEntriesByMonthRequest): Promise<EntryModel[]>;
}
