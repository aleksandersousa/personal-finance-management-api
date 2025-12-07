import { NotificationRepository } from '@/data/protocols/repositories/notification-repository';
import {
  NotificationModel,
  NotificationStatus,
} from '@domain/models/notification.model';

/**
 * NotificationRepository Stub for Data Layer Testing
 * Provides controllable implementations for testing business logic
 */
export class NotificationRepositoryStub implements NotificationRepository {
  private notifications: Map<string, NotificationModel> = new Map();
  private shouldFail = false;
  private errorToThrow: Error | null = null;
  private nextId = 1;

  async create(data: {
    entryId: string;
    userId: string;
    scheduledAt: Date;
    jobId?: string | null;
  }): Promise<NotificationModel> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const notification: NotificationModel = {
      id: `stub-notification-${Date.now()}-${this.nextId++}`,
      entryId: data.entryId,
      userId: data.userId,
      scheduledAt: data.scheduledAt,
      jobId: data.jobId ?? null,
      status: NotificationStatus.PENDING,
      sentAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    this.notifications.set(notification.id, notification);
    return notification;
  }

  async findById(id: string): Promise<NotificationModel | null> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    return this.notifications.get(id) || null;
  }

  async findByEntryId(entryId: string): Promise<NotificationModel | null> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    const notifications = Array.from(this.notifications.values()).filter(
      n => n.entryId === entryId,
    );
    return notifications.length > 0 ? notifications[0] : null;
  }

  async findPendingByScheduledAt(
    beforeDate: Date,
  ): Promise<NotificationModel[]> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    return Array.from(this.notifications.values()).filter(
      n =>
        n.status === NotificationStatus.PENDING && n.scheduledAt <= beforeDate,
    );
  }

  async updateStatus(
    id: string,
    status: NotificationStatus,
    sentAt?: Date,
  ): Promise<NotificationModel> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const notification = this.notifications.get(id);
    if (!notification) {
      throw new Error('Notification not found');
    }

    const updated: NotificationModel = {
      ...notification,
      status,
      sentAt: sentAt ?? notification.sentAt,
      updatedAt: new Date(),
    };

    this.notifications.set(id, updated);
    return updated;
  }

  async updateJobId(id: string, jobId: string): Promise<NotificationModel> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const notification = this.notifications.get(id);
    if (!notification) {
      throw new Error('Notification not found');
    }

    const updated: NotificationModel = {
      ...notification,
      jobId,
      updatedAt: new Date(),
    };

    this.notifications.set(id, updated);
    return updated;
  }

  async cancelByEntryId(entryId: string): Promise<void> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const notifications = Array.from(this.notifications.values()).filter(
      n => n.entryId === entryId && n.status === NotificationStatus.PENDING,
    );

    notifications.forEach(n => {
      const updated: NotificationModel = {
        ...n,
        status: NotificationStatus.CANCELLED,
        updatedAt: new Date(),
      };
      this.notifications.set(n.id, updated);
    });
  }

  async deleteCancelledOlderThan(days: number): Promise<number> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let deletedCount = 0;
    for (const [id, notification] of this.notifications.entries()) {
      if (
        notification.status === NotificationStatus.CANCELLED &&
        notification.updatedAt < cutoffDate
      ) {
        this.notifications.delete(id);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  async delete(id: string): Promise<void> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    this.notifications.delete(id);
  }

  // Test helper methods
  seed(notifications: NotificationModel[]): void {
    notifications.forEach(n => this.notifications.set(n.id, n));
  }

  clear(): void {
    this.notifications.clear();
    this.shouldFail = false;
    this.errorToThrow = null;
    this.nextId = 1;
  }

  mockFailure(error: Error): void {
    this.shouldFail = true;
    this.errorToThrow = error;
  }

  getAll(): NotificationModel[] {
    return Array.from(this.notifications.values());
  }
}
