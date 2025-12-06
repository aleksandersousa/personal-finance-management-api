import { BaseJobData } from '@domain/contracts';

export interface NotificationCleanupJobData extends BaseJobData {
  olderThanDays?: number;
}
