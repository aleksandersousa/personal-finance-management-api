import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { RecurringEntriesJobData } from '@domain/contracts';
import { QUEUE_NAMES } from '@domain/constants';
import { ScheduledTasksWorker } from '@workers/scheduled-tasks.worker';
import { ContextAwareLoggerService } from '@/infra/logging/context-aware-logger.service';

@Processor(QUEUE_NAMES.RECURRING_ENTRIES)
@Injectable()
export class RecurringEntriesProcessor extends WorkerHost {
  constructor(
    private readonly scheduledTasksWorker: ScheduledTasksWorker,
    private readonly logger: ContextAwareLoggerService,
  ) {
    super();
  }

  async process(job: Job<RecurringEntriesJobData>): Promise<void> {
    this.logger.log(
      `Processing recurring entries job ${job.id}`,
      'RecurringEntriesProcessor',
    );

    try {
      const result =
        await this.scheduledTasksWorker.mirrorMonthlyRecurringEntries({
          runDate: job.data.runDate,
        });

      if (!result.success) {
        throw new Error(result.error || 'Failed to mirror recurring entries');
      }

      this.logger.log(
        `Recurring entries job ${job.id} completed successfully. Created: ${result.createdCount}, skipped: ${result.skippedCount}`,
        'RecurringEntriesProcessor',
      );
    } catch (error) {
      this.logger.error(
        `Error processing recurring entries job ${job.id}: ${error.message}`,
        error.stack,
        'RecurringEntriesProcessor',
      );
      throw error;
    }
  }
}
