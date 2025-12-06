import type { NotificationRepository } from '@/data/protocols/repositories/notification-repository';
import { DbCancelNotificationUseCase } from '@/data/usecases/db-cancel-notification.usecase';
import type { NotificationSchedulerService } from '@/infra/notifications/notification-scheduler.service';

export const makeCancelNotificationFactory = (
  notificationRepository: NotificationRepository,
  notificationScheduler: NotificationSchedulerService,
) => {
  return new DbCancelNotificationUseCase(
    notificationRepository,
    notificationScheduler,
  );
};
