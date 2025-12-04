import { Test, TestingModule } from '@nestjs/testing';
import { EmailWorker } from '@workers/email.worker';
import { EmailSenderStub } from '@test/data/mocks/protocols/email-sender.stub';
import { SendEmailParams } from '@data/protocols/email-sender';

describe('EmailWorker', () => {
  let worker: EmailWorker;
  let emailSenderStub: EmailSenderStub;

  beforeEach(async () => {
    emailSenderStub = new EmailSenderStub();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailWorker,
        {
          provide: 'EmailSender',
          useValue: emailSenderStub,
        },
      ],
    }).compile();

    worker = module.get<EmailWorker>(EmailWorker);
  });

  afterEach(() => {
    emailSenderStub.clear();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(worker).toBeDefined();
  });

  describe('processEmail', () => {
    const baseEmailParams: SendEmailParams = {
      to: 'recipient@example.com',
      subject: 'Test Email',
      text: 'This is a test email',
      html: '<p>This is a test email</p>',
    };

    it('should process email successfully and return result with messageId', async () => {
      // Arrange
      emailSenderStub.mockSuccess();

      // Act
      const result = await worker.processEmail(baseEmailParams);

      // Assert
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.messageId).toMatch(/^mock-message-id-\d+$/);
      expect(result.error).toBeUndefined();
      expect(emailSenderStub.getEmailCount()).toBe(1);
      expect(emailSenderStub.getLastSentEmail()).toEqual(baseEmailParams);
    });

    it('should throw error when email sender returns failure result', async () => {
      // Arrange
      const errorMessage = 'Failed to send email: SMTP connection timeout';
      emailSenderStub.mockFailureResult(errorMessage);

      // Act & Assert
      await expect(worker.processEmail(baseEmailParams)).rejects.toThrow(
        errorMessage,
      );
      // When email fails, the stub doesn't record it as sent
      expect(emailSenderStub.getEmailCount()).toBe(0);
    });

    it('should throw generic error when email sender fails without error message', async () => {
      // Arrange
      emailSenderStub.mockFailureResult('');

      // Act & Assert
      await expect(worker.processEmail(baseEmailParams)).rejects.toThrow(
        'Failed to send email',
      );
    });

    it('should pass email parameters correctly to email sender', async () => {
      // Arrange
      const emailParams: SendEmailParams = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test content',
        html: '<p>Test content</p>',
      };
      emailSenderStub.mockSuccess();

      // Act
      await worker.processEmail(emailParams);

      // Assert
      expect(emailSenderStub.getLastSentEmail()).toEqual(emailParams);
    });
  });
});
