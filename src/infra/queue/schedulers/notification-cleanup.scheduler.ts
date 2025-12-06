import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationCleanupJobData } from '@domain/contracts';
import { CRON_PATTERNS, QUEUE_NAMES } from '@domain/constants';

@Injectable()
export class NotificationCleanupScheduler implements OnModuleInit {
  private readonly logger = new Logger(NotificationCleanupScheduler.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.TOKEN_CLEANUP)
    private readonly tokenCleanupQueue: Queue<NotificationCleanupJobData>,
  ) {}

  async onModuleInit() {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const isWorkerProcess = process.env.IS_WORKER === 'true';
    const shouldSchedule = isDevelopment || isWorkerProcess;

    if (!shouldSchedule) {
      this.logger.log(
        'Skipping notification cleanup scheduling - not a worker process. Set IS_WORKER=true to enable.',
      );
      return;
    }

    const cronPattern = CRON_PATTERNS.EVERY_MONTH_AT_2AM;

    try {
      await this.tokenCleanupQueue.add(
        'cleanup-cancelled-notifications',
        {
          olderThanDays: 30,
        },
        {
          repeat: {
            pattern: cronPattern,
          },
          jobId: 'notification-cleanup-recurring',
        },
      );

      this.logger.log(
        `Notification cleanup recurring job scheduled with pattern: ${cronPattern}`,
      );
    } catch (error) {
      if (error.message?.includes('already exists')) {
        this.logger.log('Notification cleanup recurring job already exists');
      } else {
        this.logger.error(
          `Failed to schedule notification cleanup job: ${error.message}`,
          error.stack,
        );
      }
    }
  }
}
