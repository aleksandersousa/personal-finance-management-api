import { Test, TestingModule } from '@nestjs/testing';
import { QueuedEmailSender } from '@infra/implementations/queued-email-sender';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EmailJobData } from '@domain/contracts';
import { SendEmailParams } from '@data/protocols/email-sender';

describe('QueuedEmailSender', () => {
  let sender: QueuedEmailSender;
  let mockQueue: jest.Mocked<Queue<EmailJobData>>;
  let loggerLogSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueuedEmailSender,
        {
          provide: getQueueToken('email'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    sender = module.get<QueuedEmailSender>(QueuedEmailSender);

    loggerLogSpy = jest.spyOn(sender['logger'], 'log');
    loggerErrorSpy = jest.spyOn(sender['logger'], 'error');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(sender).toBeDefined();
  });

  describe('send', () => {
    it('should enqueue email successfully and return job id as messageId', async () => {
      // Arrange
      const emailParams: SendEmailParams = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        text: 'Test content',
      };
      const mockJob = { id: 'job-123' } as any;
      mockQueue.add.mockResolvedValue(mockJob);

      // Act
      const result = await sender.send(emailParams);

      // Assert
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('job-123');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining({
          emailParams,
          emailType: 'generic',
          metadata: expect.objectContaining({
            enqueuedAt: expect.any(String),
            recipient: 'recipient@example.com',
          }),
        }),
        {
          priority: 1,
        },
      );
      expect(loggerLogSpy).toHaveBeenCalledWith(
        'Email job enqueued: job-123 - Type: generic, To: recipient@example.com',
      );
    });

    it('should handle multiple recipients', async () => {
      // Arrange
      const emailParams: SendEmailParams = {
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Test Email',
        text: 'Test content',
      };
      const mockJob = { id: 'job-456' } as any;
      mockQueue.add.mockResolvedValue(mockJob);

      // Act
      const result = await sender.send(emailParams);

      // Assert
      expect(result.success).toBe(true);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining({
          metadata: expect.objectContaining({
            recipient: 'user1@example.com, user2@example.com',
          }),
        }),
        expect.any(Object),
      );
      expect(loggerLogSpy).toHaveBeenCalledWith(
        'Email job enqueued: job-456 - Type: generic, To: user1@example.com, user2@example.com',
      );
    });

    it('should return error result when queue fails', async () => {
      // Arrange
      const emailParams: SendEmailParams = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        text: 'Test content',
      };
      const error = new Error('Queue connection failed');
      error.stack = 'Error stack';
      mockQueue.add.mockRejectedValue(error);

      // Act
      const result = await sender.send(emailParams);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Queue connection failed');
      expect(result.messageId).toBeUndefined();
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to enqueue email: Queue connection failed',
        'Error stack',
      );
    });

    it('should handle error without message property', async () => {
      // Arrange
      const emailParams: SendEmailParams = {
        to: 'recipient@example.com',
        subject: 'Test Email',
      };
      const error = { code: 'ECONNREFUSED' };
      mockQueue.add.mockRejectedValue(error);

      // Act
      const result = await sender.send(emailParams);

      // Assert
      expect(result.success).toBe(false);
      expect(loggerErrorSpy).toHaveBeenCalled();
    });
  });

  describe('determineEmailType', () => {
    it('should detect verification email and assign correct priority', async () => {
      // Arrange
      const emailParams: SendEmailParams = {
        to: 'user@example.com',
        subject: 'Email Verification',
        text: 'Verify your email',
      };
      const mockJob = { id: 'job-verification' } as any;
      mockQueue.add.mockResolvedValue(mockJob);

      // Act
      await sender.send(emailParams);

      // Assert
      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining({
          emailType: 'verification',
        }),
        expect.objectContaining({
          priority: 5,
        }),
      );
    });

    it('should detect password reset email and assign highest priority', async () => {
      // Arrange
      const emailParams: SendEmailParams = {
        to: 'user@example.com',
        subject: 'Password Reset',
        text: 'Reset your password',
      };
      const mockJob = { id: 'job-password' } as any;
      mockQueue.add.mockResolvedValue(mockJob);

      // Act
      await sender.send(emailParams);

      // Assert
      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining({
          emailType: 'password-reset',
        }),
        expect.objectContaining({
          priority: 10,
        }),
      );
    });

    it('should detect welcome email and assign correct priority', async () => {
      // Arrange
      const emailParams: SendEmailParams = {
        to: 'user@example.com',
        subject: 'Welcome to Our Platform',
        text: 'Welcome!',
      };
      const mockJob = { id: 'job-welcome' } as any;
      mockQueue.add.mockResolvedValue(mockJob);

      // Act
      await sender.send(emailParams);

      // Assert
      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining({
          emailType: 'welcome',
        }),
        expect.objectContaining({
          priority: 3,
        }),
      );
    });

    it('should default to generic type for unknown or empty subjects', async () => {
      // Arrange
      const emailParams: SendEmailParams = {
        to: 'user@example.com',
        subject: 'Monthly Report',
        text: 'Your monthly report',
      };
      const mockJob = { id: 'job-generic' } as any;
      mockQueue.add.mockResolvedValue(mockJob);

      // Act
      await sender.send(emailParams);

      // Assert
      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining({
          emailType: 'generic',
        }),
        expect.objectContaining({
          priority: 1,
        }),
      );
    });

    it('should be case insensitive and support both languages', async () => {
      // Arrange - test case insensitivity and Portuguese support
      const emailParams: SendEmailParams = {
        to: 'user@example.com',
        subject: 'VERIFICAÇÃO DE EMAIL', // Uppercase Portuguese
        text: 'Your code',
      };
      const mockJob = { id: 'job-mixed' } as any;
      mockQueue.add.mockResolvedValue(mockJob);

      // Act
      await sender.send(emailParams);

      // Assert
      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining({
          emailType: 'verification',
        }),
        expect.objectContaining({
          priority: 5,
        }),
      );
    });
  });
});
