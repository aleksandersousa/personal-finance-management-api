import { ScheduledTasksWorker } from '@workers/scheduled-tasks.worker';
import { EmailVerificationTokenRepositoryStub } from '@test/data/mocks/repositories/email-verification-token-repository.stub';
import { PasswordResetTokenRepositoryStub } from '@test/data/mocks/repositories/password-reset-token-repository.stub';
import { EmailVerificationTokenModel } from '@domain/models/email-verification-token.model';
import { PasswordResetTokenModel } from '@domain/models/password-reset-token.model';

describe('ScheduledTasksWorker', () => {
  let worker: ScheduledTasksWorker;
  let emailVerificationTokenRepositoryStub: EmailVerificationTokenRepositoryStub;
  let passwordResetTokenRepositoryStub: PasswordResetTokenRepositoryStub;

  beforeEach(() => {
    emailVerificationTokenRepositoryStub =
      new EmailVerificationTokenRepositoryStub();
    passwordResetTokenRepositoryStub = new PasswordResetTokenRepositoryStub();

    worker = new ScheduledTasksWorker(
      emailVerificationTokenRepositoryStub,
      passwordResetTokenRepositoryStub,
    );
  });

  afterEach(() => {
    emailVerificationTokenRepositoryStub.clear();
    passwordResetTokenRepositoryStub.clear();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(worker).toBeDefined();
  });

  describe('cleanupExpiredTokens', () => {
    it('should cleanup only email verification tokens when tokenType is email-verification', async () => {
      // Arrange
      const expiredEmailToken: EmailVerificationTokenModel = {
        id: 'expired-email-token-1',
        userId: 'user-1',
        token: 'expired-token-1',
        expiresAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        usedAt: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      };
      const validEmailToken: EmailVerificationTokenModel = {
        id: 'valid-email-token-1',
        userId: 'user-1',
        token: 'valid-token-1',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
        usedAt: null,
        createdAt: new Date(),
      };
      const expiredPasswordToken: PasswordResetTokenModel = {
        id: 'expired-password-token-1',
        userId: 'user-1',
        token: 'expired-password-token-1',
        expiresAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        usedAt: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      };

      emailVerificationTokenRepositoryStub.seed([
        expiredEmailToken,
        validEmailToken,
      ]);
      passwordResetTokenRepositoryStub.seed([expiredPasswordToken]);

      // Act
      const result = await worker.cleanupExpiredTokens({
        tokenType: 'email-verification',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.cleanedTypes).toEqual(['email-verification']);
      expect(result.error).toBeUndefined();
      expect(
        emailVerificationTokenRepositoryStub.getTokenById(
          'expired-email-token-1',
        ),
      ).toBeUndefined();
      expect(
        emailVerificationTokenRepositoryStub.getTokenById(
          'valid-email-token-1',
        ),
      ).toBeDefined();
      expect(
        passwordResetTokenRepositoryStub.getTokenById(
          'expired-password-token-1',
        ),
      ).toBeDefined(); // Should not be cleaned
    });

    it('should cleanup only password reset tokens when tokenType is password-reset', async () => {
      // Arrange
      const expiredEmailToken: EmailVerificationTokenModel = {
        id: 'expired-email-token-1',
        userId: 'user-1',
        token: 'expired-token-1',
        expiresAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        usedAt: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      };
      const expiredPasswordToken: PasswordResetTokenModel = {
        id: 'expired-password-token-1',
        userId: 'user-1',
        token: 'expired-password-token-1',
        expiresAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        usedAt: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      };
      const validPasswordToken: PasswordResetTokenModel = {
        id: 'valid-password-token-1',
        userId: 'user-1',
        token: 'valid-password-token-1',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
        usedAt: null,
        createdAt: new Date(),
      };

      emailVerificationTokenRepositoryStub.seed([expiredEmailToken]);
      passwordResetTokenRepositoryStub.seed([
        expiredPasswordToken,
        validPasswordToken,
      ]);

      // Act
      const result = await worker.cleanupExpiredTokens({
        tokenType: 'password-reset',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.cleanedTypes).toEqual(['password-reset']);
      expect(result.error).toBeUndefined();
      expect(
        passwordResetTokenRepositoryStub.getTokenById(
          'expired-password-token-1',
        ),
      ).toBeUndefined();
      expect(
        passwordResetTokenRepositoryStub.getTokenById('valid-password-token-1'),
      ).toBeDefined();
      expect(
        emailVerificationTokenRepositoryStub.getTokenById(
          'expired-email-token-1',
        ),
      ).toBeDefined(); // Should not be cleaned
    });

    it('should cleanup both token types when tokenType is all', async () => {
      // Arrange
      const expiredEmailToken: EmailVerificationTokenModel = {
        id: 'expired-email-token-1',
        userId: 'user-1',
        token: 'expired-token-1',
        expiresAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        usedAt: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      };
      const expiredPasswordToken: PasswordResetTokenModel = {
        id: 'expired-password-token-1',
        userId: 'user-1',
        token: 'expired-password-token-1',
        expiresAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        usedAt: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      };
      const validEmailToken: EmailVerificationTokenModel = {
        id: 'valid-email-token-1',
        userId: 'user-1',
        token: 'valid-token-1',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
        usedAt: null,
        createdAt: new Date(),
      };
      const validPasswordToken: PasswordResetTokenModel = {
        id: 'valid-password-token-1',
        userId: 'user-1',
        token: 'valid-password-token-1',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
        usedAt: null,
        createdAt: new Date(),
      };

      emailVerificationTokenRepositoryStub.seed([
        expiredEmailToken,
        validEmailToken,
      ]);
      passwordResetTokenRepositoryStub.seed([
        expiredPasswordToken,
        validPasswordToken,
      ]);

      // Act
      const result = await worker.cleanupExpiredTokens({ tokenType: 'all' });

      // Assert
      expect(result.success).toBe(true);
      expect(result.cleanedTypes).toHaveLength(2);
      expect(result.cleanedTypes).toContain('email-verification');
      expect(result.cleanedTypes).toContain('password-reset');
      expect(result.error).toBeUndefined();
      expect(
        emailVerificationTokenRepositoryStub.getTokenById(
          'expired-email-token-1',
        ),
      ).toBeUndefined();
      expect(
        passwordResetTokenRepositoryStub.getTokenById(
          'expired-password-token-1',
        ),
      ).toBeUndefined();
      expect(
        emailVerificationTokenRepositoryStub.getTokenById(
          'valid-email-token-1',
        ),
      ).toBeDefined();
      expect(
        passwordResetTokenRepositoryStub.getTokenById('valid-password-token-1'),
      ).toBeDefined();
    });

    it('should handle errors from email verification token repository', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      emailVerificationTokenRepositoryStub.mockFailure(error);

      // Act
      const result = await worker.cleanupExpiredTokens({
        tokenType: 'email-verification',
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.cleanedTypes).toEqual([]);
      expect(result.error).toBe('Database connection failed');
    });

    it('should handle errors from password reset token repository', async () => {
      // Arrange
      const error = new Error('Database timeout');
      passwordResetTokenRepositoryStub.mockFailure(error);

      // Act
      const result = await worker.cleanupExpiredTokens({
        tokenType: 'password-reset',
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.cleanedTypes).toEqual([]);
      expect(result.error).toBe('Database timeout');
    });

    it('should return success even when no tokens exist to cleanup', async () => {
      // Arrange - no tokens seeded

      // Act
      const result = await worker.cleanupExpiredTokens({
        tokenType: 'all',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.cleanedTypes).toHaveLength(2);
      expect(result.cleanedTypes).toContain('email-verification');
      expect(result.cleanedTypes).toContain('password-reset');
      expect(result.error).toBeUndefined();
    });
  });
});
