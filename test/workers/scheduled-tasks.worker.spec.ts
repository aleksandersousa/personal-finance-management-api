import { ScheduledTasksWorker } from '@workers/scheduled-tasks.worker';
import { EmailVerificationTokenRepositoryStub } from '@test/data/mocks/repositories/email-verification-token-repository.stub';
import { PasswordResetTokenRepositoryStub } from '@test/data/mocks/repositories/password-reset-token-repository.stub';
import { EmailVerificationTokenModel } from '@domain/models/email-verification-token.model';
import { PasswordResetTokenModel } from '@domain/models/password-reset-token.model';
import { EntryModel } from '@domain/models/entry.model';

describe('ScheduledTasksWorker', () => {
  let worker: ScheduledTasksWorker;
  let emailVerificationTokenRepositoryStub: EmailVerificationTokenRepositoryStub;
  let passwordResetTokenRepositoryStub: PasswordResetTokenRepositoryStub;
  let entryRepositoryStub: any;

  beforeEach(() => {
    emailVerificationTokenRepositoryStub =
      new EmailVerificationTokenRepositoryStub();
    passwordResetTokenRepositoryStub = new PasswordResetTokenRepositoryStub();
    entryRepositoryStub = {
      findMonthlyRecurringEntriesInRange: jest.fn(),
      existsMonthlyMirroredEntry: jest.fn(),
      create: jest.fn(),
    };

    worker = new ScheduledTasksWorker(
      emailVerificationTokenRepositoryStub,
      passwordResetTokenRepositoryStub,
      entryRepositoryStub,
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

  describe('mirrorMonthlyRecurringEntries', () => {
    it('creates mirrored entries for monthly recurrence without copying payments', async () => {
      const sourceEntry: EntryModel = {
        id: 'entry-source-1',
        userId: 'user-1',
        categoryId: 'category-1',
        recurrenceId: 'recurrence-1',
        description: 'Rent',
        amount: 1500,
        issueDate: new Date(2026, 0, 31, 10, 0, 0),
        dueDate: new Date(2026, 0, 31, 10, 0, 0),
        recurrence: {
          id: 'recurrence-1',
          type: 'MONTHLY',
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
        },
        payment: {
          id: 'payment-1',
          amount: 1500,
          entryId: 'entry-source-1',
          createdAt: new Date('2026-01-10T12:00:00.000Z'),
        },
        isPaid: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      };

      entryRepositoryStub.findMonthlyRecurringEntriesInRange.mockResolvedValue([
        sourceEntry,
      ]);
      entryRepositoryStub.existsMonthlyMirroredEntry.mockResolvedValue(false);
      entryRepositoryStub.create.mockResolvedValue({ id: 'entry-new-1' });

      const result = await worker.mirrorMonthlyRecurringEntries({
        runDate: '2026-02-01T12:00:00.000Z',
      });

      expect(result).toEqual({
        success: true,
        createdCount: 1,
        skippedCount: 0,
      });
      expect(
        entryRepositoryStub.findMonthlyRecurringEntriesInRange,
      ).toHaveBeenCalledWith({
        startDate: new Date(2026, 0, 1, 0, 0, 0),
        endDate: new Date(2026, 1, 0, 23, 59, 59),
      });
      expect(entryRepositoryStub.create).toHaveBeenCalledWith({
        userId: 'user-1',
        categoryId: 'category-1',
        recurrenceId: 'recurrence-1',
        description: 'Rent',
        amount: 1500,
        issueDate: new Date(2026, 1, 28, 10, 0, 0),
        dueDate: new Date(2026, 1, 28, 10, 0, 0),
      });
    });

    it('skips creation when mirrored entry already exists', async () => {
      const sourceEntry: EntryModel = {
        id: 'entry-source-2',
        userId: 'user-1',
        categoryId: 'category-1',
        recurrenceId: 'recurrence-1',
        description: 'Gym',
        amount: 100,
        issueDate: new Date('2026-03-15T10:00:00.000Z'),
        dueDate: new Date('2026-03-15T10:00:00.000Z'),
        isPaid: false,
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-01T00:00:00.000Z'),
      };

      entryRepositoryStub.findMonthlyRecurringEntriesInRange.mockResolvedValue([
        sourceEntry,
      ]);
      entryRepositoryStub.existsMonthlyMirroredEntry.mockResolvedValue(true);

      const result = await worker.mirrorMonthlyRecurringEntries({
        runDate: '2026-04-01T00:00:00.000Z',
      });

      expect(result).toEqual({
        success: true,
        createdCount: 0,
        skippedCount: 1,
      });
      expect(entryRepositoryStub.create).not.toHaveBeenCalled();
    });

    it('returns failure when repository throws', async () => {
      entryRepositoryStub.findMonthlyRecurringEntriesInRange.mockRejectedValue(
        new Error('query failed'),
      );

      const result = await worker.mirrorMonthlyRecurringEntries({
        runDate: '2026-04-01T00:00:00.000Z',
      });

      expect(result).toEqual({
        success: false,
        createdCount: 0,
        skippedCount: 0,
        error: 'query failed',
      });
    });
  });
});
