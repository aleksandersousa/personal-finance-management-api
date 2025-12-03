import { DbResendVerificationEmailUseCase } from '@data/usecases/db-resend-verification-email.usecase';
import {
  UserRepositoryStub,
  EmailVerificationTokenRepositoryStub,
} from '../mocks/repositories';
import { MockUserFactory } from '../../domain/mocks/models';
import {
  LoggerStub,
  EmailSenderStub,
  AuthEmailTemplateServiceStub,
  VerificationTokenGeneratorStub,
} from '../mocks/protocols';

describe('DbResendVerificationEmailUseCase', () => {
  let sut: DbResendVerificationEmailUseCase;
  let userRepositoryStub: UserRepositoryStub;
  let emailVerificationTokenRepositoryStub: EmailVerificationTokenRepositoryStub;
  let emailSenderStub: EmailSenderStub;
  let authEmailTemplatesStub: AuthEmailTemplateServiceStub;
  let loggerStub: LoggerStub;
  let verificationTokenGeneratorStub: VerificationTokenGeneratorStub;

  beforeEach(() => {
    userRepositoryStub = new UserRepositoryStub();
    emailVerificationTokenRepositoryStub =
      new EmailVerificationTokenRepositoryStub();
    emailSenderStub = new EmailSenderStub();
    authEmailTemplatesStub = new AuthEmailTemplateServiceStub();
    loggerStub = new LoggerStub();
    verificationTokenGeneratorStub = new VerificationTokenGeneratorStub();

    sut = new DbResendVerificationEmailUseCase(
      userRepositoryStub,
      emailVerificationTokenRepositoryStub,
      emailSenderStub,
      authEmailTemplatesStub,
      loggerStub,
      verificationTokenGeneratorStub,
    );
  });

  afterEach(() => {
    userRepositoryStub.clear();
    emailVerificationTokenRepositoryStub.clear();
    emailSenderStub.clear();
    authEmailTemplatesStub.clear();
    loggerStub.clear();
    verificationTokenGeneratorStub.clear();
  });

  describe('execute', () => {
    const mockUser = MockUserFactory.create({
      id: 'user-id',
      name: 'John Doe',
      email: 'john@example.com',
      emailVerified: false,
    });

    it('should resend verification email successfully', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      verificationTokenGeneratorStub.seedTokens(['new-verification-token']);

      // Act
      const result = await sut.execute({ email: mockUser.email });

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('Verification email sent successfully');
      expect(emailVerificationTokenRepositoryStub.getCount()).toBe(1);
      expect(emailSenderStub.getEmailCount()).toBe(1);
      const lastEmail = emailSenderStub.getLastSentEmail();
      expect(lastEmail?.to).toBe(mockUser.email);
      expect(lastEmail?.subject).toBe('Verify Your Email Address');
      const lastTemplate = authEmailTemplatesStub.getLastRenderedTemplate();
      expect(lastTemplate?.type).toBe('verify-email');
    });

    it('should return success for non-existent email (security)', async () => {
      // Arrange
      const nonExistentEmail = 'nonexistent@example.com';

      // Act
      const result = await sut.execute({ email: nonExistentEmail });

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('If the email exists');
      expect(emailSenderStub.getEmailCount()).toBe(0);
      expect(emailVerificationTokenRepositoryStub.getCount()).toBe(0);
    });

    it('should return success if email is already verified', async () => {
      // Arrange
      const verifiedUser = MockUserFactory.create({
        ...mockUser,
        emailVerified: true,
      });
      userRepositoryStub.seed([verifiedUser]);

      // Act
      const result = await sut.execute({ email: verifiedUser.email });

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('already verified');
      expect(emailSenderStub.getEmailCount()).toBe(0);
      expect(emailVerificationTokenRepositoryStub.getCount()).toBe(0);
    });

    it('should delete old unused tokens before creating new one', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      verificationTokenGeneratorStub.seedTokens(['new-token']);

      // Create old tokens
      const oldToken1 = await emailVerificationTokenRepositoryStub.create(
        mockUser.id,
        'old-token-1',
        new Date(Date.now() + 24 * 60 * 60 * 1000),
      );
      const oldToken2 = await emailVerificationTokenRepositoryStub.create(
        mockUser.id,
        'old-token-2',
        new Date(Date.now() + 24 * 60 * 60 * 1000),
      );

      // Act
      await sut.execute({ email: mockUser.email });

      // Assert
      const tokens = emailVerificationTokenRepositoryStub.getTokensByUserId(
        mockUser.id,
      );
      // Should only have the new token
      expect(tokens.length).toBe(1);
      expect(tokens[0].token).toBe('new-token');
      expect(tokens[0].id).not.toBe(oldToken1.id);
      expect(tokens[0].id).not.toBe(oldToken2.id);
    });

    it('should normalize email to lowercase', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      verificationTokenGeneratorStub.seedTokens(['new-token']);

      // Act
      await sut.execute({ email: 'JOHN@EXAMPLE.COM' });

      // Assert
      expect(emailSenderStub.getEmailCount()).toBe(1);
      const lastEmail = emailSenderStub.getLastSentEmail();
      expect(lastEmail?.to).toBe(mockUser.email.toLowerCase());
    });

    it('should handle user repository errors', async () => {
      // Arrange
      userRepositoryStub.mockFailure(new Error('Database error'));

      // Act & Assert
      await expect(sut.execute({ email: mockUser.email })).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle token repository errors', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      verificationTokenGeneratorStub.seedTokens(['new-token']);
      emailVerificationTokenRepositoryStub.mockFailure(
        new Error('Token creation failed'),
      );

      // Act & Assert
      await expect(sut.execute({ email: mockUser.email })).rejects.toThrow(
        'Token creation failed',
      );
    });

    it('should handle email sending errors', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      verificationTokenGeneratorStub.seedTokens(['new-token']);
      emailSenderStub.mockFailure(new Error('Email service error'));

      // Act & Assert
      await expect(sut.execute({ email: mockUser.email })).rejects.toThrow(
        'Failed to send verification email',
      );
    });

    it('should handle email template rendering errors', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      verificationTokenGeneratorStub.seedTokens(['new-token']);
      authEmailTemplatesStub.mockFailure(new Error('Template error'));

      // Act & Assert
      await expect(sut.execute({ email: mockUser.email })).rejects.toThrow(
        'Template error',
      );
    });

    it('should use verification token generator', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      verificationTokenGeneratorStub.seedTokens(['generated-token-123']);

      // Act
      await sut.execute({ email: mockUser.email });

      // Assert
      expect(verificationTokenGeneratorStub.getTokenCount()).toBe(1);
      const tokens = emailVerificationTokenRepositoryStub.getTokensByUserId(
        mockUser.id,
      );
      expect(tokens[0].token).toBe('generated-token-123');
    });
  });
});
