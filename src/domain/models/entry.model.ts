export type EntryType = 'INCOME' | 'EXPENSE';

export interface EntryModel {
  id: string;
  userId: string;
  description: string;
  amount: number;
  date: Date;
  type: EntryType;
  isFixed: boolean;
  categoryId?: string | null;
  categoryName?: string | null;
  notificationTimeMinutes?: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
