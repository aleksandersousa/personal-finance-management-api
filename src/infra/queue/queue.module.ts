import { Module, forwardRef } from '@nestjs/common';
import { QueueClientModule } from './queue-client.module';
import { EmailProcessor } from './processors/email.processor';
import { TokenCleanupProcessor } from './processors/token-cleanup.processor';
import { EmailWorker } from '@workers/email.worker';
import { ScheduledTasksWorker } from '@workers/scheduled-tasks.worker';
import { EmailModule } from '@main/modules/email.module';
import { AuthModule } from '@main/modules/auth.module';
import { MailgunEmailSender } from '@infra/implementations/mailgun-email-sender';

@Module({
  imports: [
    QueueClientModule,
    // Use forwardRef to handle circular dependency with EmailModule
    forwardRef(() => EmailModule),
    forwardRef(() => AuthModule),
  ],
  providers: [
    {
      provide: 'EmailSender',
      useClass: MailgunEmailSender,
    },

    EmailWorker,
    ScheduledTasksWorker,

    EmailProcessor,
    TokenCleanupProcessor,
  ],
  exports: [QueueClientModule],
})
export class QueueModule {}
