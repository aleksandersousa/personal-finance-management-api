import { Test, TestingModule } from '@nestjs/testing';
import { EmailProcessor } from '@infra/queue/processors/email.processor';
import { EmailWorker } from '@workers/email.worker';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { Job } from 'bullmq';
import { EmailJobData } from '@domain/contracts';
import { SendEmailParams } from '@data/protocols';

describe('EmailProcessor', () => {
  let processor: EmailProcessor;
  let emailWorker: jest.Mocked<EmailWorker>;
  let logger: jest.Mocked<ContextAwareLoggerService>;

  beforeEach(async () => {
    emailWorker = {
      processEmail: jest.fn(),
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
        EmailProcessor,
        {
          provide: EmailWorker,
          useValue: emailWorker,
        },
        {
          provide: ContextAwareLoggerService,
          useValue: logger,
        },
      ],
    }).compile();

    processor = module.get<EmailProcessor>(EmailProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    const baseEmailParams: SendEmailParams = {
      to: 'recipient@example.com',
      subject: 'Test Email',
      text: 'Test content',
    };

    it('should process email job successfully', async () => {
      // Arrange
      const jobData: EmailJobData = {
        emailParams: baseEmailParams,
        emailType: 'verification',
      };
      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<EmailJobData>;

      emailWorker.processEmail.mockResolvedValue({
        success: true,
        messageId: 'msg-123',
      });

      // Act
      await processor.process(mockJob);

      // Assert
      expect(logger.log).toHaveBeenCalledWith(
        `Processing email job job-123 - Type: verification, To: recipient@example.com`,
        'EmailProcessor',
      );
      expect(emailWorker.processEmail).toHaveBeenCalledWith(baseEmailParams);
      expect(logger.log).toHaveBeenCalledWith(
        'Email job job-123 completed successfully. Message ID: msg-123',
        'EmailProcessor',
      );
    });

    it('should handle email with multiple recipients', async () => {
      // Arrange
      const emailParams: SendEmailParams = {
        ...baseEmailParams,
        to: ['user1@example.com', 'user2@example.com'],
      };
      const jobData: EmailJobData = {
        emailParams,
      };
      const mockJob = {
        id: 'job-456',
        data: jobData,
      } as Job<EmailJobData>;

      emailWorker.processEmail.mockResolvedValue({
        success: true,
        messageId: 'msg-456',
      });

      // Act
      await processor.process(mockJob);

      // Assert
      expect(logger.log).toHaveBeenCalledWith(
        `Processing email job job-456 - Type: unknown, To: user1@example.com, user2@example.com`,
        'EmailProcessor',
      );
    });

    it('should handle email processing error', async () => {
      // Arrange
      const jobData: EmailJobData = {
        emailParams: baseEmailParams,
      };
      const mockJob = {
        id: 'job-789',
        data: jobData,
      } as Job<EmailJobData>;

      const error = new Error('Failed to send email');
      error.stack = 'Error stack';
      emailWorker.processEmail.mockRejectedValue(error);

      // Act & Assert
      await expect(processor.process(mockJob)).rejects.toThrow(
        'Failed to send email',
      );

      expect(logger.log).toHaveBeenCalledWith(
        `Processing email job job-789 - Type: unknown, To: recipient@example.com`,
        'EmailProcessor',
      );
      expect(logger.error).toHaveBeenCalledWith(
        `Error processing email job job-789: Failed to send email`,
        'Error stack',
        'EmailProcessor',
      );
    });

    it('should handle email without emailType', async () => {
      // Arrange
      const jobData: EmailJobData = {
        emailParams: baseEmailParams,
      };
      const mockJob = {
        id: 'job-no-type',
        data: jobData,
      } as Job<EmailJobData>;

      emailWorker.processEmail.mockResolvedValue({
        success: true,
        messageId: 'msg-no-type',
      });

      // Act
      await processor.process(mockJob);

      // Assert
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('Type: unknown'),
        'EmailProcessor',
      );
    });
  });
});
