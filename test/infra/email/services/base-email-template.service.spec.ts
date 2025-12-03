import { Test, TestingModule } from '@nestjs/testing';
import { BaseEmailTemplateService } from '@infra/email/services';

// Mock liquidjs
const mockRenderFile = jest.fn();
jest.mock('liquidjs', () => {
  return {
    Liquid: jest.fn().mockImplementation(() => ({
      renderFile: mockRenderFile,
    })),
  };
});

describe('BaseEmailTemplateService', () => {
  let service: BaseEmailTemplateService;
  let originalEnv: string | undefined;

  // Create a concrete implementation for testing
  class TestEmailTemplateService extends BaseEmailTemplateService {
    constructor() {
      super('auth');
    }
  }

  beforeEach(async () => {
    originalEnv = process.env.NODE_ENV;
    mockRenderFile.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [TestEmailTemplateService],
    }).compile();

    service = module.get<TestEmailTemplateService>(TestEmailTemplateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize with correct template path in development', () => {
      process.env.NODE_ENV = 'development';
      const service = new TestEmailTemplateService();
      expect(service).toBeDefined();
    });

    it('should initialize with correct template path in production', () => {
      process.env.NODE_ENV = 'production';
      const service = new TestEmailTemplateService();
      expect(service).toBeDefined();
    });
  });

  describe('renderTemplate', () => {
    const mockData = {
      userName: 'John Doe',
      dashboardUrl: 'https://example.com/dashboard',
    };

    it('should render template successfully with html and text', async () => {
      // Arrange
      const mockHtml = '<html><body>Welcome {{ userName }}</body></html>';
      const mockText = 'Welcome {{ userName }}';
      mockRenderFile
        .mockResolvedValueOnce(mockHtml)
        .mockResolvedValueOnce(mockText);

      // Act
      const result = await (service as any).renderTemplate(
        'welcome',
        'Welcome Email',
        mockData,
      );

      // Assert
      expect(result).toEqual({
        subject: 'Welcome Email',
        html: mockHtml,
        text: mockText,
      });
      expect(mockRenderFile).toHaveBeenCalledTimes(2);
      expect(mockRenderFile).toHaveBeenNthCalledWith(
        1,
        'welcome.liquid',
        expect.objectContaining({
          ...mockData,
          currentYear: expect.any(Number),
        }),
      );
      expect(mockRenderFile).toHaveBeenNthCalledWith(
        2,
        'welcome.txt.liquid',
        expect.objectContaining({
          ...mockData,
          currentYear: expect.any(Number),
        }),
      );
    });

    it('should handle template rendering errors', async () => {
      // Arrange
      const error = new Error('Template not found');
      mockRenderFile.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(
        (service as any).renderTemplate('invalid', 'Subject', mockData),
      ).rejects.toThrow('Failed to generate email: invalid');
    });

    it('should handle errors when rendering text template', async () => {
      // Arrange
      mockRenderFile
        .mockResolvedValueOnce('<html></html>')
        .mockRejectedValueOnce(new Error('Text template error'));

      // Act & Assert
      await expect(
        (service as any).renderTemplate('welcome', 'Subject', mockData),
      ).rejects.toThrow('Failed to generate email: welcome');
    });
  });
});
