import { DbLoginUserUseCase } from '@data/usecases/db-login-user.usecase';
import { UserRepositoryStub } from '../mocks/repositories/user-repository.stub';
import { HasherStub } from '../mocks/protocols/hasher.stub';
import { TokenGeneratorStub } from '../mocks/protocols/token-generator.stub';
import { MockUserFactory } from '../../domain/mocks/models/user.mock';

describe('DbLoginUserUseCase', () => {
  let sut: DbLoginUserUseCase;
  let userRepositoryStub: UserRepositoryStub;
  let hasherStub: HasherStub;
  let tokenGeneratorStub: TokenGeneratorStub;

  beforeEach(() => {
    userRepositoryStub = new UserRepositoryStub();
    hasherStub = new HasherStub();
    tokenGeneratorStub = new TokenGeneratorStub();

    sut = new DbLoginUserUseCase(
      userRepositoryStub,
      hasherStub,
      tokenGeneratorStub,
    );
  });

  afterEach(() => {
    userRepositoryStub.clear();
    hasherStub.clear();
    tokenGeneratorStub.clear();
  });

  describe('execute', () => {
    const mockPassword = 'validPassword123';
    const mockHashedPassword = 'hashed_validPassword123';

    const mockUser = MockUserFactory.create({
      id: 'valid-user-id',
      name: 'John Doe',
      email: 'john@example.com',
      password: mockHashedPassword,
    });

    const mockRequest = {
      email: 'john@example.com',
      password: mockPassword,
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
  });
});
