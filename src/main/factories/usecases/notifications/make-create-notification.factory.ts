import type { NotificationRepository } from '@/data/protocols/repositories/notification-repository';
import { DbCreateNotificationUseCase } from '@/data/usecases/db-create-notification.usecase';
import type { NotificationSchedulerService } from '@/infra/notifications/notification-scheduler.service';

export const makeCreateNotificationFactory = (
  notificationRepository: NotificationRepository,
  notificationScheduler: NotificationSchedulerService,
) => {
  return new DbCreateNotificationUseCase(
    notificationRepository,
    notificationScheduler,
  );
};
