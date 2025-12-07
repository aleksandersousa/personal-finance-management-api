import {
  CancelNotificationRequest,
  CancelNotificationResponse,
  CancelNotificationUseCase,
} from '@domain/usecases/cancel-notification.usecase';
import { NotificationRepository } from '../protocols/repositories/notification-repository';
import { NotificationSchedulerService } from '@/infra/notifications/notification-scheduler.service';
import { NotificationStatus } from '@domain/models/notification.model';

export class DbCancelNotificationUseCase implements CancelNotificationUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly notificationScheduler: NotificationSchedulerService,
  ) {}

  async execute(
    request: CancelNotificationRequest,
  ): Promise<CancelNotificationResponse> {
    const notification = await this.notificationRepository.findByEntryId(
      request.entryId,
    );

    if (!notification) {
      return { success: true };
    }

    if (notification.jobId) {
      try {
        await this.notificationScheduler.cancelNotification(notification.jobId);
      } catch (error) {
        console.error(
          `Failed to cancel notification job ${notification.jobId}:`,
          error,
        );
      }
    }

    await this.notificationRepository.updateStatus(
      notification.id,
      NotificationStatus.CANCELLED,
    );

    return { success: true };
  }
}
