import { Module } from '@nestjs/common';
import { QueueModule } from '@infra/queue/queue.module';
import { TokenCleanupScheduler } from '@infra/queue/schedulers/token-cleanup.scheduler';

@Module({
  imports: [QueueModule],
  providers: [TokenCleanupScheduler],
  exports: [QueueModule],
})
export class AppQueueModule {}
