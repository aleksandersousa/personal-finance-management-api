import { Test, TestingModule } from '@nestjs/testing';
import { NotificationProcessor } from '@infra/queue/processors/notification.processor';
import { NotificationWorker } from '@workers/notification.worker';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { Job } from 'bullmq';
import { NotificationJobData } from '@domain/contracts';

describe('NotificationProcessor', () => {
  let processor: NotificationProcessor;
  let notificationWorker: jest.Mocked<NotificationWorker>;
  let logger: jest.Mocked<ContextAwareLoggerService>;

  beforeEach(async () => {
    notificationWorker = {
      processNotification: jest.fn(),
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
        NotificationProcessor,
        {
          provide: NotificationWorker,
          useValue: notificationWorker,
        },
        {
          provide: ContextAwareLoggerService,
          useValue: logger,
        },
      ],
    }).compile();

    processor = module.get<NotificationProcessor>(NotificationProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should process notification job successfully', async () => {
      // Arrange
      const jobData: NotificationJobData = {
        notificationId: 'notification-123',
        entryId: 'entry-123',
        userId: 'user-123',
      };
      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<NotificationJobData>;

      notificationWorker.processNotification.mockResolvedValue({
        success: true,
        messageId: 'msg-123',
      });

      // Act
      await processor.process(mockJob);

      // Assert
      expect(logger.log).toHaveBeenCalledWith(
        `Processing notification job job-123 - Notification: notification-123, Entry: entry-123, User: user-123`,
        'NotificationProcessor',
      );
      expect(notificationWorker.processNotification).toHaveBeenCalledWith(
        'notification-123',
        'entry-123',
        'user-123',
      );
      expect(logger.log).toHaveBeenCalledWith(
        'Notification job job-123 completed successfully. Message ID: msg-123',
        'NotificationProcessor',
      );
    });

    it('should throw error when notification processing fails', async () => {
      // Arrange
      const jobData: NotificationJobData = {
        notificationId: 'notification-123',
        entryId: 'entry-123',
        userId: 'user-123',
      };
      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<NotificationJobData>;

      notificationWorker.processNotification.mockResolvedValue({
        success: false,
        error: 'Failed to send notification',
      });

      // Act & Assert
      await expect(processor.process(mockJob)).rejects.toThrow(
        'Failed to send notification',
      );

      expect(logger.log).toHaveBeenCalledWith(
        `Processing notification job job-123 - Notification: notification-123, Entry: entry-123, User: user-123`,
        'NotificationProcessor',
      );
      expect(logger.error).toHaveBeenCalledWith(
        `Error processing notification job job-123: Failed to send notification`,
        expect.any(String),
        'NotificationProcessor',
      );
    });

    it('should throw generic error when notification processing fails without error message', async () => {
      // Arrange
      const jobData: NotificationJobData = {
        notificationId: 'notification-123',
        entryId: 'entry-123',
        userId: 'user-123',
      };
      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<NotificationJobData>;

      notificationWorker.processNotification.mockResolvedValue({
        success: false,
      });

      // Act & Assert
      await expect(processor.process(mockJob)).rejects.toThrow(
        'Failed to send notification',
      );
    });

    it('should handle worker throwing error', async () => {
      // Arrange
      const jobData: NotificationJobData = {
        notificationId: 'notification-123',
        entryId: 'entry-123',
        userId: 'user-123',
      };
      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<NotificationJobData>;

      const error = new Error('Worker error');
      error.stack = 'Error stack';
      notificationWorker.processNotification.mockRejectedValue(error);

      // Act & Assert
      await expect(processor.process(mockJob)).rejects.toThrow('Worker error');

      expect(logger.error).toHaveBeenCalledWith(
        'Error processing notification job job-123: Worker error',
        'Error stack',
        'NotificationProcessor',
      );
    });
  });
});

