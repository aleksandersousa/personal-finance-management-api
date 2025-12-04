import { Module } from '@nestjs/common';
import { MailgunEmailSender } from '@infra/implementations/mailgun-email-sender';
import { QueuedEmailSender } from '@infra/implementations/queued-email-sender';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { QueueClientModule } from '@infra/queue/queue-client.module';

@Module({
  imports: [QueueClientModule],
  providers: [
    {
      provide: 'EmailSender',
      useClass: QueuedEmailSender,
    },
    {
      provide: 'Logger',
      useClass: ContextAwareLoggerService,
    },
    // Keep MailgunEmailSender available for the processor
    MailgunEmailSender,
  ],
  exports: ['EmailSender', MailgunEmailSender],
})
export class EmailModule {}
