import { EntryModel, EntryType } from '../models/entry.model';

export interface UpdateEntryRequest {
  id: string;
  userId: string;
  description: string;
  amount: number;
  date: Date;
  type: EntryType;
  isFixed: boolean;
  categoryId?: string;
}

export interface UpdateEntryUseCase {
  execute(request: UpdateEntryRequest): Promise<EntryModel>;
}
