import { DbRequestPasswordResetUseCase } from '@data/usecases';
import {
  PasswordResetTokenRepositoryStub,
  UserRepositoryStub,
} from '@test/data/mocks/repositories';
import { MockUserFactory } from '@test/domain/mocks/models';
import {
  LoggerStub,
  EmailSenderStub,
  AuthEmailTemplateServiceStub,
  VerificationTokenGeneratorStub,
} from '@test/data/mocks/protocols';
import { PasswordResetTokenModel } from '@domain/models';

describe('DbRequestPasswordResetUseCase', () => {
  let sut: DbRequestPasswordResetUseCase;
  let passwordResetTokenRepositoryStub: PasswordResetTokenRepositoryStub;
  let userRepositoryStub: UserRepositoryStub;
  let loggerStub: LoggerStub;
  let emailSenderStub: EmailSenderStub;
  let authEmailTemplatesStub: AuthEmailTemplateServiceStub;
  let verificationTokenGeneratorStub: VerificationTokenGeneratorStub;

  beforeEach(() => {
    passwordResetTokenRepositoryStub = new PasswordResetTokenRepositoryStub();
    userRepositoryStub = new UserRepositoryStub();
    loggerStub = new LoggerStub();
    emailSenderStub = new EmailSenderStub();
    authEmailTemplatesStub = new AuthEmailTemplateServiceStub();
    verificationTokenGeneratorStub = new VerificationTokenGeneratorStub();

    sut = new DbRequestPasswordResetUseCase(
      userRepositoryStub,
      passwordResetTokenRepositoryStub,
      verificationTokenGeneratorStub,
      emailSenderStub,
      authEmailTemplatesStub,
      loggerStub,
    );
  });

  afterEach(() => {
    passwordResetTokenRepositoryStub.clear();
    userRepositoryStub.clear();
    loggerStub.clear();
    emailSenderStub.clear();
    authEmailTemplatesStub.clear();
    verificationTokenGeneratorStub.clear();
  });

  describe('execute', () => {
    const mockUser = MockUserFactory.create({
      id: 'user-id',
      name: 'John Doe',
      email: 'john@example.com',
      emailVerified: true,
    });

    it('should request password reset successfully', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      verificationTokenGeneratorStub.seedTokens(['reset-token-123']);

      // Act
      const result = await sut.execute({ email: mockUser.email });

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('password reset link has been sent');
      expect(emailSenderStub.getEmailCount()).toBe(1);
      expect(authEmailTemplatesStub.wasPasswordResetEmailRendered()).toBe(true);
      const tokens = passwordResetTokenRepositoryStub.getTokensByUserId(
        mockUser.id,
      );
      expect(tokens.length).toBe(1);
      expect(tokens[0].token).toBe('reset-token-123');
    });

    it('should return generic message for invalid email format', async () => {
      // Arrange
      const invalidEmail = 'invalid-email';

      // Act
      const result = await sut.execute({ email: invalidEmail });

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('password reset link has been sent');
      expect(emailSenderStub.getEmailCount()).toBe(0);
    });

    it('should return generic message when user not found', async () => {
      // Arrange
      const nonExistentEmail = 'nonexistent@example.com';

      // Act
      const result = await sut.execute({ email: nonExistentEmail });

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('password reset link has been sent');
      expect(emailSenderStub.getEmailCount()).toBe(0);
    });

    it('should throw error when email is not verified', async () => {
      // Arrange
      const unverifiedUser = MockUserFactory.create({
        ...mockUser,
        emailVerified: false,
      });
      userRepositoryStub.seed([unverifiedUser]);

      // Act & Assert
      await expect(
        sut.execute({ email: unverifiedUser.email }),
      ).rejects.toThrow('Email not verified');
      expect(emailSenderStub.getEmailCount()).toBe(0);
    });

    it('should throw error when rate limit exceeded (3 requests in 1 hour)', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      const now = new Date();
      const recentTokens: PasswordResetTokenModel[] = [
        {
          id: 'token-1',
          userId: mockUser.id,
          token: 'token-1',
          expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
          usedAt: null,
          createdAt: new Date(now.getTime() - 10 * 60 * 1000), // 10 minutes ago
        },
        {
          id: 'token-2',
          userId: mockUser.id,
          token: 'token-2',
          expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
          usedAt: null,
          createdAt: new Date(now.getTime() - 20 * 60 * 1000), // 20 minutes ago
        },
        {
          id: 'token-3',
          userId: mockUser.id,
          token: 'token-3',
          expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
          usedAt: null,
          createdAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
        },
      ];
      passwordResetTokenRepositoryStub.seed(recentTokens);

      // Act & Assert
      await expect(sut.execute({ email: mockUser.email })).rejects.toThrow(
        'Too many password reset requests',
      );
      expect(emailSenderStub.getEmailCount()).toBe(0);
    });

    it('should delete old unused tokens when creating new one', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      const oldToken: PasswordResetTokenModel = {
        id: 'old-token',
        userId: mockUser.id,
        token: 'old-token',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        usedAt: null,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      };
      passwordResetTokenRepositoryStub.seed([oldToken]);
      verificationTokenGeneratorStub.seedTokens(['new-token']);

      // Act
      await sut.execute({ email: mockUser.email });

      // Assert
      const tokens = passwordResetTokenRepositoryStub.getTokensByUserId(
        mockUser.id,
      );
      expect(tokens.length).toBe(1);
      expect(tokens[0].token).toBe('new-token');
    });

    it('should throw error when email sending fails', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      emailSenderStub.mockFailure(new Error('Email service unavailable'));
      verificationTokenGeneratorStub.seedTokens(['reset-token-123']);

      // Act & Assert
      await expect(sut.execute({ email: mockUser.email })).rejects.toThrow(
        'Failed to send password reset email',
      );
    });
  });
});
