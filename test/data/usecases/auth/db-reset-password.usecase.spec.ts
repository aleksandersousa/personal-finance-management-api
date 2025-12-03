import { DbResetPasswordUseCase } from '@data/usecases';
import {
  PasswordResetTokenRepositoryStub,
  UserRepositoryStub,
} from '@test/data/mocks/repositories';
import { MockUserFactory } from '@test/domain/mocks/models';
import { LoggerStub, HasherStub } from '@test/data/mocks/protocols';
import { PasswordResetTokenModel } from '@domain/models';

describe('DbResetPasswordUseCase', () => {
  let sut: DbResetPasswordUseCase;
  let passwordResetTokenRepositoryStub: PasswordResetTokenRepositoryStub;
  let userRepositoryStub: UserRepositoryStub;
  let hasherStub: HasherStub;
  let loggerStub: LoggerStub;

  beforeEach(() => {
    passwordResetTokenRepositoryStub = new PasswordResetTokenRepositoryStub();
    userRepositoryStub = new UserRepositoryStub();
    hasherStub = new HasherStub();
    loggerStub = new LoggerStub();

    sut = new DbResetPasswordUseCase(
      passwordResetTokenRepositoryStub,
      userRepositoryStub,
      hasherStub,
      loggerStub,
    );
  });

  afterEach(() => {
    passwordResetTokenRepositoryStub.clear();
    userRepositoryStub.clear();
    hasherStub.clear();
    loggerStub.clear();
  });

  describe('execute', () => {
    const mockUser = MockUserFactory.create({
      id: 'user-id',
      name: 'John Doe',
      email: 'john@example.com',
      password: 'old-hashed-password',
    });

    const mockToken: PasswordResetTokenModel = {
      id: 'token-id',
      userId: mockUser.id,
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      usedAt: null,
      createdAt: new Date(),
    };

    it('should reset password successfully with valid token', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      passwordResetTokenRepositoryStub.seed([mockToken]);
      // Hasher stub automatically hashes with 'hashed_' prefix

      // Act
      const result = await sut.execute({
        token: mockToken.token,
        newPassword: 'newPassword123',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Senha redefinida com sucesso!');
      const updatedUser = await userRepositoryStub.findById(mockUser.id);
      expect(updatedUser?.password).toBe('hashed_newPassword123');
      const token = await passwordResetTokenRepositoryStub.findByToken(
        mockToken.token,
      );
      expect(token?.usedAt).not.toBeNull();
    });

    it('should throw error for invalid token', async () => {
      // Arrange
      const invalidToken = 'invalid-token';

      // Act & Assert
      await expect(
        sut.execute({
          token: invalidToken,
          newPassword: 'newPassword123',
        }),
      ).rejects.toThrow('Invalid or expired password reset token');
    });

    it('should throw error for expired token', async () => {
      // Arrange
      const expiredToken: PasswordResetTokenModel = {
        ...mockToken,
        expiresAt: new Date(Date.now() - 1000), // Expired
      };
      passwordResetTokenRepositoryStub.seed([expiredToken]);

      // Act & Assert
      await expect(
        sut.execute({
          token: expiredToken.token,
          newPassword: 'newPassword123',
        }),
      ).rejects.toThrow('Password reset token has expired');
    });

    it('should throw error for already used token', async () => {
      // Arrange
      const usedToken: PasswordResetTokenModel = {
        ...mockToken,
        usedAt: new Date(),
      };
      passwordResetTokenRepositoryStub.seed([usedToken]);

      // Act & Assert
      await expect(
        sut.execute({
          token: usedToken.token,
          newPassword: 'newPassword123',
        }),
      ).rejects.toThrow('Password reset token has already been used');
    });

    it('should throw error for weak password (less than 6 characters)', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      const freshToken: PasswordResetTokenModel = {
        ...mockToken,
        id: 'token-weak-password',
        token: 'token-weak-password',
        usedAt: null,
      };
      passwordResetTokenRepositoryStub.seed([freshToken]);

      // Act & Assert
      await expect(
        sut.execute({
          token: freshToken.token,
          newPassword: '12345', // Only 5 characters
        }),
      ).rejects.toThrow('Password must be at least 6 characters long');
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const tokenWithInvalidUserId: PasswordResetTokenModel = {
        ...mockToken,
        id: 'token-invalid-user',
        token: 'token-invalid-user',
        userId: 'non-existent-user-id',
        usedAt: null,
      };
      passwordResetTokenRepositoryStub.seed([tokenWithInvalidUserId]);

      // Act & Assert
      await expect(
        sut.execute({
          token: tokenWithInvalidUserId.token,
          newPassword: 'newPassword123',
        }),
      ).rejects.toThrow('User not found');
    });

    it('should delete all unused tokens for user after successful reset', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      const token1: PasswordResetTokenModel = {
        id: 'token-1',
        userId: mockUser.id,
        token: 'token-1',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        usedAt: null,
        createdAt: new Date(),
      };
      const token2: PasswordResetTokenModel = {
        id: 'token-2',
        userId: mockUser.id,
        token: 'token-2',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        usedAt: null,
        createdAt: new Date(),
      };
      passwordResetTokenRepositoryStub.seed([token1, token2]);
      // Hasher stub automatically hashes with 'hashed_' prefix

      // Act
      await sut.execute({
        token: token1.token,
        newPassword: 'newPassword123',
      });

      // Assert
      const tokens = passwordResetTokenRepositoryStub.getTokensByUserId(
        mockUser.id,
      );
      // Only the used token should remain
      expect(tokens.length).toBe(1);
      expect(tokens[0].usedAt).not.toBeNull();
    });
  });
});
