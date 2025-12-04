import { Injectable, Inject } from '@nestjs/common';
import { SendEmailParams, EmailSender } from '@data/protocols';

export interface EmailWorkerResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailWorker {
  constructor(
    @Inject('EmailSender')
    private readonly emailSender: EmailSender,
  ) {}

  async processEmail(params: SendEmailParams): Promise<EmailWorkerResult> {
    const result = await this.emailSender.send(params);

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    return {
      success: true,
      messageId: result.messageId,
    };
  }
}
