import { Module } from '@nestjs/common';
import { QueueModule } from '@infra/queue/queue.module';
import { TokenCleanupScheduler } from '@infra/queue/schedulers/token-cleanup.scheduler';
import { NotificationCleanupScheduler } from '@infra/queue/schedulers/notification-cleanup.scheduler';

@Module({
  imports: [QueueModule],
  providers: [TokenCleanupScheduler, NotificationCleanupScheduler],
  exports: [QueueModule],
})
export class AppQueueModule {}
