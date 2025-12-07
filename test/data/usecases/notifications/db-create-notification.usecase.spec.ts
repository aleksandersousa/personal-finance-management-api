import { DbCreateNotificationUseCase } from '@data/usecases/db-create-notification.usecase';
import {
  NotificationRepositoryStub,
  EntryRepositoryStub,
  UserRepositoryStub,
} from '@test/data/mocks/repositories';
import { NotificationSchedulerService } from '@infra/notifications/notification-scheduler.service';
import { MockEntryFactory, MockUserFactory } from '@test/domain/mocks/models';
import { NotificationStatus } from '@domain/models/notification.model';

describe('DbCreateNotificationUseCase', () => {
  let useCase: DbCreateNotificationUseCase;
  let notificationRepositoryStub: NotificationRepositoryStub;
  let notificationScheduler: jest.Mocked<NotificationSchedulerService>;

  beforeEach(() => {
    notificationRepositoryStub = new NotificationRepositoryStub();
    notificationScheduler = {
      calculateScheduledTime: jest.fn(),
      scheduleNotification: jest.fn(),
    } as any;

    useCase = new DbCreateNotificationUseCase(
      notificationRepositoryStub,
      notificationScheduler,
    );
  });

  afterEach(() => {
    notificationRepositoryStub.clear();
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create notification successfully', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      futureDate.setHours(10, 0, 0, 0);

      const entry = MockEntryFactory.create({
        id: 'entry-123',
        date: futureDate,
      });
      const user = MockUserFactory.create({
        id: 'user-123',
        notificationEnabled: true,
        notificationTimeMinutes: 30,
        timezone: 'America/Sao_Paulo',
      });

      const scheduledAt = new Date(futureDate);
      scheduledAt.setMinutes(scheduledAt.getMinutes() - 30);
      notificationScheduler.calculateScheduledTime.mockReturnValue(scheduledAt);
      notificationScheduler.scheduleNotification.mockResolvedValue({
        jobId: 'job-123',
        scheduledAt,
      });

      const request = {
        entryId: 'entry-123',
        userId: 'user-123',
        entry,
        user,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.notification).toBeDefined();
      expect(result.notification.entryId).toBe('entry-123');
      expect(result.notification.userId).toBe('user-123');
      expect(result.notification.jobId).toBe('job-123');
      expect(result.notification.status).toBe(NotificationStatus.PENDING);
      expect(notificationScheduler.calculateScheduledTime).toHaveBeenCalledWith(
        entry,
        user,
      );
      expect(notificationScheduler.scheduleNotification).toHaveBeenCalledWith(
        result.notification.id,
        entry,
        'user-123',
        scheduledAt,
      );
    });

    it('should throw error when user has notifications disabled', async () => {
      // Arrange
      const entry = MockEntryFactory.create();
      const user = MockUserFactory.create({
        notificationEnabled: false,
      });

      const request = {
        entryId: 'entry-123',
        userId: 'user-123',
        entry,
        user,
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        'User has notifications disabled',
      );
    });

    it('should throw error when scheduled time is in the past', async () => {
      // Arrange
      const entry = MockEntryFactory.create({
        date: new Date('2024-01-01T10:00:00Z'),
      });
      const user = MockUserFactory.create({
        notificationEnabled: true,
      });

      const pastDate = new Date('2023-12-31T10:00:00Z');
      notificationScheduler.calculateScheduledTime.mockReturnValue(pastDate);

      const request = {
        entryId: 'entry-123',
        userId: 'user-123',
        entry,
        user,
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        'Cannot schedule notification in the past',
      );
    });

    it('should handle scheduling errors', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      futureDate.setHours(10, 0, 0, 0);

      const entry = MockEntryFactory.create({
        date: futureDate,
      });
      const user = MockUserFactory.create({
        notificationEnabled: true,
      });

      const scheduledAt = new Date(futureDate);
      scheduledAt.setMinutes(scheduledAt.getMinutes() - 30);
      notificationScheduler.calculateScheduledTime.mockReturnValue(scheduledAt);
      notificationScheduler.scheduleNotification.mockRejectedValue(
        new Error('Queue connection failed'),
      );

      const request = {
        entryId: 'entry-123',
        userId: 'user-123',
        entry,
        user,
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        'Queue connection failed',
      );
    });

    it('should handle repository errors during creation', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      futureDate.setHours(10, 0, 0, 0);

      const entry = MockEntryFactory.create({
        date: futureDate,
      });
      const user = MockUserFactory.create({
        notificationEnabled: true,
      });

      const scheduledAt = new Date(futureDate);
      scheduledAt.setMinutes(scheduledAt.getMinutes() - 30);
      notificationScheduler.calculateScheduledTime.mockReturnValue(scheduledAt);
      notificationRepositoryStub.mockFailure(
        new Error('Database connection failed'),
      );

      const request = {
        entryId: 'entry-123',
        userId: 'user-123',
        entry,
        user,
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle repository errors during jobId update', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      futureDate.setHours(10, 0, 0, 0);

      const entry = MockEntryFactory.create({
        date: futureDate,
      });
      const user = MockUserFactory.create({
        notificationEnabled: true,
      });

      const scheduledAt = new Date(futureDate);
      scheduledAt.setMinutes(scheduledAt.getMinutes() - 30);
      notificationScheduler.calculateScheduledTime.mockReturnValue(scheduledAt);
      notificationScheduler.scheduleNotification.mockResolvedValue({
        jobId: 'job-123',
        scheduledAt,
      });

      // Mock failure on updateJobId
      const updateJobIdSpy = jest
        .spyOn(notificationRepositoryStub, 'updateJobId')
        .mockRejectedValue(new Error('Update failed'));

      const request = {
        entryId: 'entry-123',
        userId: 'user-123',
        entry,
        user,
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('Update failed');

      updateJobIdSpy.mockRestore();
    });
  });
});

