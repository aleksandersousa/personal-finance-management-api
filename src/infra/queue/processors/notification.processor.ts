import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { NotificationJobData } from '@domain/contracts';
import { QUEUE_NAMES } from '@domain/constants';
import { NotificationWorker } from '@workers/notification.worker';
import { ContextAwareLoggerService } from '@/infra/logging/context-aware-logger.service';

@Processor(QUEUE_NAMES.NOTIFICATION, {
  concurrency: parseInt(process.env.NOTIFICATION_QUEUE_CONCURRENCY || '5', 10),
})
@Injectable()
export class NotificationProcessor extends WorkerHost {
  constructor(
    private readonly notificationWorker: NotificationWorker,
    private readonly logger: ContextAwareLoggerService,
  ) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    const { notificationId, entryId, userId } = job.data;

    this.logger.log(
      `Processing notification job ${job.id} - Notification: ${notificationId}, Entry: ${entryId}, User: ${userId}`,
      'NotificationProcessor',
    );

    try {
      const result = await this.notificationWorker.processNotification(
        notificationId,
        entryId,
        userId,
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to send notification');
      }

      this.logger.log(
        `Notification job ${job.id} completed successfully. Message ID: ${result.messageId}`,
        'NotificationProcessor',
      );
    } catch (error) {
      this.logger.error(
        `Error processing notification job ${job.id}: ${error.message}`,
        error.stack,
        'NotificationProcessor',
      );
      throw error;
    }
  }
}
