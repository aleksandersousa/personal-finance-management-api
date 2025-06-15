import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtTokenGenerator } from '@infra/implementations/jwt-token-generator';
import { TokenPayload } from '@data/protocols/token-generator';

describe('JwtTokenGenerator', () => {
  let tokenGenerator: JwtTokenGenerator;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const jwtServiceMock = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const configServiceMock = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtTokenGenerator,
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    tokenGenerator = module.get<JwtTokenGenerator>(JwtTokenGenerator);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTokens', () => {
    const mockPayload: TokenPayload = {
      userId: 'user-123',
      email: 'user@example.com',
    };

    it('should generate access and refresh tokens with default expiration', async () => {
      // Arrange
      configService.get
        .mockReturnValueOnce('access-secret') // JWT_ACCESS_SECRET
        .mockReturnValueOnce('refresh-secret') // JWT_REFRESH_SECRET
        .mockReturnValueOnce(undefined) // JWT_EXPIRES_IN (will use default)
        .mockReturnValueOnce(undefined); // JWT_REFRESH_EXPIRES_IN (will use default)

      jwtService.sign
        .mockReturnValueOnce('access-token-123')
        .mockReturnValueOnce('refresh-token-456');

      // Act
      const result = await tokenGenerator.generateTokens(mockPayload);

      // Assert
      expect(result).toEqual({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
      });

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(jwtService.sign).toHaveBeenNthCalledWith(1, mockPayload, {
        secret: 'access-secret',
        expiresIn: '15m',
      });
      expect(jwtService.sign).toHaveBeenNthCalledWith(2, mockPayload, {
        secret: 'refresh-secret',
        expiresIn: '7d',
      });
    });

    it('should generate tokens with custom expiration times', async () => {
      // Arrange
      configService.get
        .mockReturnValueOnce('access-secret') // JWT_ACCESS_SECRET
        .mockReturnValueOnce('refresh-secret') // JWT_REFRESH_SECRET
        .mockReturnValueOnce('30m') // JWT_EXPIRES_IN
        .mockReturnValueOnce('14d'); // JWT_REFRESH_EXPIRES_IN

      jwtService.sign
        .mockReturnValueOnce('custom-access-token')
        .mockReturnValueOnce('custom-refresh-token');

      // Act
      const result = await tokenGenerator.generateTokens(mockPayload);

      // Assert
      expect(result).toEqual({
        accessToken: 'custom-access-token',
        refreshToken: 'custom-refresh-token',
      });

      expect(jwtService.sign).toHaveBeenNthCalledWith(1, mockPayload, {
        secret: 'access-secret',
        expiresIn: '30m',
      });
      expect(jwtService.sign).toHaveBeenNthCalledWith(2, mockPayload, {
        secret: 'refresh-secret',
        expiresIn: '14d',
      });
    });

    it('should handle JWT service errors during token generation', async () => {
      // Arrange
      configService.get
        .mockReturnValueOnce('access-secret')
        .mockReturnValueOnce('refresh-secret')
        .mockReturnValueOnce('15m')
        .mockReturnValueOnce('7d');

      jwtService.sign.mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      // Act & Assert
      await expect(tokenGenerator.generateTokens(mockPayload)).rejects.toThrow(
        'JWT signing failed',
      );
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and return payload for valid access token', async () => {
      // Arrange
      const token = 'valid-access-token';
      const expectedPayload = {
        userId: 'user-123',
        email: 'user@example.com',
        iat: 1234567890,
        exp: 1234571490,
      };

      configService.get.mockReturnValue('access-secret');
      jwtService.verify.mockReturnValue(expectedPayload);

      // Act
      const result = await tokenGenerator.verifyAccessToken(token);

      // Assert
      expect(result).toEqual({
        userId: 'user-123',
        email: 'user@example.com',
      });

      expect(configService.get).toHaveBeenCalledWith('JWT_ACCESS_SECRET');
      expect(jwtService.verify).toHaveBeenCalledWith(token, {
        secret: 'access-secret',
      });
    });

    it('should throw error for invalid access token', async () => {
      // Arrange
      const token = 'invalid-access-token';
      configService.get.mockReturnValue('access-secret');
      jwtService.verify.mockImplementation(() => {
        throw new Error('JWT verification failed');
      });

      // Act & Assert
      await expect(tokenGenerator.verifyAccessToken(token)).rejects.toThrow(
        'Invalid access token',
      );
      expect(jwtService.verify).toHaveBeenCalledWith(token, {
        secret: 'access-secret',
      });
    });

    it('should throw error for expired access token', async () => {
      // Arrange
      const token = 'expired-access-token';
      configService.get.mockReturnValue('access-secret');
      jwtService.verify.mockImplementation(() => {
        throw new Error('TokenExpiredError');
      });

      // Act & Assert
      await expect(tokenGenerator.verifyAccessToken(token)).rejects.toThrow(
        'Invalid access token',
      );
    });

    it('should throw error for malformed access token', async () => {
      // Arrange
      const token = 'malformed-token';
      configService.get.mockReturnValue('access-secret');
      jwtService.verify.mockImplementation(() => {
        throw new Error('JsonWebTokenError');
      });

      // Act & Assert
      await expect(tokenGenerator.verifyAccessToken(token)).rejects.toThrow(
        'Invalid access token',
      );
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and return payload for valid refresh token', async () => {
      // Arrange
      const token = 'valid-refresh-token';
      const expectedPayload = {
        userId: 'user-123',
        email: 'user@example.com',
        iat: 1234567890,
        exp: 1234571490,
      };

      configService.get.mockReturnValue('refresh-secret');
      jwtService.verify.mockReturnValue(expectedPayload);

      // Act
      const result = await tokenGenerator.verifyRefreshToken(token);

      // Assert
      expect(result).toEqual({
        userId: 'user-123',
        email: 'user@example.com',
      });

      expect(configService.get).toHaveBeenCalledWith('JWT_REFRESH_SECRET');
      expect(jwtService.verify).toHaveBeenCalledWith(token, {
        secret: 'refresh-secret',
      });
    });

    it('should throw error for invalid refresh token', async () => {
      // Arrange
      const token = 'invalid-refresh-token';
      configService.get.mockReturnValue('refresh-secret');
      jwtService.verify.mockImplementation(() => {
        throw new Error('JWT verification failed');
      });

      // Act & Assert
      await expect(tokenGenerator.verifyRefreshToken(token)).rejects.toThrow(
        'Invalid refresh token',
      );
      expect(jwtService.verify).toHaveBeenCalledWith(token, {
        secret: 'refresh-secret',
      });
    });

    it('should throw error for expired refresh token', async () => {
      // Arrange
      const token = 'expired-refresh-token';
      configService.get.mockReturnValue('refresh-secret');
      jwtService.verify.mockImplementation(() => {
        throw new Error('TokenExpiredError');
      });

      // Act & Assert
      await expect(tokenGenerator.verifyRefreshToken(token)).rejects.toThrow(
        'Invalid refresh token',
      );
    });

    it('should throw error for malformed refresh token', async () => {
      // Arrange
      const token = 'malformed-token';
      configService.get.mockReturnValue('refresh-secret');
      jwtService.verify.mockImplementation(() => {
        throw new Error('JsonWebTokenError');
      });

      // Act & Assert
      await expect(tokenGenerator.verifyRefreshToken(token)).rejects.toThrow(
        'Invalid refresh token',
      );
    });
  });
});
