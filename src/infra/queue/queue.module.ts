import { Module, forwardRef } from '@nestjs/common';
import { QueueClientModule } from './queue-client.module';
import { EmailProcessor } from './processors/email.processor';
import { TokenCleanupProcessor } from './processors/token-cleanup.processor';
import { NotificationCleanupProcessor } from './processors/notification-cleanup.processor';
import { RecurringEntriesProcessor } from './processors/recurring-entries.processor';
import { EmailWorker } from '@workers/email.worker';
import { ScheduledTasksWorker } from '@workers/scheduled-tasks.worker';
import { EmailModule } from '@main/modules/email.module';
import { AuthModule } from '@main/modules/auth.module';
import { NotificationModule } from '@main/modules/notification.module';
import { EntryModule } from '@main/modules/entry.module';
import { MailgunEmailSender } from '@infra/implementations/mailgun-email-sender';

@Module({
  imports: [
    QueueClientModule,
    // Use forwardRef to handle circular dependency with EmailModule
    forwardRef(() => EmailModule),
    forwardRef(() => AuthModule),
    forwardRef(() => NotificationModule),
    forwardRef(() => EntryModule),
  ],
  providers: [
    {
      provide: 'EmailSender',
      useClass: MailgunEmailSender,
    },

    EmailWorker,
    {
      provide: ScheduledTasksWorker,
      useFactory: (
        emailVerificationTokenRepository,
        passwordResetTokenRepository,
        entryRepository,
        notificationRepository?,
      ) => {
        return new ScheduledTasksWorker(
          emailVerificationTokenRepository,
          passwordResetTokenRepository,
          entryRepository,
          notificationRepository,
        );
      },
      inject: [
        'EmailVerificationTokenRepository',
        'PasswordResetTokenRepository',
        'EntryRepository',
        { token: 'NotificationRepository', optional: true },
      ],
    },

    EmailProcessor,
    TokenCleanupProcessor,
    NotificationCleanupProcessor,
    RecurringEntriesProcessor,
  ],
  exports: [QueueClientModule],
})
export class QueueModule {}
