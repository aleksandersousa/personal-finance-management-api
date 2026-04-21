import { EntryModel } from '../models/entry.model';

export interface AddEntryRequest {
  userId: string;
  description: string;
  amount: number;
  categoryId: string;
  issueDate: Date;
  dueDate: Date;
  recurrenceId?: string | null;
}

export interface AddEntryUseCase {
  execute(request: AddEntryRequest): Promise<EntryModel>;
}
