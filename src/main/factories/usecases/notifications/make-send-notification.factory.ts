import type {
  NotificationRepository,
  EntryRepository,
  UserRepository,
  EmailSender,
} from '@/data/protocols';
import { DbSendNotificationUseCase } from '@/data/usecases/db-send-notification.usecase';
import type { EntryNotificationEmailService } from '@/infra/email/services/entry-notification-email-template.service';

export const makeSendNotificationFactory = (
  notificationRepository: NotificationRepository,
  entryRepository: EntryRepository,
  userRepository: UserRepository,
  emailSender: EmailSender,
  emailTemplateService: EntryNotificationEmailService,
) => {
  return new DbSendNotificationUseCase(
    notificationRepository,
    entryRepository,
    userRepository,
    emailSender,
    emailTemplateService,
  );
};
