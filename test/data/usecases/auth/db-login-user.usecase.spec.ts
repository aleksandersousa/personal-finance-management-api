import { DbLoginUserUseCase } from '@data/usecases';
import { UserRepositoryStub } from '@test/data/mocks/repositories';
import {
  HasherStub,
  TokenGeneratorStub,
  LoggerStub,
} from '@test/data/mocks/protocols';
import { MockUserFactory } from '@test/domain/mocks/models';
import { LoginAttemptTracker } from '@infra/cache/login-attempt-tracker.service';

describe('DbLoginUserUseCase', () => {
  let sut: DbLoginUserUseCase;
  let userRepositoryStub: UserRepositoryStub;
  let hasherStub: HasherStub;
  let tokenGeneratorStub: TokenGeneratorStub;
  let loggerStub: LoggerStub;
  let loginAttemptTrackerMock: jest.Mocked<LoginAttemptTracker>;

  beforeEach(() => {
    userRepositoryStub = new UserRepositoryStub();
    hasherStub = new HasherStub();
    tokenGeneratorStub = new TokenGeneratorStub();
    loggerStub = new LoggerStub();
    loginAttemptTrackerMock = {
      checkDelay: jest.fn().mockResolvedValue({ isDelayed: false, key: '' }),
      incrementAttempts: jest.fn().mockResolvedValue(undefined),
      resetAllAttempts: jest.fn().mockResolvedValue(undefined),
    } as any;

    sut = new DbLoginUserUseCase(
      userRepositoryStub,
      hasherStub,
      tokenGeneratorStub,
      loggerStub,
      loginAttemptTrackerMock,
    );
  });

  afterEach(() => {
    userRepositoryStub.clear();
    hasherStub.clear();
    tokenGeneratorStub.clear();
    loggerStub.clear();
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockPassword = 'validPassword123';
    const mockHashedPassword = 'hashed_validPassword123';

    const mockUser = MockUserFactory.create({
      id: 'valid-user-id',
      name: 'John Doe',
      email: 'john@example.com',
      password: mockHashedPassword,
      emailVerified: true,
    });

    const mockRequest = {
      email: 'john@example.com',
      password: mockPassword,
      ipAddress: '127.0.0.1',
    };

    it('should login user successfully with valid credentials', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      hasherStub.seedPasswordHash(mockPassword, mockHashedPassword);

      // Act
      const result = await sut.execute(mockRequest);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.name).toBe(mockUser.name);
      expect(result.user).not.toHaveProperty('password'); // Password should be excluded
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
      expect(result.tokens.accessToken).toContain('access_token_');
      expect(result.tokens.refreshToken).toContain('refresh_token_');
    });

    it('should throw error if email is not provided', async () => {
      // Arrange
      const invalidRequest = {
        email: '',
        password: mockPassword,
      };

      // Act & Assert
      await expect(sut.execute(invalidRequest)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw error if password is not provided', async () => {
      // Arrange
      const invalidRequest = {
        email: mockRequest.email,
        password: '',
      };

      // Act & Assert
      await expect(sut.execute(invalidRequest)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw error if email is null', async () => {
      // Arrange
      const invalidRequest = {
        email: null as any,
        password: mockPassword,
      };

      // Act & Assert
      await expect(sut.execute(invalidRequest)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw error if password is null', async () => {
      // Arrange
      const invalidRequest = {
        email: mockRequest.email,
        password: null as any,
      };

      // Act & Assert
      await expect(sut.execute(invalidRequest)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw error if user is not found', async () => {
      // Arrange
      // User not seeded - simulates user not found

      // Act & Assert
      await expect(sut.execute(mockRequest)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw error if user has no password', async () => {
      // Arrange
      const userWithoutPassword = MockUserFactory.create({
        ...mockUser,
        password: null as any,
      });
      userRepositoryStub.seed([userWithoutPassword]);

      // Act & Assert
      await expect(sut.execute(mockRequest)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw error if password is invalid', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      // Don't seed the correct password-hash combination - this will make compare return false

      // Act & Assert
      await expect(sut.execute(mockRequest)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should normalize email to lowercase', async () => {
      // Arrange
      const uppercaseEmailRequest = {
        email: 'JOHN@EXAMPLE.COM',
        password: mockPassword,
      };
      userRepositoryStub.seed([mockUser]);
      hasherStub.seedPasswordHash(mockPassword, mockHashedPassword);

      // Act
      const result = await sut.execute(uppercaseEmailRequest);

      // Assert
      expect(result.user.email).toBe('john@example.com');
    });

    it('should handle user repository errors', async () => {
      // Arrange
      userRepositoryStub.mockConnectionError();

      // Act & Assert
      await expect(sut.execute(mockRequest)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle hasher errors', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      hasherStub.mockComparisonError();

      // Act & Assert
      await expect(sut.execute(mockRequest)).rejects.toThrow(
        'Password comparison failed',
      );
    });

    it('should handle token generation errors', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      hasherStub.seedPasswordHash(mockPassword, mockHashedPassword);
      tokenGeneratorStub.mockTokenGenerationError();

      // Act & Assert
      await expect(sut.execute(mockRequest)).rejects.toThrow(
        'Token generation failed',
      );
    });

    it('should pass correct payload to token generator', async () => {
      // Arrange
      userRepositoryStub.seed([mockUser]);
      hasherStub.seedPasswordHash(mockPassword, mockHashedPassword);

      // Act
      const result = await sut.execute(mockRequest);

      // Assert
      expect(tokenGeneratorStub.getTokenCount()).toBe(2); // access + refresh tokens
      expect(result.tokens.accessToken).toContain(mockUser.id);
      expect(result.tokens.refreshToken).toContain(mockUser.id);
    });

    it('should throw error if email is not verified', async () => {
      // Arrange
      const unverifiedUser = MockUserFactory.create({
        ...mockUser,
        emailVerified: false,
      });
      userRepositoryStub.seed([unverifiedUser]);
      hasherStub.seedPasswordHash(mockPassword, mockHashedPassword);

      // Act & Assert
      await expect(sut.execute(mockRequest)).rejects.toThrow(
        'Email not verified',
      );
      expect(tokenGeneratorStub.getTokenCount()).toBe(0); // No tokens generated
    });

    it('should allow login when email is verified', async () => {
      // Arrange
      const verifiedUser = MockUserFactory.create({
        ...mockUser,
        emailVerified: true,
      });
      userRepositoryStub.seed([verifiedUser]);
      hasherStub.seedPasswordHash(mockPassword, mockHashedPassword);

      // Act
      const result = await sut.execute(mockRequest);

      // Assert
      expect(result.user.id).toBe(verifiedUser.id);
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
    });
  });
});
