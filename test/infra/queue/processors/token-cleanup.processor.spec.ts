import { Test, TestingModule } from '@nestjs/testing';
import { TokenCleanupProcessor } from '@infra/queue/processors/token-cleanup.processor';
import { ScheduledTasksWorker } from '@workers/scheduled-tasks.worker';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { Job } from 'bullmq';
import { TokenCleanupJobData } from '@domain/contracts';

describe('TokenCleanupProcessor', () => {
  let processor: TokenCleanupProcessor;
  let scheduledTasksWorker: jest.Mocked<ScheduledTasksWorker>;
  let logger: jest.Mocked<ContextAwareLoggerService>;

  beforeEach(async () => {
    scheduledTasksWorker = {
      cleanupExpiredTokens: jest.fn(),
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
        TokenCleanupProcessor,
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

    processor = module.get<TokenCleanupProcessor>(TokenCleanupProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should process token cleanup job successfully', async () => {
      // Arrange
      const jobData: TokenCleanupJobData = {
        tokenType: 'all',
      };
      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<TokenCleanupJobData>;

      scheduledTasksWorker.cleanupExpiredTokens.mockResolvedValue({
        success: true,
        cleanedTypes: ['email-verification', 'password-reset'],
      });

      // Act
      await processor.process(mockJob);

      // Assert
      expect(logger.log).toHaveBeenCalledWith(
        'Processing token cleanup job job-123 - Type: all',
        'TokenCleanupProcessor',
      );
      expect(scheduledTasksWorker.cleanupExpiredTokens).toHaveBeenCalledWith({
        tokenType: 'all',
      });
      expect(logger.log).toHaveBeenCalledWith(
        'Token cleanup job job-123 completed successfully. Cleaned types: email-verification, password-reset',
        'TokenCleanupProcessor',
      );
    });

    it('should handle email-verification token cleanup', async () => {
      // Arrange
      const jobData: TokenCleanupJobData = {
        tokenType: 'email-verification',
      };
      const mockJob = {
        id: 'job-456',
        data: jobData,
      } as Job<TokenCleanupJobData>;

      scheduledTasksWorker.cleanupExpiredTokens.mockResolvedValue({
        success: true,
        cleanedTypes: ['email-verification'],
      });

      // Act
      await processor.process(mockJob);

      // Assert
      expect(scheduledTasksWorker.cleanupExpiredTokens).toHaveBeenCalledWith({
        tokenType: 'email-verification',
      });
      expect(logger.log).toHaveBeenCalledWith(
        'Token cleanup job job-456 completed successfully. Cleaned types: email-verification',
        'TokenCleanupProcessor',
      );
    });

    it('should handle password-reset token cleanup', async () => {
      // Arrange
      const jobData: TokenCleanupJobData = {
        tokenType: 'password-reset',
      };
      const mockJob = {
        id: 'job-789',
        data: jobData,
      } as Job<TokenCleanupJobData>;

      scheduledTasksWorker.cleanupExpiredTokens.mockResolvedValue({
        success: true,
        cleanedTypes: ['password-reset'],
      });

      // Act
      await processor.process(mockJob);

      // Assert
      expect(scheduledTasksWorker.cleanupExpiredTokens).toHaveBeenCalledWith({
        tokenType: 'password-reset',
      });
    });

    it('should throw error when cleanup fails', async () => {
      // Arrange
      const jobData: TokenCleanupJobData = {
        tokenType: 'all',
      };
      const mockJob = {
        id: 'job-fail',
        data: jobData,
      } as Job<TokenCleanupJobData>;

      scheduledTasksWorker.cleanupExpiredTokens.mockResolvedValue({
        success: false,
        cleanedTypes: [],
        error: 'Database connection failed',
      });

      // Act & Assert
      await expect(processor.process(mockJob)).rejects.toThrow(
        'Database connection failed',
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Error processing token cleanup job job-fail: Database connection failed',
        expect.any(String),
        'TokenCleanupProcessor',
      );
    });

    it('should throw generic error when cleanup fails without error message', async () => {
      // Arrange
      const jobData: TokenCleanupJobData = {
        tokenType: 'all',
      };
      const mockJob = {
        id: 'job-fail-generic',
        data: jobData,
      } as Job<TokenCleanupJobData>;

      scheduledTasksWorker.cleanupExpiredTokens.mockResolvedValue({
        success: false,
        cleanedTypes: [],
      });

      // Act & Assert
      await expect(processor.process(mockJob)).rejects.toThrow(
        'Failed to cleanup tokens',
      );
    });

    it('should handle worker throwing error', async () => {
      // Arrange
      const jobData: TokenCleanupJobData = {
        tokenType: 'all',
      };
      const mockJob = {
        id: 'job-throw',
        data: jobData,
      } as Job<TokenCleanupJobData>;

      const error = new Error('Worker error');
      error.stack = 'Error stack';
      scheduledTasksWorker.cleanupExpiredTokens.mockRejectedValue(error);

      // Act & Assert
      await expect(processor.process(mockJob)).rejects.toThrow('Worker error');

      expect(logger.error).toHaveBeenCalledWith(
        'Error processing token cleanup job job-throw: Worker error',
        'Error stack',
        'TokenCleanupProcessor',
      );
    });
  });
});
