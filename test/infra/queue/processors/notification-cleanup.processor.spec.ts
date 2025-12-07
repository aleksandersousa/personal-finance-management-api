import { Test, TestingModule } from '@nestjs/testing';
import { NotificationCleanupProcessor } from '@infra/queue/processors/notification-cleanup.processor';
import { ScheduledTasksWorker } from '@workers/scheduled-tasks.worker';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { Job } from 'bullmq';
import { NotificationCleanupJobData } from '@domain/contracts';

describe('NotificationCleanupProcessor', () => {
  let processor: NotificationCleanupProcessor;
  let scheduledTasksWorker: jest.Mocked<ScheduledTasksWorker>;
  let logger: jest.Mocked<ContextAwareLoggerService>;

  beforeEach(async () => {
    scheduledTasksWorker = {
      cleanupCancelledNotifications: jest.fn(),
    } as any;

    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      logBusinessEvent: jest.fn(),
      logSecurityEvent: jest.fn(),
      logPerformanceEvent: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationCleanupProcessor,
        {
          provide: ScheduledTasksWorker,
          useValue: scheduledTasksWorker,
        },
        {
          provide: ContextAwareLoggerService,
          useValue: logger,
        },
      ],
    }).compile();

    processor = module.get<NotificationCleanupProcessor>(
      NotificationCleanupProcessor,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should process notification cleanup job successfully', async () => {
      // Arrange
      const jobData: NotificationCleanupJobData = {
        olderThanDays: 30,
      };
      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<NotificationCleanupJobData>;

      scheduledTasksWorker.cleanupCancelledNotifications.mockResolvedValue({
        success: true,
        deletedCount: 15,
      });

      // Act
      await processor.process(mockJob);

      // Assert
      expect(logger.log).toHaveBeenCalledWith(
        'Processing notification cleanup job job-123 - Older than: 30 days',
        'NotificationCleanupProcessor',
      );
      expect(
        scheduledTasksWorker.cleanupCancelledNotifications,
      ).toHaveBeenCalledWith({
        olderThanDays: 30,
      });
      expect(logger.log).toHaveBeenCalledWith(
        'Notification cleanup job job-123 completed successfully. Deleted: 15 notifications',
        'NotificationCleanupProcessor',
      );
    });

    it('should use default 30 days when olderThanDays is not provided', async () => {
      // Arrange
      const jobData: NotificationCleanupJobData = {};
      const mockJob = {
        id: 'job-456',
        data: jobData,
      } as Job<NotificationCleanupJobData>;

      scheduledTasksWorker.cleanupCancelledNotifications.mockResolvedValue({
        success: true,
        deletedCount: 5,
      });

      // Act
      await processor.process(mockJob);

      // Assert
      expect(logger.log).toHaveBeenCalledWith(
        'Processing notification cleanup job job-456 - Older than: 30 days',
        'NotificationCleanupProcessor',
      );
      expect(
        scheduledTasksWorker.cleanupCancelledNotifications,
      ).toHaveBeenCalledWith({
        olderThanDays: undefined,
      });
    });

    it('should throw error when cleanup fails', async () => {
      // Arrange
      const jobData: NotificationCleanupJobData = {
        olderThanDays: 30,
      };
      const mockJob = {
        id: 'job-fail',
        data: jobData,
      } as Job<NotificationCleanupJobData>;

      scheduledTasksWorker.cleanupCancelledNotifications.mockResolvedValue({
        success: false,
        deletedCount: 0,
        error: 'Database connection failed',
      });

      // Act & Assert
      await expect(processor.process(mockJob)).rejects.toThrow(
        'Database connection failed',
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Error processing notification cleanup job job-fail: Database connection failed',
        expect.any(String),
        'NotificationCleanupProcessor',
      );
    });

    it('should throw generic error when cleanup fails without error message', async () => {
      // Arrange
      const jobData: NotificationCleanupJobData = {
        olderThanDays: 30,
      };
      const mockJob = {
        id: 'job-fail-generic',
        data: jobData,
      } as Job<NotificationCleanupJobData>;

      scheduledTasksWorker.cleanupCancelledNotifications.mockResolvedValue({
        success: false,
        deletedCount: 0,
      });

      // Act & Assert
      await expect(processor.process(mockJob)).rejects.toThrow(
        'Failed to cleanup notifications',
      );
    });

    it('should handle worker throwing error', async () => {
      // Arrange
      const jobData: NotificationCleanupJobData = {
        olderThanDays: 30,
      };
      const mockJob = {
        id: 'job-throw',
        data: jobData,
      } as Job<NotificationCleanupJobData>;

      const error = new Error('Worker error');
      error.stack = 'Error stack';
      scheduledTasksWorker.cleanupCancelledNotifications.mockRejectedValue(
        error,
      );

      // Act & Assert
      await expect(processor.process(mockJob)).rejects.toThrow('Worker error');

      expect(logger.error).toHaveBeenCalledWith(
        'Error processing notification cleanup job job-throw: Worker error',
        'Error stack',
        'NotificationCleanupProcessor',
      );
    });
  });
});
