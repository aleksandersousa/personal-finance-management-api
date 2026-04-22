import { Module } from '@nestjs/common';
import { QueueModule } from '@infra/queue/queue.module';
import { TokenCleanupScheduler } from '@infra/queue/schedulers/token-cleanup.scheduler';
import { NotificationCleanupScheduler } from '@infra/queue/schedulers/notification-cleanup.scheduler';
import { RecurringEntriesScheduler } from '@infra/queue/schedulers/recurring-entries.scheduler';

@Module({
  imports: [QueueModule],
  providers: [
    TokenCleanupScheduler,
    NotificationCleanupScheduler,
    RecurringEntriesScheduler,
  ],
  exports: [QueueModule],
})
export class AppQueueModule {}
