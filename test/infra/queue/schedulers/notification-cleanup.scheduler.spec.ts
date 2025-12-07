import { Test, TestingModule } from '@nestjs/testing';
import { NotificationCleanupScheduler } from '@infra/queue/schedulers/notification-cleanup.scheduler';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationCleanupJobData } from '@domain/contracts';
import { CRON_PATTERNS, QUEUE_NAMES } from '@domain/constants';

describe('NotificationCleanupScheduler', () => {
  let scheduler: NotificationCleanupScheduler;
  let mockQueue: jest.Mocked<Queue<NotificationCleanupJobData>>;
  let loggerLogSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationCleanupScheduler,
        {
          provide: getQueueToken(QUEUE_NAMES.TOKEN_CLEANUP),
          useValue: mockQueue,
        },
      ],
    }).compile();

    scheduler = module.get<NotificationCleanupScheduler>(
      NotificationCleanupScheduler,
    );

    loggerLogSpy = jest.spyOn(scheduler['logger'], 'log');
    loggerErrorSpy = jest.spyOn(scheduler['logger'], 'error');
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.NODE_ENV;
    delete process.env.IS_WORKER;
  });

  it('should be defined', () => {
    expect(scheduler).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should schedule notification cleanup job in development environment', async () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      mockQueue.add.mockResolvedValue({} as any);

      // Act
      await scheduler.onModuleInit();

      // Assert
      expect(mockQueue.add).toHaveBeenCalledWith(
        'cleanup-cancelled-notifications',
        {
          olderThanDays: 30,
        },
        {
          repeat: {
            pattern: CRON_PATTERNS.EVERY_MONTH_AT_2AM,
          },
          jobId: 'notification-cleanup-recurring',
        },
      );
      expect(loggerLogSpy).toHaveBeenCalledWith(
        `Notification cleanup recurring job scheduled with pattern: ${CRON_PATTERNS.EVERY_MONTH_AT_2AM}`,
      );
    });

    it('should schedule notification cleanup job when IS_WORKER is true', async () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      process.env.IS_WORKER = 'true';
      mockQueue.add.mockResolvedValue({} as any);

      // Act
      await scheduler.onModuleInit();

      // Assert
      expect(mockQueue.add).toHaveBeenCalled();
      expect(loggerLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Notification cleanup recurring job scheduled'),
      );
    });

    it('should skip scheduling in production without IS_WORKER flag', async () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      delete process.env.IS_WORKER;

      // Act
      await scheduler.onModuleInit();

      // Assert
      expect(mockQueue.add).not.toHaveBeenCalled();
      expect(loggerLogSpy).toHaveBeenCalledWith(
        'Skipping notification cleanup scheduling - not a worker process. Set IS_WORKER=true to enable.',
      );
    });

    it('should handle job already exists error gracefully', async () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      const error = new Error('Job already exists');
      mockQueue.add.mockRejectedValue(error);

      // Act
      await scheduler.onModuleInit();

      // Assert
      expect(loggerLogSpy).toHaveBeenCalledWith(
        'Notification cleanup recurring job already exists',
      );
      expect(loggerErrorSpy).not.toHaveBeenCalled();
    });

    it('should log error for other scheduling failures', async () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      const error = new Error('Queue connection failed');
      error.stack = 'Error stack trace';
      mockQueue.add.mockRejectedValue(error);

      // Act
      await scheduler.onModuleInit();

      // Assert
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to schedule notification cleanup job: Queue connection failed',
        'Error stack trace',
      );
    });

    it('should handle error without message property', async () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      const error = { code: 'ECONNREFUSED' };
      mockQueue.add.mockRejectedValue(error);

      // Act
      await scheduler.onModuleInit();

      // Assert
      expect(loggerErrorSpy).toHaveBeenCalled();
    });
  });
});
