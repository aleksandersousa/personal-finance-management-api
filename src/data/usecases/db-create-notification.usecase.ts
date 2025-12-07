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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`Scheduled time: ${scheduledAt}`);
    console.log(`new Date(): ${today}`);

    // Don't schedule if the time has already passed
    if (scheduledAt < today) {
      throw new Error('Cannot schedule notification in the past');
    }

    const notification = await this.notificationRepository.create({
      entryId: request.entryId,
      userId: request.userId,
      scheduledAt,
      jobId: null,
    });

    const { jobId } = await this.notificationScheduler.scheduleNotification(
      notification.id,
      request.entry,
      request.userId,
      scheduledAt,
    );

    // Update notification with job ID
    const updatedNotification = await this.notificationRepository.updateJobId(
      notification.id,
      jobId,
    );

    return {
      notification: updatedNotification,
    };
  }
}
