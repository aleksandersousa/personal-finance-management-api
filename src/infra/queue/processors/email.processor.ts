import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { EmailJobData } from '@domain/contracts';
import { QUEUE_NAMES } from '@domain/constants';
import { EmailWorker } from '@workers/email.worker';
import { ContextAwareLoggerService } from '@/infra/logging/context-aware-logger.service';

@Processor(QUEUE_NAMES.EMAIL, {
  concurrency: parseInt(process.env.EMAIL_QUEUE_CONCURRENCY || '5', 10),
})
@Injectable()
export class EmailProcessor extends WorkerHost {
  constructor(
    private readonly emailWorker: EmailWorker,
    private readonly logger: ContextAwareLoggerService,
  ) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<void> {
    const { emailParams, emailType } = job.data;

    this.logger.log(
      `Processing email job ${job.id} - Type: ${emailType || 'unknown'}, To: ${Array.isArray(emailParams.to) ? emailParams.to.join(', ') : emailParams.to}`,
      'EmailProcessor',
    );

    try {
      const result = await this.emailWorker.processEmail(emailParams);

      this.logger.log(
        `Email job ${job.id} completed successfully. Message ID: ${result.messageId}`,
        'EmailProcessor',
      );
    } catch (error) {
      this.logger.error(
        `Error processing email job ${job.id}: ${error.message}`,
        error.stack,
        'EmailProcessor',
      );
      throw error;
    }
  }
}
