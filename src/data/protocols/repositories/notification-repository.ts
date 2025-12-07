import { NotificationModel, NotificationStatus } from '@domain/models';

export interface CreateNotificationData {
  entryId: string;
  userId: string;
  scheduledAt: Date;
  jobId?: string | null;
}

export interface NotificationRepository {
  create(data: CreateNotificationData): Promise<NotificationModel>;
  findById(id: string): Promise<NotificationModel | null>;
  findByEntryId(entryId: string): Promise<NotificationModel | null>;
  findPendingByScheduledAt(beforeDate: Date): Promise<NotificationModel[]>;
  updateStatus(
    id: string,
    status: NotificationStatus,
    sentAt?: Date,
  ): Promise<NotificationModel>;
  updateJobId(id: string, jobId: string): Promise<NotificationModel>;
  cancelByEntryId(entryId: string): Promise<void>;
  deleteCancelledOlderThan(days: number): Promise<number>;
  delete(id: string): Promise<void>;
}
