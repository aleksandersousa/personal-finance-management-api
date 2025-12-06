import { BaseJobData } from '@domain/contracts';

export interface NotificationJobData extends BaseJobData {
  notificationId: string;
  entryId: string;
  userId: string;
}
