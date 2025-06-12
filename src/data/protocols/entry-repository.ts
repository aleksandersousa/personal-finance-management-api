import { EntryModel, EntryType } from "@domain/models/entry.model";

export interface CreateEntryData {
  userId: string;
  description: string;
  amount: number;
  date: Date;
  type: EntryType;
  isFixed: boolean;
  categoryId?: string | null;
}

export interface EntryRepository {
  create(data: CreateEntryData): Promise<EntryModel>;
  findById(id: string): Promise<EntryModel | null>;
  findByUserId(userId: string): Promise<EntryModel[]>;
  findByUserIdAndMonth(
    userId: string,
    year: number,
    month: number
  ): Promise<EntryModel[]>;
  update(id: string, data: Partial<CreateEntryData>): Promise<EntryModel>;
  delete(id: string): Promise<void>;
}
