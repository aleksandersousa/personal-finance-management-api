import { PaymentModel } from './payment.model';
import { RecurrenceModel } from './recurrence.model';
import { Category } from './category.model';

export interface EntryModel {
  id: string;
  recurrenceId: string | null;
  userId: string;
  categoryId: string | null;
  description: string;
  amount: number;
  issueDate: Date;
  dueDate: Date;
  recurrence?: RecurrenceModel | null;
  payment?: PaymentModel | null;
  category?: Category | null;
  createdAt: Date;
  updatedAt: Date;
  categoryName?: string | null;
}
