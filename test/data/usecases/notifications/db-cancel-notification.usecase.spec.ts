import { DbCancelNotificationUseCase } from '@data/usecases/db-cancel-notification.usecase';
import { NotificationRepositoryStub } from '@test/data/mocks/repositories';
import { NotificationSchedulerService } from '@infra/notifications/notification-scheduler.service';
import {
  NotificationModel,
  NotificationStatus,
} from '@domain/models/notification.model';

describe('DbCancelNotificationUseCase', () => {
  let useCase: DbCancelNotificationUseCase;
  let notificationRepositoryStub: NotificationRepositoryStub;
  let notificationScheduler: jest.Mocked<NotificationSchedulerService>;

  beforeEach(() => {
    notificationRepositoryStub = new NotificationRepositoryStub();
    notificationScheduler = {
      cancelNotification: jest.fn(),
    } as any;

    useCase = new DbCancelNotificationUseCase(
      notificationRepositoryStub,
      notificationScheduler,
    );
  });

  afterEach(() => {
    notificationRepositoryStub.clear();
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should cancel notification successfully when notification exists with jobId', async () => {
      // Arrange
      const notification: NotificationModel = {
        id: 'notification-123',
        entryId: 'entry-123',
        userId: 'user-123',
        scheduledAt: new Date('2024-01-15T10:00:00Z'),
        jobId: 'job-123',
        status: NotificationStatus.PENDING,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };
      notificationRepositoryStub.seed([notification]);

      notificationScheduler.cancelNotification.mockResolvedValue(undefined);
      const updateStatusSpy = jest.spyOn(
        notificationRepositoryStub,
        'updateStatus',
      );

      // Act
      const result = await useCase.execute({ entryId: 'entry-123' });

      // Assert
      expect(result.success).toBe(true);
      expect(notificationScheduler.cancelNotification).toHaveBeenCalledWith(
        'job-123',
      );
      expect(updateStatusSpy).toHaveBeenCalledWith(
        'notification-123',
        NotificationStatus.CANCELLED,
      );
    });

    it('should cancel notification successfully when notification exists without jobId', async () => {
      // Arrange
      const notification: NotificationModel = {
        id: 'notification-123',
        entryId: 'entry-123',
        userId: 'user-123',
        scheduledAt: new Date('2024-01-15T10:00:00Z'),
        jobId: null,
        status: NotificationStatus.PENDING,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };
      notificationRepositoryStub.seed([notification]);

      const updateStatusSpy = jest.spyOn(
        notificationRepositoryStub,
        'updateStatus',
      );

      // Act
      const result = await useCase.execute({ entryId: 'entry-123' });

      // Assert
      expect(result.success).toBe(true);
      expect(notificationScheduler.cancelNotification).not.toHaveBeenCalled();
      expect(updateStatusSpy).toHaveBeenCalledWith(
        'notification-123',
        NotificationStatus.CANCELLED,
      );
    });

    it('should return success when notification does not exist', async () => {
      // Arrange
      // No notifications seeded

      // Act
      const result = await useCase.execute({ entryId: 'non-existent-entry' });

      // Assert
      expect(result.success).toBe(true);
      expect(notificationScheduler.cancelNotification).not.toHaveBeenCalled();
    });

    it('should handle job cancellation errors gracefully', async () => {
      // Arrange
      const notification: NotificationModel = {
        id: 'notification-123',
        entryId: 'entry-123',
        userId: 'user-123',
        scheduledAt: new Date('2024-01-15T10:00:00Z'),
        jobId: 'job-123',
        status: NotificationStatus.PENDING,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };
      notificationRepositoryStub.seed([notification]);

      const error = new Error('Job not found');
      notificationScheduler.cancelNotification.mockRejectedValue(error);

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation();

      const updateStatusSpy = jest.spyOn(
        notificationRepositoryStub,
        'updateStatus',
      );

      // Act
      const result = await useCase.execute({ entryId: 'entry-123' });

      // Assert
      expect(result.success).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Failed to cancel notification job job-123:`,
        error,
      );
      expect(updateStatusSpy).toHaveBeenCalledWith(
        'notification-123',
        NotificationStatus.CANCELLED,
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle repository errors', async () => {
      // Arrange
      notificationRepositoryStub.mockFailure(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(
        useCase.execute({ entryId: 'entry-123' }),
      ).rejects.toThrow('Database connection failed');
    });
  });
});

