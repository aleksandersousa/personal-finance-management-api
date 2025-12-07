import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { subMinutes } from 'date-fns';
import { EntryModel } from '@domain/models/entry.model';
import { UserModel } from '@domain/models/user.model';
import { NotificationJobData } from '@domain/contracts';
import { QUEUE_NAMES } from '@domain/constants';

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.NOTIFICATION)
    private readonly notificationQueue: Queue<NotificationJobData>,
  ) {}

  calculateScheduledTime(entry: EntryModel, user: UserModel): Date {
    const notificationMinutes =
      entry.notificationTimeMinutes ?? user.notificationTimeMinutes ?? 5;

    // Get user's timezone (default to America/Sao_Paulo if not set)
    const userTimezone = user.timezone || 'America/Sao_Paulo';

    this.logger.log(
      `Calculating scheduled time: entry.date=${entry.date.toISOString()}, userTimezone=${userTimezone}, notificationMinutes=${notificationMinutes}`,
    );

    const entryDateInUserTimezone = toZonedTime(entry.date, userTimezone);

    this.logger.log(
      `Entry date in user timezone: ${entryDateInUserTimezone.toISOString()}`,
    );

    // Calculate scheduled time in user's timezone (subtract notification minutes)
    const scheduledAtInUserTimezone = subMinutes(
      entryDateInUserTimezone,
      notificationMinutes,
    );

    this.logger.log(
      `Scheduled time in user timezone: ${scheduledAtInUserTimezone.toISOString()}`,
    );

    const scheduledAt = fromZonedTime(scheduledAtInUserTimezone, userTimezone);

    this.logger.log(`Final scheduled time (UTC): ${scheduledAt.toISOString()}`);

    return scheduledAt;
  }

  async scheduleNotification(
    notificationId: string,
    entry: EntryModel,
    userId: string,
    scheduledAt: Date,
  ): Promise<{ jobId: string; scheduledAt: Date }> {
    try {
      const now = new Date();
      const delay = Math.max(0, scheduledAt.getTime() - now.getTime());

      const jobData: NotificationJobData = {
        notificationId,
        entryId: entry.id,
        userId,
        metadata: {
          scheduledAt: scheduledAt.toISOString(),
          entryDescription: entry.description,
          entryAmount: entry.amount,
          entryDate: entry.date.toISOString(),
        },
      };

      const job = await this.notificationQueue.add(
        'send-notification',
        jobData,
        {
          delay, // Delay in milliseconds
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      this.logger.log(
        `Notification job scheduled: ${job.id} for entry ${entry.id}, scheduled at ${scheduledAt.toISOString()}`,
      );

      return {
        jobId: job.id!,
        scheduledAt,
      };
    } catch (error) {
      this.logger.error(
        `Failed to schedule notification for entry ${entry.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async cancelNotification(jobId: string): Promise<void> {
    try {
      const job = await this.notificationQueue.getJob(jobId);
      if (job) {
        await job.remove();
        this.logger.log(`Notification job ${jobId} cancelled`);
      } else {
        this.logger.warn(`Notification job ${jobId} not found`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to cancel notification job ${jobId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
