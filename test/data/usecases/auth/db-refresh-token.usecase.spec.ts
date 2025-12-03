import { DbRefreshTokenUseCase } from '@data/usecases';
import { TokenGenerator } from '@data/protocols/token-generator';
import { UserRepository } from '@data/protocols/repositories';

describe('DbRefreshTokenUseCase', () => {
  let sut: DbRefreshTokenUseCase;
  let mockTokenGenerator: jest.Mocked<TokenGenerator>;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockTokenGenerator = {
      generateTokens: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };

    mockUserRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    sut = new DbRefreshTokenUseCase(mockTokenGenerator, mockUserRepository);
  });

  describe('execute', () => {
    it('should refresh tokens successfully', async () => {
      const refreshTokenRequest = {
        refreshToken: 'valid-refresh-token',
      };

      const mockPayload = {
        userId: '123',
        email: 'test@example.com',
      };

      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockTokenGenerator.verifyRefreshToken.mockResolvedValue(mockPayload);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockTokenGenerator.generateTokens.mockResolvedValue(mockTokens);

      const result = await sut.execute(refreshTokenRequest);

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
      expect(mockTokenGenerator.verifyRefreshToken).toHaveBeenCalledWith(
        'valid-refresh-token',
      );
      expect(mockUserRepository.findById).toHaveBeenCalledWith('123');
      expect(mockTokenGenerator.generateTokens).toHaveBeenCalledWith({
        userId: '123',
        email: 'test@example.com',
      });
    });

    it('should throw error if refresh token is not provided', async () => {
      const refreshTokenRequest = {
        refreshToken: '',
      };

      await expect(sut.execute(refreshTokenRequest)).rejects.toThrow(
        'Refresh token is required',
      );
    });

    it('should throw error if refresh token is invalid', async () => {
      const refreshTokenRequest = {
        refreshToken: 'invalid-refresh-token',
      };

      mockTokenGenerator.verifyRefreshToken.mockRejectedValue(
        new Error('Invalid token'),
      );

      await expect(sut.execute(refreshTokenRequest)).rejects.toThrow(
        'Invalid or expired refresh token',
      );
    });

    it('should throw error if user is not found', async () => {
      const refreshTokenRequest = {
        refreshToken: 'valid-refresh-token',
      };

      const mockPayload = {
        userId: '123',
        email: 'test@example.com',
      };

      mockTokenGenerator.verifyRefreshToken.mockResolvedValue(mockPayload);
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(sut.execute(refreshTokenRequest)).rejects.toThrow(
        'Invalid or expired refresh token',
      );
    });
  });
});
