import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { TokenCleanupJobData } from '@domain/contracts';
import { QUEUE_NAMES } from '@domain/constants';
import { ScheduledTasksWorker } from '@workers/scheduled-tasks.worker';
import { ContextAwareLoggerService } from '@/infra/logging/context-aware-logger.service';

@Processor(QUEUE_NAMES.TOKEN_CLEANUP)
@Injectable()
export class TokenCleanupProcessor extends WorkerHost {
  constructor(
    private readonly scheduledTasksWorker: ScheduledTasksWorker,
    private readonly logger: ContextAwareLoggerService,
  ) {
    super();
  }

  async process(job: Job<TokenCleanupJobData>): Promise<void> {
    const { tokenType } = job.data;

    this.logger.log(
      `Processing token cleanup job ${job.id} - Type: ${tokenType}`,
      'TokenCleanupProcessor',
    );

    try {
      const result = await this.scheduledTasksWorker.cleanupExpiredTokens({
        tokenType,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to cleanup tokens');
      }

      this.logger.log(
        `Token cleanup job ${job.id} completed successfully. Cleaned types: ${result.cleanedTypes.join(', ')}`,
        'TokenCleanupProcessor',
      );
    } catch (error) {
      this.logger.error(
        `Error processing token cleanup job ${job.id}: ${error.message}`,
        error.stack,
        'TokenCleanupProcessor',
      );
      throw error;
    }
  }
}
