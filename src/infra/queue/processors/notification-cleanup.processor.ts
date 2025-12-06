import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { NotificationCleanupJobData } from '@domain/contracts';
import { QUEUE_NAMES } from '@domain/constants';
import { ScheduledTasksWorker } from '@workers/scheduled-tasks.worker';
import { ContextAwareLoggerService } from '@/infra/logging/context-aware-logger.service';

@Processor(QUEUE_NAMES.TOKEN_CLEANUP)
@Injectable()
export class NotificationCleanupProcessor extends WorkerHost {
  constructor(
    private readonly scheduledTasksWorker: ScheduledTasksWorker,
    private readonly logger: ContextAwareLoggerService,
  ) {
    super();
  }

  async process(job: Job<NotificationCleanupJobData>): Promise<void> {
    const { olderThanDays } = job.data;

    this.logger.log(
      `Processing notification cleanup job ${job.id} - Older than: ${olderThanDays || 30} days`,
      'NotificationCleanupProcessor',
    );

    try {
      const result =
        await this.scheduledTasksWorker.cleanupCancelledNotifications({
          olderThanDays,
        });

      if (!result.success) {
        throw new Error(result.error || 'Failed to cleanup notifications');
      }

      this.logger.log(
        `Notification cleanup job ${job.id} completed successfully. Deleted: ${result.deletedCount} notifications`,
        'NotificationCleanupProcessor',
      );
    } catch (error) {
      this.logger.error(
        `Error processing notification cleanup job ${job.id}: ${error.message}`,
        error.stack,
        'NotificationCleanupProcessor',
      );
      throw error;
    }
  }
}
