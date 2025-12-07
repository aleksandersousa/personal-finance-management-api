import { Test, TestingModule } from '@nestjs/testing';
import { NotificationWorker } from '@workers/notification.worker';
import { SendNotificationUseCase } from '@domain/usecases/send-notification.usecase';

describe('NotificationWorker', () => {
  let worker: NotificationWorker;
  let sendNotificationUseCase: jest.Mocked<SendNotificationUseCase>;

  beforeEach(async () => {
    sendNotificationUseCase = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationWorker,
        {
          provide: 'SendNotificationUseCase',
          useValue: sendNotificationUseCase,
        },
      ],
    }).compile();

    worker = module.get<NotificationWorker>(NotificationWorker);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(worker).toBeDefined();
  });

  describe('processNotification', () => {
    it('should process notification successfully and return result with messageId', async () => {
      // Arrange
      const notificationId = 'notification-123';
      const entryId = 'entry-123';
      const userId = 'user-123';

      sendNotificationUseCase.execute.mockResolvedValue({
        success: true,
        messageId: 'msg-123',
      });

      // Act
      const result = await worker.processNotification(
        notificationId,
        entryId,
        userId,
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-123');
      expect(result.error).toBeUndefined();
      expect(sendNotificationUseCase.execute).toHaveBeenCalledWith({
        notificationId,
        entryId,
        userId,
      });
    });

    it('should return failure result when use case returns failure', async () => {
      // Arrange
      const notificationId = 'notification-123';
      const entryId = 'entry-123';
      const userId = 'user-123';

      sendNotificationUseCase.execute.mockResolvedValue({
        success: false,
      });

      // Act
      const result = await worker.processNotification(
        notificationId,
        entryId,
        userId,
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.messageId).toBeUndefined();
      expect(result.error).toBeUndefined();
    });

    it('should return error result when use case throws error', async () => {
      // Arrange
      const notificationId = 'notification-123';
      const entryId = 'entry-123';
      const userId = 'user-123';
      const errorMessage = 'Failed to send notification: SMTP error';

      sendNotificationUseCase.execute.mockRejectedValue(
        new Error(errorMessage),
      );

      // Act
      const result = await worker.processNotification(
        notificationId,
        entryId,
        userId,
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
      expect(result.messageId).toBeUndefined();
    });

    it('should handle use case error without message and success without messageId', async () => {
      // Arrange
      const notificationId = 'notification-123';
      const entryId = 'entry-123';
      const userId = 'user-123';

      // Test error without message
      sendNotificationUseCase.execute.mockRejectedValueOnce({});

      const errorResult = await worker.processNotification(
        notificationId,
        entryId,
        userId,
      );

      expect(errorResult.success).toBe(false);
      expect(errorResult.error).toBeUndefined();

      // Test success without messageId
      sendNotificationUseCase.execute.mockResolvedValueOnce({
        success: true,
      });

      const successResult = await worker.processNotification(
        notificationId,
        entryId,
        userId,
      );

      expect(successResult.success).toBe(true);
      expect(successResult.messageId).toBeUndefined();
    });
  });
});

