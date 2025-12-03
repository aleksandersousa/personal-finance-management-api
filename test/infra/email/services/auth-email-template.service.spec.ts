import { Test, TestingModule } from '@nestjs/testing';
import {
  AuthEmailTemplateService,
  WelcomeEmailData,
  PasswordResetEmailData,
  VerifyEmailData,
  BaseEmailTemplateService,
} from '@infra/email/services';

describe('AuthEmailTemplateService', () => {
  let service: AuthEmailTemplateService;
  let renderTemplateSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthEmailTemplateService],
    }).compile();

    service = module.get<AuthEmailTemplateService>(AuthEmailTemplateService);

    // Spy on the protected renderTemplate method
    renderTemplateSpy = jest.spyOn(
      BaseEmailTemplateService.prototype as any,
      'renderTemplate',
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getWelcomeEmail', () => {
    it('should render welcome email template with correct data', async () => {
      // Arrange
      const emailData: WelcomeEmailData = {
        userName: 'John Doe',
        dashboardUrl: 'https://example.com/dashboard',
      };
      const expectedTemplate = {
        subject: 'Welcome to Personal Financial Management!',
        html: '<html>Welcome</html>',
        text: 'Welcome text',
      };
      renderTemplateSpy.mockResolvedValue(expectedTemplate);

      // Act
      const result = await service.getWelcomeEmail(emailData);

      // Assert
      expect(result).toEqual(expectedTemplate);
      expect(renderTemplateSpy).toHaveBeenCalledWith(
        'welcome',
        'Welcome to Personal Financial Management!',
        emailData,
      );
    });
  });

  describe('getPasswordResetEmail', () => {
    it('should render password reset email template with correct data', async () => {
      // Arrange
      const emailData: PasswordResetEmailData = {
        userName: 'John Doe',
        resetUrl: 'https://example.com/reset?token=abc123',
        expirationTime: '1 hour',
      };
      const expectedTemplate = {
        subject: 'Password Reset Request',
        html: '<html>Reset</html>',
        text: 'Reset text',
      };
      renderTemplateSpy.mockResolvedValue(expectedTemplate);

      // Act
      const result = await service.getPasswordResetEmail(emailData);

      // Assert
      expect(result).toEqual(expectedTemplate);
      expect(renderTemplateSpy).toHaveBeenCalledWith(
        'password-reset',
        'Password Reset Request',
        emailData,
      );
    });
  });

  describe('getVerifyEmailEmail', () => {
    it('should render verify email template with correct data', async () => {
      // Arrange
      const emailData: VerifyEmailData = {
        userName: 'John Doe',
        verificationUrl: 'https://example.com/verify?token=abc123',
        expirationTime: '24 hours',
      };
      const expectedTemplate = {
        subject: 'Verify Your Email Address',
        html: '<html>Verify</html>',
        text: 'Verify text',
      };
      renderTemplateSpy.mockResolvedValue(expectedTemplate);

      // Act
      const result = await service.getVerifyEmailEmail(emailData);

      // Assert
      expect(result).toEqual(expectedTemplate);
      expect(renderTemplateSpy).toHaveBeenCalledWith(
        'verify-email',
        'Verify Your Email Address',
        emailData,
      );
    });
  });

  describe('error handling', () => {
    it('should propagate errors from base service', async () => {
      // Arrange
      const emailData: WelcomeEmailData = {
        userName: 'John Doe',
        dashboardUrl: 'https://example.com/dashboard',
      };
      const error = new Error('Template rendering failed');
      renderTemplateSpy.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getWelcomeEmail(emailData)).rejects.toThrow(
        'Template rendering failed',
      );
    });
  });
});
