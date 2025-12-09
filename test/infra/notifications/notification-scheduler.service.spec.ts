import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationSchedulerService } from '@infra/notifications/notification-scheduler.service';
import { NotificationJobData } from '@domain/contracts';
import { QUEUE_NAMES } from '@domain/constants';
import { EntryModel } from '@domain/models/entry.model';
import { UserModel } from '@domain/models/user.model';

describe('NotificationSchedulerService', () => {
  let service: NotificationSchedulerService;
  let mockQueue: jest.Mocked<Queue<NotificationJobData>>;
  let loggerLogSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn(),
      getJob: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationSchedulerService,
        {
          provide: getQueueToken(QUEUE_NAMES.NOTIFICATION),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<NotificationSchedulerService>(
      NotificationSchedulerService,
    );

    loggerLogSpy = jest.spyOn(service['logger'], 'log');
    loggerErrorSpy = jest.spyOn(service['logger'], 'error');
    loggerWarnSpy = jest.spyOn(service['logger'], 'warn');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateScheduledTime', () => {
    const baseEntry: EntryModel = {
      id: 'entry-123',
      userId: 'user-123',
      description: 'Test Entry',
      amount: 100,
      date: new Date('2024-01-15T10:00:00Z'),
      type: 'EXPENSE',
      isFixed: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      isPaid: true,
    };

    const baseUser: UserModel = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    it('should calculate scheduled time using entry notification minutes', () => {
      // Arrange
      const entry: EntryModel = {
        ...baseEntry,
        notificationTimeMinutes: 15,
      };
      const user: UserModel = {
        ...baseUser,
        notificationTimeMinutes: 30,
      };

      // Act
      const result = service.calculateScheduledTime(entry, user);

      // Assert
      expect(result).toBeInstanceOf(Date);
      expect(loggerLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Calculating scheduled time'),
      );
    });

    it('should calculate scheduled time using user notification minutes when entry has none', () => {
      // Arrange
      const entry: EntryModel = {
        ...baseEntry,
        notificationTimeMinutes: null,
      };
      const user: UserModel = {
        ...baseUser,
        notificationTimeMinutes: 30,
      };

      // Act
      const result = service.calculateScheduledTime(entry, user);

      // Assert
      expect(result).toBeInstanceOf(Date);
      expect(loggerLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('notificationMinutes=30'),
      );
    });

    it('should use default 5 minutes when neither entry nor user has notification minutes', () => {
      // Arrange
      const entry: EntryModel = {
        ...baseEntry,
        notificationTimeMinutes: null,
      };
      const user: UserModel = {
        ...baseUser,
        notificationTimeMinutes: undefined,
      };

      // Act
      const result = service.calculateScheduledTime(entry, user);

      // Assert
      expect(result).toBeInstanceOf(Date);
      expect(loggerLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('notificationMinutes=5'),
      );
    });

    it('should use user timezone when provided, default to America/Sao_Paulo when not set', () => {
      // Arrange
      const entry: EntryModel = {
        ...baseEntry,
      };

      // Test with custom timezone
      const userWithTimezone: UserModel = {
        ...baseUser,
        timezone: 'America/New_York',
      };

      // Act
      const resultWithTimezone = service.calculateScheduledTime(
        entry,
        userWithTimezone,
      );

      // Assert
      expect(resultWithTimezone).toBeInstanceOf(Date);
      expect(loggerLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('userTimezone=America/New_York'),
      );

      // Test with default timezone
      const userWithoutTimezone: UserModel = {
        ...baseUser,
        timezone: undefined,
      };

      // Act
      const resultWithoutTimezone = service.calculateScheduledTime(
        entry,
        userWithoutTimezone,
      );

      // Assert
      expect(resultWithoutTimezone).toBeInstanceOf(Date);
      expect(loggerLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('userTimezone=America/Sao_Paulo'),
      );
    });
  });

  describe('scheduleNotification', () => {
    const mockEntry: EntryModel = {
      id: 'entry-123',
      userId: 'user-123',
      description: 'Test Entry',
      amount: 100,
      date: new Date('2024-01-15T10:00:00Z'),
      type: 'EXPENSE',
      isFixed: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      isPaid: true,
    };

    it('should schedule notification successfully', async () => {
      // Arrange
      const notificationId = 'notification-123';
      const userId = 'user-123';
      const scheduledAt = new Date('2024-01-15T09:55:00Z');
      const mockJob = {
        id: 'job-123',
      };

      mockQueue.add.mockResolvedValue(mockJob as any);

      // Act
      const result = await service.scheduleNotification(
        notificationId,
        mockEntry,
        userId,
        scheduledAt,
      );

      // Assert
      expect(result.jobId).toBe('job-123');
      expect(result.scheduledAt).toEqual(scheduledAt);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-notification',
        {
          notificationId,
          entryId: mockEntry.id,
          userId,
          metadata: {
            scheduledAt: scheduledAt.toISOString(),
            entryDescription: mockEntry.description,
            entryAmount: mockEntry.amount,
            entryDate: mockEntry.date.toISOString(),
          },
        },
        {
          delay: expect.any(Number),
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );
      expect(loggerLogSpy).toHaveBeenCalledWith(
        `Notification job scheduled: job-123 for entry ${mockEntry.id}, scheduled at ${scheduledAt.toISOString()}`,
      );
    });

    it('should calculate delay correctly for future scheduled time', async () => {
      // Arrange
      const notificationId = 'notification-123';
      const userId = 'user-123';
      const now = new Date();
      const scheduledAt = new Date(now.getTime() + 60000); // 1 minute in future
      const mockJob = {
        id: 'job-123',
      };

      mockQueue.add.mockResolvedValue(mockJob as any);

      // Act
      await service.scheduleNotification(
        notificationId,
        mockEntry,
        userId,
        scheduledAt,
      );

      // Assert
      const addCall = mockQueue.add.mock.calls[0];
      const delay = addCall[2].delay;
      expect(delay).toBeGreaterThan(0);
      expect(delay).toBeLessThanOrEqual(60000);
    });

    it('should use zero delay for past scheduled time', async () => {
      // Arrange
      const notificationId = 'notification-123';
      const userId = 'user-123';
      const now = new Date();
      const scheduledAt = new Date(now.getTime() - 60000); // 1 minute in past
      const mockJob = {
        id: 'job-123',
      };

      mockQueue.add.mockResolvedValue(mockJob as any);

      // Act
      await service.scheduleNotification(
        notificationId,
        mockEntry,
        userId,
        scheduledAt,
      );

      // Assert
      const addCall = mockQueue.add.mock.calls[0];
      expect(addCall[2].delay).toBe(0);
    });

    it('should handle scheduling errors', async () => {
      // Arrange
      const notificationId = 'notification-123';
      const userId = 'user-123';
      const scheduledAt = new Date('2024-01-15T09:55:00Z');
      const error = new Error('Queue connection failed');
      error.stack = 'Error stack';

      mockQueue.add.mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.scheduleNotification(
          notificationId,
          mockEntry,
          userId,
          scheduledAt,
        ),
      ).rejects.toThrow('Queue connection failed');

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        `Failed to schedule notification for entry ${mockEntry.id}: Queue connection failed`,
        'Error stack',
      );
    });
  });

  describe('cancelNotification', () => {
    it('should cancel notification job successfully', async () => {
      // Arrange
      const jobId = 'job-123';
      const mockJob = {
        id: jobId,
        remove: jest.fn().mockResolvedValue(undefined),
      };

      mockQueue.getJob.mockResolvedValue(mockJob as any);

      // Act
      await service.cancelNotification(jobId);

      // Assert
      expect(mockQueue.getJob).toHaveBeenCalledWith(jobId);
      expect(mockJob.remove).toHaveBeenCalled();
      expect(loggerLogSpy).toHaveBeenCalledWith(
        `Notification job ${jobId} cancelled`,
      );
    });

    it('should handle job not found gracefully', async () => {
      // Arrange
      const jobId = 'job-123';
      mockQueue.getJob.mockResolvedValue(null);

      // Act
      await service.cancelNotification(jobId);

      // Assert
      expect(mockQueue.getJob).toHaveBeenCalledWith(jobId);
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        `Notification job ${jobId} not found`,
      );
    });

    it('should handle cancellation errors', async () => {
      // Arrange
      const jobId = 'job-123';
      const error = new Error('Failed to remove job');
      error.stack = 'Error stack';

      mockQueue.getJob.mockRejectedValue(error);

      // Act & Assert
      await expect(service.cancelNotification(jobId)).rejects.toThrow(
        'Failed to remove job',
      );

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        `Failed to cancel notification job ${jobId}: Failed to remove job`,
        'Error stack',
      );
    });

    it('should handle job remove errors', async () => {
      // Arrange
      const jobId = 'job-123';
      const error = new Error('Remove failed');
      error.stack = 'Error stack';
      const mockJob = {
        id: jobId,
        remove: jest.fn().mockRejectedValue(error),
      };

      mockQueue.getJob.mockResolvedValue(mockJob as any);

      // Act & Assert
      await expect(service.cancelNotification(jobId)).rejects.toThrow(
        'Remove failed',
      );

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        `Failed to cancel notification job ${jobId}: Remove failed`,
        'Error stack',
      );
    });
  });
});
