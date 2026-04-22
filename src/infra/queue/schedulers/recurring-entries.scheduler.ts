import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RecurringEntriesJobData } from '@domain/contracts';
import { CRON_PATTERNS, QUEUE_NAMES } from '@domain/constants';

@Injectable()
export class RecurringEntriesScheduler implements OnModuleInit {
  private readonly logger = new Logger(RecurringEntriesScheduler.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.RECURRING_ENTRIES)
    private readonly recurringEntriesQueue: Queue<RecurringEntriesJobData>,
  ) {}

  async onModuleInit() {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const isWorkerProcess = process.env.IS_WORKER === 'true';
    const shouldSchedule = isDevelopment || isWorkerProcess;

    if (!shouldSchedule) {
      this.logger.log(
        'Skipping recurring entries scheduling - not a worker process. Set IS_WORKER=true to enable.',
      );
      return;
    }

    const cronPattern = CRON_PATTERNS.EVERY_MONTH_ON_DAY_1_AT_1AM;

    try {
      await this.recurringEntriesQueue.add(
        'mirror-monthly-recurring-entries',
        {
          runDate: new Date().toISOString(),
        },
        {
          repeat: {
            pattern: cronPattern,
          },
          jobId: 'monthly-recurring-entries',
        },
      );

      this.logger.log(
        `Recurring entries job scheduled with pattern: ${cronPattern}`,
      );
    } catch (error) {
      if (error.message?.includes('already exists')) {
        this.logger.log('Recurring entries recurring job already exists');
      } else {
        this.logger.error(
          `Failed to schedule recurring entries job: ${error.message}`,
          error.stack,
        );
      }
    }
  }
}
