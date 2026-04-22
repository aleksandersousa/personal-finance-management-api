import { BaseJobData } from '@domain/contracts';

export interface RecurringEntriesJobData extends BaseJobData {
  runDate: string;
}
