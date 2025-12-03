import { DbVerifyEmailUseCase } from '@data/usecases/db-verify-email.usecase';
import {
  EmailVerificationTokenRepositoryStub,
  UserRepositoryStub,
} from '@test/data/mocks/repositories';
import { MockUserFactory } from '@test/domain/mocks/models';
import {
  LoggerStub,
  EmailSenderStub,
  AuthEmailTemplateServiceStub,
} from '@test/data/mocks/protocols';
import { EmailVerificationTokenModel } from '@domain/models/email-verification-token.model';

describe('DbVerifyEmailUseCase', () => {
  let sut: DbVerifyEmailUseCase;
  let emailVerificationTokenRepositoryStub: EmailVerificationTokenRepositoryStub;
  let userRepositoryStub: UserRepositoryStub;
  let loggerStub: LoggerStub;
  let emailSenderStub: EmailSenderStub;
  let authEmailTemplatesStub: AuthEmailTemplateServiceStub;

  beforeEach(() => {
    emailVerificationTokenRepositoryStub =
      new EmailVerificationTokenRepositoryStub();
    userRepositoryStub = new UserRepositoryStub();
    loggerStub = new LoggerStub();
    emailSenderStub = new EmailSenderStub();
    authEmailTemplatesStub = new AuthEmailTemplateServiceStub();

    sut = new DbVerifyEmailUseCase(
      emailVerificationTokenRepositoryStub,
      userRepositoryStub,
      loggerStub,
      emailSenderStub,
      authEmailTemplatesStub,
    );
  });

  afterEach(() => {
    emailVerificationTokenRepositoryStub.clear();
    userRepositoryStub.clear();
    loggerStub.clear();
    emailSenderStub.clear();
    authEmailTemplatesStub.clear();
  });

  describe('execute', () => {
    const mockUser = MockUserFactory.create({
      id: 'user-id',
      name: 'John Doe',
      email: 'john@example.com',
      emailVerified: false,
    });

    const mockToken: EmailVerificationTokenModel = {
      id: 'token-id',
      userId: mockUser.id,
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      usedAt: null,
      createdAt: new Date(),
    };

    it('should verify email successfully with valid token', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      emailVerificationTokenRepositoryStub.seed([mockToken]);

      // Act
      const result = await sut.execute({ token: mockToken.token });

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('E-mail verificado com sucesso!');
      const updatedUser = await userRepositoryStub.findById(mockUser.id);
      expect(updatedUser?.emailVerified).toBe(true);
      const token = await emailVerificationTokenRepositoryStub.findByToken(
        mockToken.token,
      );
      expect(token?.usedAt).not.toBeNull();
      expect(emailSenderStub.getEmailCount()).toBe(1);
      expect(authEmailTemplatesStub.wasWelcomeEmailRendered()).toBe(true);
    });

    it('should throw error for invalid token', async () => {
      // Arrange
      const invalidToken = 'invalid-token';

      // Act & Assert
      await expect(sut.execute({ token: invalidToken })).rejects.toThrow(
        'Invalid verification token',
      );
      expect(emailSenderStub.getEmailCount()).toBe(0);
    });

    it('should throw error for expired token', async () => {
      // Arrange
      const expiredToken: EmailVerificationTokenModel = {
        ...mockToken,
        expiresAt: new Date(Date.now() - 1000), // Expired
      };
      emailVerificationTokenRepositoryStub.seed([expiredToken]);

      // Act & Assert
      await expect(sut.execute({ token: expiredToken.token })).rejects.toThrow(
        'Verification token has expired',
      );
      expect(emailSenderStub.getEmailCount()).toBe(0);
    });

    it('should throw error for already used token', async () => {
      // Arrange
      const usedToken: EmailVerificationTokenModel = {
        ...mockToken,
        usedAt: new Date(),
      };
      emailVerificationTokenRepositoryStub.seed([usedToken]);

      // Act & Assert
      await expect(sut.execute({ token: usedToken.token })).rejects.toThrow(
        'Verification token has already been used',
      );
      expect(emailSenderStub.getEmailCount()).toBe(0);
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const tokenWithInvalidUserId: EmailVerificationTokenModel = {
        ...mockToken,
        id: 'token-invalid-user',
        token: 'token-invalid-user',
        userId: 'non-existent-user-id',
        usedAt: null, // Ensure it's not used
      };
      emailVerificationTokenRepositoryStub.clear();
      emailVerificationTokenRepositoryStub.seed([tokenWithInvalidUserId]);

      // Act & Assert
      await expect(
        sut.execute({ token: tokenWithInvalidUserId.token }),
      ).rejects.toThrow('User not found');
    });

    it('should return success if email is already verified', async () => {
      // Arrange
      const verifiedUser = MockUserFactory.create({
        ...mockUser,
        emailVerified: true,
      });
      const freshToken: EmailVerificationTokenModel = {
        ...mockToken,
        id: 'token-already-verified',
        token: 'token-already-verified',
        usedAt: null, // Ensure it's not used
      };
      userRepositoryStub.clear();
      emailVerificationTokenRepositoryStub.clear();
      userRepositoryStub.seed([verifiedUser]);
      emailVerificationTokenRepositoryStub.seed([freshToken]);

      // Act
      const result = await sut.execute({ token: freshToken.token });

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('already verified');
      expect(emailSenderStub.getEmailCount()).toBe(0); // No welcome email if already verified
    });

    it('should delete old unused tokens after verification', async () => {
      // Arrange
      const freshToken: EmailVerificationTokenModel = {
        ...mockToken,
        id: 'token-cleanup-test',
        token: 'token-cleanup-test',
        usedAt: null,
      };
      const oldToken1: EmailVerificationTokenModel = {
        id: 'old-token-1',
        userId: mockUser.id,
        token: 'old-token-1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        usedAt: null,
        createdAt: new Date(Date.now() - 1000),
      };
      const oldToken2: EmailVerificationTokenModel = {
        id: 'old-token-2',
        userId: mockUser.id,
        token: 'old-token-2',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        usedAt: null,
        createdAt: new Date(Date.now() - 2000),
      };
      userRepositoryStub.clear();
      emailVerificationTokenRepositoryStub.clear();
      userRepositoryStub.seed([mockUser]);
      emailVerificationTokenRepositoryStub.seed([
        oldToken1,
        oldToken2,
        freshToken,
      ]);

      // Act
      await sut.execute({ token: freshToken.token });

      // Assert
      const remainingTokens =
        emailVerificationTokenRepositoryStub.getTokensByUserId(mockUser.id);
      // Only the used token should remain (marked as used)
      expect(remainingTokens.length).toBe(1);
      expect(remainingTokens[0].id).toBe(freshToken.id);
      expect(remainingTokens[0].usedAt).not.toBeNull();
    });

    it('should handle token repository errors', async () => {
      // Arrange
      emailVerificationTokenRepositoryStub.mockFailure(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(sut.execute({ token: 'any-token' })).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle user repository errors', async () => {
      // Arrange
      const freshToken: EmailVerificationTokenModel = {
        ...mockToken,
        id: 'token-user-error',
        token: 'token-user-error',
        usedAt: null,
      };
      emailVerificationTokenRepositoryStub.clear();
      emailVerificationTokenRepositoryStub.seed([freshToken]);
      userRepositoryStub.clear();
      userRepositoryStub.mockFailure(new Error('User repository error'));

      // Act & Assert
      await expect(sut.execute({ token: freshToken.token })).rejects.toThrow(
        'User repository error',
      );
    });

    it('should send welcome email after successful verification', async () => {
      // Arrange
      const freshToken: EmailVerificationTokenModel = {
        ...mockToken,
        id: 'token-welcome-email',
        token: 'token-welcome-email',
        usedAt: null,
      };
      userRepositoryStub.clear();
      emailVerificationTokenRepositoryStub.clear();
      userRepositoryStub.seed([mockUser]);
      emailVerificationTokenRepositoryStub.seed([freshToken]);

      // Act
      await sut.execute({ token: freshToken.token });

      // Assert
      expect(emailSenderStub.getEmailCount()).toBe(1);
      const lastEmail = emailSenderStub.getLastSentEmail();
      expect(lastEmail?.to).toBe(mockUser.email);
      expect(lastEmail?.subject).toBe(
        'Welcome to Personal Financial Management!',
      );
      expect(authEmailTemplatesStub.wasWelcomeEmailRendered()).toBe(true);
    });

    it('should handle email sending errors gracefully', async () => {
      // Arrange
      const freshToken: EmailVerificationTokenModel = {
        ...mockToken,
        id: 'token-email-error',
        token: 'token-email-error',
        usedAt: null,
      };
      userRepositoryStub.clear();
      emailVerificationTokenRepositoryStub.clear();
      userRepositoryStub.seed([mockUser]);
      emailVerificationTokenRepositoryStub.seed([freshToken]);
      emailSenderStub.mockFailure(new Error('Email service error'));

      // Act
      const result = await sut.execute({ token: freshToken.token });

      // Assert
      // Verification should still succeed even if email fails
      expect(result.success).toBe(true);
      const updatedUser = await userRepositoryStub.findById(mockUser.id);
      expect(updatedUser?.emailVerified).toBe(true);
    });
  });
});
