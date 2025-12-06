import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { NotificationEntity } from '@infra/db/typeorm/entities/notification.entity';
import { EntryEntity } from '@infra/db/typeorm/entities/entry.entity';
import { makeNotificationRepository } from '@/main/factories/repositories';
import {
  makeCreateNotificationFactory,
  makeCancelNotificationFactory,
  makeSendNotificationFactory,
} from '@/main/factories/usecases/notifications';
import { NotificationSchedulerService } from '@/infra/notifications/notification-scheduler.service';
import { EntryNotificationEmailService } from '@/infra/email/services/entry-notification-email-template.service';
import { QueueClientModule } from '@/infra/queue/queue-client.module';
import { NotificationProcessor } from '@/infra/queue/processors/notification.processor';
import { NotificationWorker } from '@/workers/notification.worker';
import { EmailModule } from './email.module';
import { ObservabilityModule } from './observability.module';
import { AuthModule } from './auth.module';
import { EntryModule } from './entry.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity, EntryEntity]),
    QueueClientModule,
    EmailModule,
    ObservabilityModule,
    AuthModule,
    forwardRef(() => EntryModule),
  ],
  providers: [
    {
      provide: 'NotificationRepository',
      useFactory: makeNotificationRepository,
      inject: [getRepositoryToken(NotificationEntity), 'Logger', 'Metrics'],
    },
    NotificationSchedulerService,
    EntryNotificationEmailService,
    NotificationWorker,
    NotificationProcessor,
    {
      provide: 'CreateNotificationUseCase',
      useFactory: makeCreateNotificationFactory,
      inject: ['NotificationRepository', NotificationSchedulerService],
    },
    {
      provide: 'CancelNotificationUseCase',
      useFactory: makeCancelNotificationFactory,
      inject: ['NotificationRepository', NotificationSchedulerService],
    },
    {
      provide: 'SendNotificationUseCase',
      useFactory: makeSendNotificationFactory,
      inject: [
        'NotificationRepository',
        'EntryRepository',
        'UserRepository',
        'EmailSender',
        EntryNotificationEmailService,
      ],
    },
  ],
  exports: [
    'CreateNotificationUseCase',
    'CancelNotificationUseCase',
    'SendNotificationUseCase',
    'NotificationRepository',
  ],
})
export class NotificationModule {}
