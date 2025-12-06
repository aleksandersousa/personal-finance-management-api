import {
  CreateNotificationRequest,
  CreateNotificationResponse,
  CreateNotificationUseCase,
} from '@domain/usecases/create-notification.usecase';
import { NotificationRepository } from '../protocols/repositories/notification-repository';
import { NotificationSchedulerService } from '@/infra/notifications/notification-scheduler.service';

export class DbCreateNotificationUseCase implements CreateNotificationUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly notificationScheduler: NotificationSchedulerService,
  ) {}

  async execute(
    request: CreateNotificationRequest,
  ): Promise<CreateNotificationResponse> {
    // Check if user has notifications enabled
    if (request.user.notificationEnabled === false) {
      throw new Error('User has notifications disabled');
    }

    // Calculate scheduled time using the full entry and user models
    const scheduledAt = this.notificationScheduler.calculateScheduledTime(
      request.entry,
      request.user,
    );

    // Don't schedule if the time has already passed
    if (scheduledAt <= new Date()) {
      throw new Error('Cannot schedule notification in the past');
    }

    // Schedule the job in BullMQ first to get the job ID
    const { jobId } = await this.notificationScheduler.scheduleNotification(
      '', // Will be updated after creation
      request.entry,
      request.userId,
      scheduledAt,
    );

    // Create notification record with job ID
    const notification = await this.notificationRepository.create({
      entryId: request.entryId,
      userId: request.userId,
      scheduledAt,
      jobId,
    });

    return {
      notification,
    };
  }
}
