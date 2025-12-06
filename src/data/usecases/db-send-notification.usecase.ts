import {
  SendNotificationRequest,
  SendNotificationResponse,
  SendNotificationUseCase,
} from '@domain/usecases/send-notification.usecase';
import { NotificationRepository } from '../protocols/repositories/notification-repository';
import { EntryRepository } from '../protocols/repositories/entry-repository';
import { UserRepository } from '../protocols/repositories/user-repository';
import { EmailSender } from '../protocols/email-sender';
import { NotificationStatus } from '@domain/models/notification.model';
import { EntryNotificationEmailService } from '@/infra/email/services/entry-notification-email-template.service';

export class DbSendNotificationUseCase implements SendNotificationUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly entryRepository: EntryRepository,
    private readonly userRepository: UserRepository,
    private readonly emailSender: EmailSender,
    private readonly emailTemplateService: EntryNotificationEmailService,
  ) {}

  async execute(
    request: SendNotificationRequest,
  ): Promise<SendNotificationResponse> {
    // Get notification
    const notification = await this.notificationRepository.findById(
      request.notificationId,
    );

    if (!notification) {
      throw new Error('Notification not found');
    }

    // Check if already sent or cancelled
    if (notification.status !== NotificationStatus.PENDING) {
      throw new Error(
        `Notification is already ${notification.status.toLowerCase()}`,
      );
    }

    // Get entry and user
    const entry = await this.entryRepository.findById(request.entryId);
    if (!entry) {
      throw new Error('Entry not found');
    }

    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user still has notifications enabled
    if (user.notificationEnabled === false) {
      // Mark as cancelled instead of sending
      await this.notificationRepository.updateStatus(
        notification.id,
        NotificationStatus.CANCELLED,
      );
      return { success: false };
    }

    // Generate email content
    const emailContent = await this.emailTemplateService.generateEmail({
      entry,
      user,
    });

    // Send email
    const emailResult = await this.emailSender.send({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error || 'Failed to send email');
    }

    // Update notification status to SENT
    await this.notificationRepository.updateStatus(
      notification.id,
      NotificationStatus.SENT,
      new Date(),
    );

    return {
      success: true,
      messageId: emailResult.messageId,
    };
  }
}
