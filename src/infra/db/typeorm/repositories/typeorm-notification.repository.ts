import { Repository, LessThanOrEqual } from 'typeorm';
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateNotificationData,
  NotificationRepository,
} from '@/data/protocols/repositories';
import { NotificationModel, NotificationStatus } from '@domain/models';
import { NotificationEntity } from '../entities';
import type { Logger, Metrics } from '@/data/protocols';

@Injectable()
export class TypeormNotificationRepository implements NotificationRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
    @Inject('Logger')
    private readonly logger: Logger,
    @Inject('Metrics')
    private readonly metrics: Metrics,
  ) {}

  async create(data: CreateNotificationData): Promise<NotificationModel> {
    const startTime = Date.now();

    try {
      const entity = this.notificationRepository.create({
        entryId: data.entryId,
        userId: data.userId,
        scheduledAt: data.scheduledAt,
        jobId: data.jobId,
        status: NotificationStatus.PENDING,
      });

      const savedNotification = await this.notificationRepository.save(entity);

      const duration = Date.now() - startTime;
      this.logger.logBusinessEvent({
        event: 'notification_created',
        entityId: savedNotification.id,
        userId: data.userId,
        duration,
      });

      this.metrics.recordTransaction('notification_create', 'success');

      return this.mapToModel(savedNotification);
    } catch (error) {
      this.logger.error(
        `Failed to create notification for entry ${data.entryId}`,
        error.stack,
      );
      this.metrics.recordApiError('notification_create', error.message);
      throw error;
    }
  }

  async findById(id: string): Promise<NotificationModel | null> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ['entry', 'user'],
    });
    return notification ? this.mapToModel(notification) : null;
  }

  async findByEntryId(entryId: string): Promise<NotificationModel | null> {
    const notification = await this.notificationRepository.findOne({
      where: { entryId },
      relations: ['entry', 'user'],
      order: { createdAt: 'DESC' },
    });
    return notification ? this.mapToModel(notification) : null;
  }

  async findPendingByScheduledAt(
    beforeDate: Date,
  ): Promise<NotificationModel[]> {
    const notifications = await this.notificationRepository.find({
      where: {
        status: NotificationStatus.PENDING,
        scheduledAt: LessThanOrEqual(beforeDate),
      },
      relations: ['entry', 'user'],
      order: { scheduledAt: 'ASC' },
    });
    return notifications.map(this.mapToModel);
  }

  async updateStatus(
    id: string,
    status: NotificationStatus,
    sentAt?: Date,
  ): Promise<NotificationModel> {
    const startTime = Date.now();

    try {
      const updateData: any = { status };
      if (sentAt) {
        updateData.sentAt = sentAt;
      }

      await this.notificationRepository.update(id, updateData);
      const updatedNotification = await this.notificationRepository.findOne({
        where: { id },
        relations: ['entry', 'user'],
      });

      if (!updatedNotification) {
        throw new Error('Notification not found');
      }

      const duration = Date.now() - startTime;
      this.logger.logBusinessEvent({
        event: 'notification_status_updated',
        entityId: id,
        userId: updatedNotification.userId,
        duration,
        metadata: { status },
      });

      this.metrics.recordTransaction('notification_update_status', 'success');

      return this.mapToModel(updatedNotification);
    } catch (error) {
      this.logger.error(
        `Failed to update notification status ${id}`,
        error.stack,
      );
      this.metrics.recordApiError('notification_update_status', error.message);
      throw error;
    }
  }

  async updateJobId(id: string, jobId: string): Promise<NotificationModel> {
    const startTime = Date.now();

    try {
      await this.notificationRepository.update(id, { jobId });
      const updatedNotification = await this.notificationRepository.findOne({
        where: { id },
        relations: ['entry', 'user'],
      });

      if (!updatedNotification) {
        throw new Error('Notification not found');
      }

      const duration = Date.now() - startTime;
      this.logger.logBusinessEvent({
        event: 'notification_job_id_updated',
        entityId: id,
        userId: updatedNotification.userId,
        duration,
      });

      this.metrics.recordTransaction('notification_update_job_id', 'success');

      return this.mapToModel(updatedNotification);
    } catch (error) {
      this.logger.error(
        `Failed to update notification job ID ${id}`,
        error.stack,
      );
      this.metrics.recordApiError('notification_update_job_id', error.message);
      throw error;
    }
  }

  async cancelByEntryId(entryId: string): Promise<void> {
    const startTime = Date.now();

    try {
      await this.notificationRepository.update(
        { entryId, status: NotificationStatus.PENDING },
        { status: NotificationStatus.CANCELLED },
      );

      const duration = Date.now() - startTime;
      this.logger.logBusinessEvent({
        event: 'notification_cancelled_by_entry',
        metadata: { entryId, duration },
      });

      this.metrics.recordTransaction('notification_cancel_by_entry', 'success');
    } catch (error) {
      this.logger.error(
        `Failed to cancel notifications for entry ${entryId}`,
        error.stack,
      );
      this.metrics.recordApiError(
        'notification_cancel_by_entry',
        error.message,
      );
      throw error;
    }
  }

  async deleteCancelledOlderThan(days: number): Promise<number> {
    const startTime = Date.now();

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await this.notificationRepository
        .createQueryBuilder()
        .delete()
        .from(NotificationEntity)
        .where('status = :status', { status: NotificationStatus.CANCELLED })
        .andWhere('updated_at < :cutoffDate', { cutoffDate })
        .execute();

      const deletedCount = result.affected || 0;

      const duration = Date.now() - startTime;
      this.logger.logBusinessEvent({
        event: 'notification_cleanup_completed',
        metadata: {
          deletedCount,
          olderThanDays: days,
          duration,
        },
      });

      this.metrics.recordTransaction('notification_cleanup', 'success');

      return deletedCount;
    } catch (error) {
      this.logger.error(
        'Failed to cleanup cancelled notifications',
        error.stack,
      );
      this.metrics.recordApiError('notification_cleanup', error.message);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await this.notificationRepository.delete(id);
  }

  private mapToModel(entity: NotificationEntity): NotificationModel {
    return {
      id: entity.id,
      entryId: entity.entryId,
      userId: entity.userId,
      scheduledAt: entity.scheduledAt,
      sentAt: entity.sentAt,
      status: entity.status,
      jobId: entity.jobId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }
}
