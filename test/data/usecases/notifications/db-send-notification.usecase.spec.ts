import { DbSendNotificationUseCase } from '@data/usecases/db-send-notification.usecase';
import {
  NotificationRepositoryStub,
  EntryRepositoryStub,
  UserRepositoryStub,
} from '@test/data/mocks/repositories';
import { EmailSenderStub } from '@test/data/mocks/protocols/email-sender.stub';
import { EntryNotificationEmailService } from '@infra/email/services/entry-notification-email-template.service';
import { MockEntryFactory, MockUserFactory } from '@test/domain/mocks/models';
import {
  NotificationModel,
  NotificationStatus,
} from '@domain/models/notification.model';

describe('DbSendNotificationUseCase', () => {
  let useCase: DbSendNotificationUseCase;
  let notificationRepositoryStub: NotificationRepositoryStub;
  let entryRepositoryStub: EntryRepositoryStub;
  let userRepositoryStub: UserRepositoryStub;
  let emailSenderStub: EmailSenderStub;
  let emailTemplateService: jest.Mocked<EntryNotificationEmailService>;

  beforeEach(() => {
    notificationRepositoryStub = new NotificationRepositoryStub();
    entryRepositoryStub = new EntryRepositoryStub();
    userRepositoryStub = new UserRepositoryStub();
    emailSenderStub = new EmailSenderStub();
    emailTemplateService = {
      generateEmail: jest.fn(),
    } as any;

    useCase = new DbSendNotificationUseCase(
      notificationRepositoryStub,
      entryRepositoryStub,
      userRepositoryStub,
      emailSenderStub,
      emailTemplateService,
    );
  });

  afterEach(() => {
    notificationRepositoryStub.clear();
    entryRepositoryStub.clear();
    userRepositoryStub.clear();
    emailSenderStub.clear();
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should send notification successfully', async () => {
      // Arrange
      const entry = MockEntryFactory.create({ id: 'entry-123' });
      const user = MockUserFactory.create({
        id: 'user-123',
        notificationEnabled: true,
      });
      const notification: NotificationModel = {
        id: 'notification-123',
        entryId: 'entry-123',
        userId: 'user-123',
        scheduledAt: new Date('2024-01-15T10:00:00Z'),
        status: NotificationStatus.PENDING,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      notificationRepositoryStub.seed([notification]);
      entryRepositoryStub.seed([entry]);
      userRepositoryStub.seed([user]);

      emailTemplateService.generateEmail.mockResolvedValue({
        subject: 'Test Subject',
        html: '<html>Test</html>',
        text: 'Test',
      });
      emailSenderStub.mockSuccess();

      const updateStatusSpy = jest.spyOn(
        notificationRepositoryStub,
        'updateStatus',
      );

      // Act
      const result = await useCase.execute({
        notificationId: 'notification-123',
        entryId: 'entry-123',
        userId: 'user-123',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(emailTemplateService.generateEmail).toHaveBeenCalledWith({
        entry,
        user,
      });
      expect(emailSenderStub.getEmailCount()).toBe(1);
      expect(updateStatusSpy).toHaveBeenCalledWith(
        'notification-123',
        NotificationStatus.SENT,
        expect.any(Date),
      );
    });

    it('should throw error when notification not found', async () => {
      // Arrange
      // No notification seeded

      // Act & Assert
      await expect(
        useCase.execute({
          notificationId: 'non-existent',
          entryId: 'entry-123',
          userId: 'user-123',
        }),
      ).rejects.toThrow('Notification not found');
    });

    it('should throw error when notification is already sent or cancelled', async () => {
      // Arrange
      const sentNotification: NotificationModel = {
        id: 'notification-sent',
        entryId: 'entry-123',
        userId: 'user-123',
        scheduledAt: new Date('2024-01-15T10:00:00Z'),
        status: NotificationStatus.SENT,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const cancelledNotification: NotificationModel = {
        id: 'notification-cancelled',
        entryId: 'entry-456',
        userId: 'user-123',
        scheduledAt: new Date('2024-01-15T10:00:00Z'),
        status: NotificationStatus.CANCELLED,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      notificationRepositoryStub.seed([sentNotification, cancelledNotification]);

      // Act & Assert
      await expect(
        useCase.execute({
          notificationId: 'notification-sent',
          entryId: 'entry-123',
          userId: 'user-123',
        }),
      ).rejects.toThrow('Notification is already sent');

      await expect(
        useCase.execute({
          notificationId: 'notification-cancelled',
          entryId: 'entry-456',
          userId: 'user-123',
        }),
      ).rejects.toThrow('Notification is already cancelled');
    });

    it('should throw error when entry or user not found', async () => {
      // Arrange
      const entry = MockEntryFactory.create({ id: 'entry-123' });
      const notification: NotificationModel = {
        id: 'notification-123',
        entryId: 'entry-123',
        userId: 'user-123',
        scheduledAt: new Date('2024-01-15T10:00:00Z'),
        status: NotificationStatus.PENDING,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      notificationRepositoryStub.seed([notification]);

      // Test entry not found
      await expect(
        useCase.execute({
          notificationId: 'notification-123',
          entryId: 'entry-123',
          userId: 'user-123',
        }),
      ).rejects.toThrow('Entry not found');

      // Test user not found
      entryRepositoryStub.seed([entry]);
      await expect(
        useCase.execute({
          notificationId: 'notification-123',
          entryId: 'entry-123',
          userId: 'user-123',
        }),
      ).rejects.toThrow('User not found');
    });

    it('should cancel notification when user has notifications disabled', async () => {
      // Arrange
      const entry = MockEntryFactory.create({ id: 'entry-123' });
      const user = MockUserFactory.create({
        id: 'user-123',
        notificationEnabled: false,
      });
      const notification: NotificationModel = {
        id: 'notification-123',
        entryId: 'entry-123',
        userId: 'user-123',
        scheduledAt: new Date('2024-01-15T10:00:00Z'),
        status: NotificationStatus.PENDING,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      notificationRepositoryStub.seed([notification]);
      entryRepositoryStub.seed([entry]);
      userRepositoryStub.seed([user]);

      const updateStatusSpy = jest.spyOn(
        notificationRepositoryStub,
        'updateStatus',
      );

      // Act
      const result = await useCase.execute({
        notificationId: 'notification-123',
        entryId: 'entry-123',
        userId: 'user-123',
      });

      // Assert
      expect(result.success).toBe(false);
      expect(updateStatusSpy).toHaveBeenCalledWith(
        'notification-123',
        NotificationStatus.CANCELLED,
      );
      expect(emailSenderStub.getEmailCount()).toBe(0);
    });

    it('should handle email sending failures with and without error message', async () => {
      // Arrange
      const entry = MockEntryFactory.create({ id: 'entry-123' });
      const user = MockUserFactory.create({
        id: 'user-123',
        notificationEnabled: true,
      });
      const notification: NotificationModel = {
        id: 'notification-123',
        entryId: 'entry-123',
        userId: 'user-123',
        scheduledAt: new Date('2024-01-15T10:00:00Z'),
        status: NotificationStatus.PENDING,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      notificationRepositoryStub.seed([notification]);
      entryRepositoryStub.seed([entry]);
      userRepositoryStub.seed([user]);

      emailTemplateService.generateEmail.mockResolvedValue({
        subject: 'Test Subject',
        html: '<html>Test</html>',
        text: 'Test',
      });

      // Test with error message
      emailSenderStub.mockFailureResult('SMTP connection failed');
      await expect(
        useCase.execute({
          notificationId: 'notification-123',
          entryId: 'entry-123',
          userId: 'user-123',
        }),
      ).rejects.toThrow('SMTP connection failed');

      // Test without error message
      emailSenderStub.mockFailureResult('');
      await expect(
        useCase.execute({
          notificationId: 'notification-123',
          entryId: 'entry-123',
          userId: 'user-123',
        }),
      ).rejects.toThrow('Failed to send email');
    });
  });
});

