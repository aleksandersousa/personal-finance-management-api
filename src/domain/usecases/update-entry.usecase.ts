import { EntryModel } from '../models/entry.model';

export interface UpdateEntryRequest {
  id: string;
  userId: string;
  description: string;
  amount: number;
  categoryId: string;
  issueDate: Date;
  dueDate: Date;
  recurrenceId?: string | null;
}

export interface UpdateEntryUseCase {
  execute(request: UpdateEntryRequest): Promise<EntryModel>;
}
