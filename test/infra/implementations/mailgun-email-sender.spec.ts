import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailgunEmailSender } from '@infra/implementations/mailgun-email-sender';
import { SendEmailParams } from '@data/protocols/email-sender';

// Create mock client - must be defined before jest.mock
const mockMailgunClient = {
  messages: {
    create: jest.fn(),
  },
};

const mockClientMethod = jest.fn().mockReturnValue(mockMailgunClient);

// Mock mailgun.js
jest.mock('mailgun.js', () => {
  const MockMailgun = jest.fn().mockImplementation(() => ({
    client: mockClientMethod,
  }));
  return {
    __esModule: true,
    default: MockMailgun,
  };
});

import Mailgun from 'mailgun.js';

describe('MailgunEmailSender', () => {
  let service: MailgunEmailSender;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    const configServiceMock = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          MAILGUN_API_URL: 'https://api.mailgun.net',
          MAILGUN_API_KEY: 'test-api-key',
          MAILGUN_FROM_EMAIL: 'noreply@example.com',
          MAILGUN_FROM_NAME: 'Test App',
          MAILGUN_DOMAIN: 'example.com',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailgunEmailSender,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    service = module.get<MailgunEmailSender>(MailgunEmailSender);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize Mailgun client with correct configuration', () => {
      expect(Mailgun).toHaveBeenCalledWith(FormData);
      expect(configService.get).toHaveBeenCalledWith('MAILGUN_API_URL');
      expect(configService.get).toHaveBeenCalledWith('MAILGUN_API_KEY');
      expect(configService.get).toHaveBeenCalledWith('MAILGUN_FROM_EMAIL');
      expect(configService.get).toHaveBeenCalledWith('MAILGUN_FROM_NAME');
      expect(configService.get).toHaveBeenCalledWith('MAILGUN_DOMAIN');
    });
  });

  describe('send', () => {
    const baseParams: SendEmailParams = {
      to: 'recipient@example.com',
      subject: 'Test Subject',
      text: 'Test email body',
      html: '<p>Test email body</p>',
    };

    it('should send email successfully', async () => {
      // Arrange
      const mockResponse = { id: 'message-id-123' };
      mockMailgunClient.messages.create.mockResolvedValue(mockResponse);

      // Act
      const result = await service.send(baseParams);

      // Assert
      expect(result).toEqual({
        success: true,
        messageId: 'message-id-123',
      });
      expect(mockMailgunClient.messages.create).toHaveBeenCalledWith(
        'example.com',
        expect.objectContaining({
          from: 'Test App <noreply@example.com>',
          to: ['recipient@example.com'],
          subject: 'Test Subject',
          text: 'Test email body',
          html: '<p>Test email body</p>',
        }),
      );
    });

    it('should use custom from address when provided', async () => {
      // Arrange
      const params: SendEmailParams = {
        ...baseParams,
        from: 'custom@example.com',
      };
      const mockResponse = { id: 'message-id-456' };
      mockMailgunClient.messages.create.mockResolvedValue(mockResponse);

      // Act
      const result = await service.send(params);

      // Assert
      expect(result.success).toBe(true);
      expect(mockMailgunClient.messages.create).toHaveBeenCalledWith(
        'example.com',
        expect.objectContaining({
          from: 'custom@example.com',
        }),
      );
    });

    it('should handle array of recipients', async () => {
      // Arrange
      const params: SendEmailParams = {
        ...baseParams,
        to: ['recipient1@example.com', 'recipient2@example.com'],
      };
      const mockResponse = { id: 'message-id-789' };
      mockMailgunClient.messages.create.mockResolvedValue(mockResponse);

      // Act
      const result = await service.send(params);

      // Assert
      expect(result.success).toBe(true);
      expect(mockMailgunClient.messages.create).toHaveBeenCalledWith(
        'example.com',
        expect.objectContaining({
          to: ['recipient1@example.com', 'recipient2@example.com'],
        }),
      );
    });

    it('should handle single recipient as string', async () => {
      // Arrange
      const params: SendEmailParams = {
        ...baseParams,
        to: 'single@example.com',
      };
      const mockResponse = { id: 'message-id-single' };
      mockMailgunClient.messages.create.mockResolvedValue(mockResponse);

      // Act
      const result = await service.send(params);

      // Assert
      expect(result.success).toBe(true);
      expect(mockMailgunClient.messages.create).toHaveBeenCalledWith(
        'example.com',
        expect.objectContaining({
          to: ['single@example.com'],
        }),
      );
    });

    it('should include CC recipients', async () => {
      // Arrange
      const params: SendEmailParams = {
        ...baseParams,
        cc: ['cc1@example.com', 'cc2@example.com'],
      };
      const mockResponse = { id: 'message-id-cc' };
      mockMailgunClient.messages.create.mockResolvedValue(mockResponse);

      // Act
      const result = await service.send(params);

      // Assert
      expect(result.success).toBe(true);
      expect(mockMailgunClient.messages.create).toHaveBeenCalledWith(
        'example.com',
        expect.objectContaining({
          cc: ['cc1@example.com', 'cc2@example.com'],
        }),
      );
    });

    it('should include single CC recipient as string', async () => {
      // Arrange
      const params: SendEmailParams = {
        ...baseParams,
        cc: 'cc@example.com',
      };
      const mockResponse = { id: 'message-id-cc-single' };
      mockMailgunClient.messages.create.mockResolvedValue(mockResponse);

      // Act
      const result = await service.send(params);

      // Assert
      expect(result.success).toBe(true);
      expect(mockMailgunClient.messages.create).toHaveBeenCalledWith(
        'example.com',
        expect.objectContaining({
          cc: ['cc@example.com'],
        }),
      );
    });

    it('should include BCC recipients', async () => {
      // Arrange
      const params: SendEmailParams = {
        ...baseParams,
        bcc: ['bcc1@example.com', 'bcc2@example.com'],
      };
      const mockResponse = { id: 'message-id-bcc' };
      mockMailgunClient.messages.create.mockResolvedValue(mockResponse);

      // Act
      const result = await service.send(params);

      // Assert
      expect(result.success).toBe(true);
      expect(mockMailgunClient.messages.create).toHaveBeenCalledWith(
        'example.com',
        expect.objectContaining({
          bcc: ['bcc1@example.com', 'bcc2@example.com'],
        }),
      );
    });

    it('should include reply-to address', async () => {
      // Arrange
      const params: SendEmailParams = {
        ...baseParams,
        replyTo: 'reply@example.com',
      };
      const mockResponse = { id: 'message-id-reply' };
      mockMailgunClient.messages.create.mockResolvedValue(mockResponse);

      // Act
      const result = await service.send(params);

      // Assert
      expect(result.success).toBe(true);
      expect(mockMailgunClient.messages.create).toHaveBeenCalledWith(
        'example.com',
        expect.objectContaining({
          'h:Reply-To': 'reply@example.com',
        }),
      );
    });

    it('should handle attachments with string content', async () => {
      // Arrange
      const params: SendEmailParams = {
        ...baseParams,
        attachments: [
          {
            filename: 'test.txt',
            content: 'file content',
          },
        ],
      };
      const mockResponse = { id: 'message-id-attach' };
      mockMailgunClient.messages.create.mockResolvedValue(mockResponse);

      // Act
      const result = await service.send(params);

      // Assert
      expect(result.success).toBe(true);
      const callArgs = mockMailgunClient.messages.create.mock.calls[0][1];
      expect(callArgs.attachment).toBeDefined();
      expect(callArgs.attachment).toHaveLength(1);
      expect(callArgs.attachment[0].filename).toBe('test.txt');
      expect(Buffer.isBuffer(callArgs.attachment[0].data)).toBe(true);
    });

    it('should handle attachments with Buffer content', async () => {
      // Arrange
      const bufferContent = Buffer.from('buffer content');
      const params: SendEmailParams = {
        ...baseParams,
        attachments: [
          {
            filename: 'test.bin',
            content: bufferContent,
          },
        ],
      };
      const mockResponse = { id: 'message-id-attach-buffer' };
      mockMailgunClient.messages.create.mockResolvedValue(mockResponse);

      // Act
      const result = await service.send(params);

      // Assert
      expect(result.success).toBe(true);
      const callArgs = mockMailgunClient.messages.create.mock.calls[0][1];
      expect(callArgs.attachment[0].data).toBe(bufferContent);
    });

    it('should handle multiple attachments', async () => {
      // Arrange
      const params: SendEmailParams = {
        ...baseParams,
        attachments: [
          {
            filename: 'file1.txt',
            content: 'content1',
          },
          {
            filename: 'file2.txt',
            content: 'content2',
          },
        ],
      };
      const mockResponse = { id: 'message-id-multi-attach' };
      mockMailgunClient.messages.create.mockResolvedValue(mockResponse);

      // Act
      const result = await service.send(params);

      // Assert
      expect(result.success).toBe(true);
      const callArgs = mockMailgunClient.messages.create.mock.calls[0][1];
      expect(callArgs.attachment).toHaveLength(2);
    });

    it('should send email with only text content', async () => {
      // Arrange
      const params: SendEmailParams = {
        to: 'recipient@example.com',
        subject: 'Text Only',
        text: 'Plain text email',
      };
      const mockResponse = { id: 'message-id-text' };
      mockMailgunClient.messages.create.mockResolvedValue(mockResponse);

      // Act
      const result = await service.send(params);

      // Assert
      expect(result.success).toBe(true);
      expect(mockMailgunClient.messages.create).toHaveBeenCalledWith(
        'example.com',
        expect.objectContaining({
          text: 'Plain text email',
        }),
      );
      const callArgs = mockMailgunClient.messages.create.mock.calls[0][1];
      expect(callArgs.html).toBeUndefined();
    });

    it('should send email with only HTML content', async () => {
      // Arrange
      const params: SendEmailParams = {
        to: 'recipient@example.com',
        subject: 'HTML Only',
        html: '<p>HTML email</p>',
      };
      const mockResponse = { id: 'message-id-html' };
      mockMailgunClient.messages.create.mockResolvedValue(mockResponse);

      // Act
      const result = await service.send(params);

      // Assert
      expect(result.success).toBe(true);
      expect(mockMailgunClient.messages.create).toHaveBeenCalledWith(
        'example.com',
        expect.objectContaining({
          html: '<p>HTML email</p>',
        }),
      );
      const callArgs = mockMailgunClient.messages.create.mock.calls[0][1];
      expect(callArgs.text).toBeUndefined();
    });

    it('should handle Mailgun API errors gracefully', async () => {
      // Arrange
      const error = new Error('Mailgun API error: Invalid API key');
      mockMailgunClient.messages.create.mockRejectedValue(error);

      // Act
      const result = await service.send(baseParams);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Mailgun API error: Invalid API key',
      });
    });

    it('should handle network errors', async () => {
      // Arrange
      const error = new Error('Network timeout');
      mockMailgunClient.messages.create.mockRejectedValue(error);

      // Act
      const result = await service.send(baseParams);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Network timeout',
      });
    });

    it('should handle errors without message property', async () => {
      // Arrange
      const error = { code: 'ERROR_CODE' } as unknown as Error;
      mockMailgunClient.messages.create.mockRejectedValue(error);

      // Act
      const result = await service.send(baseParams);

      // Assert
      expect(result.success).toBe(false);
      // When error doesn't have message property, error.message is undefined
      expect(result.error).toBeUndefined();
    });
  });
});
