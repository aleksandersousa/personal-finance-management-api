import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EmailSender, SendEmailParams, SendEmailResult } from '@data/protocols';
import { QUEUE_NAMES } from '@domain/constants';
import { EmailJobData, type EmailType } from '@domain/contracts';

@Injectable()
export class QueuedEmailSender implements EmailSender {
  private readonly logger = new Logger(QueuedEmailSender.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.EMAIL)
    private readonly emailQueue: Queue<EmailJobData>,
  ) {}

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    try {
      // Determine email type from subject or other params
      const emailType: EmailType = this.determineEmailType(params);

      const jobData: EmailJobData = {
        emailParams: params,
        emailType,
        metadata: {
          enqueuedAt: new Date().toISOString(),
          recipient: Array.isArray(params.to)
            ? params.to.join(', ')
            : params.to,
        },
      };

      const job = await this.emailQueue.add('send-email', jobData, {
        priority: this.getEmailPriority(emailType),
      });

      this.logger.log(
        `Email job enqueued: ${job.id} - Type: ${emailType}, To: ${Array.isArray(params.to) ? params.to.join(', ') : params.to}`,
      );

      return {
        success: true,
        messageId: job.id,
      };
    } catch (error) {
      this.logger.error(
        `Failed to enqueue email: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private determineEmailType(params: SendEmailParams): EmailType {
    const subject = params.subject?.toLowerCase() || '';

    if (subject.includes('verificação') || subject.includes('verification')) {
      return 'verification';
    }
    if (subject.includes('senha') || subject.includes('password')) {
      return 'password-reset';
    }
    if (subject.includes('bem-vindo') || subject.includes('welcome')) {
      return 'welcome';
    }

    return 'generic';
  }

  private getEmailPriority(emailType: EmailType): number {
    // Higher priority for critical emails
    const priorities: Record<EmailType, number> = {
      'password-reset': 10,
      verification: 5,
      welcome: 3,
      generic: 1,
    };

    return priorities[emailType] || 1;
  }
}
