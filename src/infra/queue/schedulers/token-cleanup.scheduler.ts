import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TokenCleanupJobData } from '@domain/contracts';
import { CRON_PATTERNS, QUEUE_NAMES } from '@domain/constants';

@Injectable()
export class TokenCleanupScheduler implements OnModuleInit {
  private readonly logger = new Logger(TokenCleanupScheduler.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.TOKEN_CLEANUP)
    private readonly tokenCleanupQueue: Queue<TokenCleanupJobData>,
  ) {}

  async onModuleInit() {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const isWorkerProcess = process.env.IS_WORKER === 'true';
    const shouldSchedule = isDevelopment || isWorkerProcess;

    if (!shouldSchedule) {
      this.logger.log(
        'Skipping token cleanup scheduling - not a worker process. Set IS_WORKER=true to enable.',
      );
      return;
    }

    const cronPattern = CRON_PATTERNS.EVERY_MONTH_AT_2AM;

    try {
      await this.tokenCleanupQueue.add(
        'cleanup-expired-tokens',
        {
          tokenType: 'all',
        },
        {
          repeat: {
            pattern: cronPattern,
          },
          jobId: 'token-cleanup-recurring',
        },
      );

      this.logger.log(
        `Token cleanup recurring job scheduled with pattern: ${cronPattern}`,
      );
    } catch (error) {
      if (error.message?.includes('already exists')) {
        this.logger.log('Token cleanup recurring job already exists');
      } else {
        this.logger.error(
          `Failed to schedule token cleanup job: ${error.message}`,
          error.stack,
        );
      }
    }
  }
}
