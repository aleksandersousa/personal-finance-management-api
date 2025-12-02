import { Module } from '@nestjs/common';
import { MailgunEmailSender } from '@infra/implementations/mailgun-email-sender';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';

@Module({
  providers: [
    {
      provide: 'EmailSender',
      useClass: MailgunEmailSender,
    },
    {
      provide: 'Logger',
      useClass: ContextAwareLoggerService,
    },
  ],
  exports: ['EmailSender'],
})
export class EmailModule {}
