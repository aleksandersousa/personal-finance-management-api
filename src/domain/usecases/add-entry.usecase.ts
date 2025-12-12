import { EntryModel, EntryType } from '../models/entry.model';

export interface AddEntryRequest {
  userId: string;
  description: string;
  amount: number;
  date: Date;
  type: EntryType;
  isFixed: boolean;
  isPaid?: boolean;
  categoryId?: string;
}

export interface AddEntryUseCase {
  execute(request: AddEntryRequest): Promise<EntryModel>;
}
