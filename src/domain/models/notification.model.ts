export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  CANCELLED = 'CANCELLED',
}

export interface NotificationModel {
  id: string;
  entryId: string;
  userId: string;
  scheduledAt: Date;
  sentAt?: Date | null;
  status: NotificationStatus;
  jobId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
