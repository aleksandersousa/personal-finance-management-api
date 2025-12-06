import { NotificationEntity } from '@/infra/db/typeorm/entities/notification.entity';
import { TypeormNotificationRepository } from '@/infra/db/typeorm/repositories/typeorm-notification.repository';
import type { Repository } from 'typeorm';
import type { Logger, Metrics } from '@/data/protocols';

export const makeNotificationRepository = (
  notificationRepository: Repository<NotificationEntity>,
  logger: Logger,
  metrics: Metrics,
) => {
  return new TypeormNotificationRepository(
    notificationRepository,
    logger,
    metrics,
  );
};
