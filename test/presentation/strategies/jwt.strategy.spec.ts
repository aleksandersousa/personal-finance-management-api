import { JwtStrategy, JwtPayload } from '@presentation/strategies/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { UserRepositoryStub } from '../../data/mocks/repositories/user-repository.stub';
import { ConfigServiceMockFactory } from '../mocks/config/config-service.mock';
import { MockUserFactory } from '../../domain/mocks/models/user.mock';
import { UserModel } from '@domain/models/user.model';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let configService: jest.Mocked<ConfigService>;
  let userRepositoryStub: UserRepositoryStub;

  beforeEach(() => {
    configService = ConfigServiceMockFactory.create();
    userRepositoryStub = new UserRepositoryStub();
    jwtStrategy = new JwtStrategy(configService, userRepositoryStub);
  });

  afterEach(() => {
    userRepositoryStub.clear();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      // Arrange & Act
      const strategy = new JwtStrategy(configService, userRepositoryStub);

      // Assert
      expect(strategy).toBeDefined();
      expect(configService.get).toHaveBeenCalledWith('JWT_ACCESS_SECRET');
    });

    it('should throw error when JWT_ACCESS_SECRET is missing', () => {
      // Arrange
      const configWithMissingSecret =
        ConfigServiceMockFactory.createWithMissingSecret();

      // Act & Assert
      expect(() => {
        new JwtStrategy(configWithMissingSecret, userRepositoryStub);
      }).toThrow('JwtStrategy requires a secret or key');
    });
  });

  describe('validate', () => {
    const mockPayload: JwtPayload = {
      userId: 'user-123',
      email: 'test@example.com',
    };

    describe('successful validation', () => {
      it('should validate user and return user without password when user exists', async () => {
        // Arrange
        const mockUser = MockUserFactory.create({
          id: 'user-123',
          email: 'test@example.com',
          password: 'hashed-password-123',
          name: 'Test User',
        });

        userRepositoryStub.seed([mockUser]);

        // Act
        const result = await jwtStrategy.validate(mockPayload);

        // Assert
        expect(result).toBeDefined();
        expect(result).not.toHaveProperty('password');
        expect(result).toEqual({
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          avatarUrl: null,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        });
      });

      it('should validate user with different user data formats', async () => {
        // Arrange
        const mockUser = MockUserFactory.create({
          id: 'user-456',
          email: 'different@example.com',
          password: 'different-hashed-password',
          name: 'Different User',
          avatarUrl: 'https://example.com/avatar.jpg',
        });

        const payload: JwtPayload = {
          userId: 'user-456',
          email: 'different@example.com',
        };

        userRepositoryStub.seed([mockUser]);

        // Act
        const result = await jwtStrategy.validate(payload);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe('user-456');
        expect(result.email).toBe('different@example.com');
        expect(result.name).toBe('Different User');
        expect(result.avatarUrl).toBe('https://example.com/avatar.jpg');
        expect(result).not.toHaveProperty('password');
      });

      it('should handle users with null avatar correctly', async () => {
        // Arrange
        const mockUser = MockUserFactory.create({
          id: 'user-789',
          email: 'test@example.com',
          avatarUrl: null,
        });

        const payload: JwtPayload = {
          userId: 'user-789',
          email: 'test@example.com',
        };

        userRepositoryStub.seed([mockUser]);

        // Act
        const result = await jwtStrategy.validate(payload);

        // Assert
        expect(result).toBeDefined();
        expect(result.avatarUrl).toBeNull();
        expect(result).not.toHaveProperty('password');
      });
    });

    describe('user not found scenarios', () => {
      it('should return null when user does not exist', async () => {
        // Arrange
        // No users seeded in repository

        // Act
        const result = await jwtStrategy.validate(mockPayload);

        // Assert
        expect(result).toBeNull();
      });

      it('should return null when user exists but with different ID', async () => {
        // Arrange
        const mockUser = MockUserFactory.create({
          id: 'different-user-id',
          email: 'test@example.com',
        });

        userRepositoryStub.seed([mockUser]);

        // Act
        const result = await jwtStrategy.validate(mockPayload);

        // Assert
        expect(result).toBeNull();
      });

      it('should return null for various non-existent user IDs', async () => {
        // Arrange
        const testCases = [
          { userId: 'non-existent-1', email: 'test1@example.com' },
          { userId: 'non-existent-2', email: 'test2@example.com' },
          { userId: '', email: 'empty@example.com' },
          { userId: 'null-user', email: 'null@example.com' },
        ];

        // Act & Assert
        for (const testCase of testCases) {
          const result = await jwtStrategy.validate(testCase);
          expect(result).toBeNull();
        }
      });
    });

    describe('repository error handling', () => {
      it('should handle repository connection errors', async () => {
        // Arrange
        userRepositoryStub.mockConnectionError();

        // Act & Assert
        await expect(jwtStrategy.validate(mockPayload)).rejects.toThrow(
          'Database connection failed',
        );
      });

      it('should handle repository timeout errors', async () => {
        // Arrange
        userRepositoryStub.mockFailure(new Error('Connection timeout'));

        // Act & Assert
        await expect(jwtStrategy.validate(mockPayload)).rejects.toThrow(
          'Connection timeout',
        );
      });

      it('should handle repository generic errors', async () => {
        // Arrange
        const genericError = new Error('Generic repository error');
        userRepositoryStub.mockFailure(genericError);

        // Act & Assert
        await expect(jwtStrategy.validate(mockPayload)).rejects.toThrow(
          'Generic repository error',
        );
      });

      it('should propagate repository errors without modification', async () => {
        // Arrange
        const customError = new Error('Custom database error with details');
        userRepositoryStub.mockFailure(customError);

        // Act & Assert
        await expect(jwtStrategy.validate(mockPayload)).rejects.toThrow(
          'Custom database error with details',
        );
      });
    });

    describe('payload validation edge cases', () => {
      it('should handle payload with additional properties', async () => {
        // Arrange
        const mockUser = MockUserFactory.create({
          id: 'user-123',
          email: 'test@example.com',
        });

        const extendedPayload: JwtPayload & { extra: string } = {
          userId: 'user-123',
          email: 'test@example.com',
          extra: 'should-be-ignored',
        };

        userRepositoryStub.seed([mockUser]);

        // Act
        const result = await jwtStrategy.validate(extendedPayload);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe('user-123');
        expect(result).not.toHaveProperty('extra');
        expect(result).not.toHaveProperty('password');
      });

      it('should handle payloads with special characters in userId', async () => {
        // Arrange
        const specialUserId = 'user-with-special-chars-@#$%';
        const mockUser = MockUserFactory.create({
          id: specialUserId,
          email: 'special@example.com',
        });

        const payload: JwtPayload = {
          userId: specialUserId,
          email: 'special@example.com',
        };

        userRepositoryStub.seed([mockUser]);

        // Act
        const result = await jwtStrategy.validate(payload);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe(specialUserId);
        expect(result).not.toHaveProperty('password');
      });
    });

    describe('password exclusion verification', () => {
      it('should never return password field regardless of user data', async () => {
        // Arrange
        const usersWithPasswords = MockUserFactory.createMany(5, {
          password: 'super-secret-hashed-password',
        });

        userRepositoryStub.seed(usersWithPasswords);

        // Act & Assert
        for (const user of usersWithPasswords) {
          const payload: JwtPayload = {
            userId: user.id,
            email: user.email,
          };

          const result = await jwtStrategy.validate(payload);

          expect(result).toBeDefined();
          expect(result).not.toHaveProperty('password');
          expect(Object.keys(result)).not.toContain('password');
        }
      });

      it('should maintain all other user properties except password', async () => {
        // Arrange
        const mockUser: UserModel = {
          id: 'user-complete',
          name: 'Complete User',
          email: 'complete@example.com',
          password: 'this-should-be-excluded',
          avatarUrl: 'https://example.com/avatar.jpg',
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-02T00:00:00Z'),
        };

        const payload: JwtPayload = {
          userId: 'user-complete',
          email: 'complete@example.com',
        };

        userRepositoryStub.seed([mockUser]);

        // Act
        const result = await jwtStrategy.validate(payload);

        // Assert
        expect(result).toEqual({
          id: 'user-complete',
          name: 'Complete User',
          email: 'complete@example.com',
          avatarUrl: 'https://example.com/avatar.jpg',
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-02T00:00:00Z'),
        });
        expect(result).not.toHaveProperty('password');
      });
    });

    describe('multiple user scenarios', () => {
      it('should correctly identify and return the right user among multiple users', async () => {
        // Arrange
        const users = [
          MockUserFactory.create({
            id: 'user-1',
            email: 'user1@example.com',
            name: 'User One',
          }),
          MockUserFactory.create({
            id: 'user-2',
            email: 'user2@example.com',
            name: 'User Two',
          }),
          MockUserFactory.create({
            id: 'user-3',
            email: 'user3@example.com',
            name: 'User Three',
          }),
        ];

        userRepositoryStub.seed(users);

        const payload: JwtPayload = {
          userId: 'user-2',
          email: 'user2@example.com',
        };

        // Act
        const result = await jwtStrategy.validate(payload);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe('user-2');
        expect(result.name).toBe('User Two');
        expect(result.email).toBe('user2@example.com');
        expect(result).not.toHaveProperty('password');
      });
    });

    describe('performance and efficiency', () => {
      it('should call repository.findById exactly once per validation', async () => {
        // Arrange
        const mockUser = MockUserFactory.create();
        userRepositoryStub.seed([mockUser]);

        // Spy on the findById method
        const findByIdSpy = jest.spyOn(userRepositoryStub, 'findById');

        const payload: JwtPayload = {
          userId: mockUser.id,
          email: mockUser.email,
        };

        // Act
        await jwtStrategy.validate(payload);

        // Assert
        expect(findByIdSpy).toHaveBeenCalledTimes(1);
        expect(findByIdSpy).toHaveBeenCalledWith(mockUser.id);
      });

      it('should not make additional repository calls when user not found', async () => {
        // Arrange
        const findByIdSpy = jest.spyOn(userRepositoryStub, 'findById');

        // Act
        await jwtStrategy.validate(mockPayload);

        // Assert
        expect(findByIdSpy).toHaveBeenCalledTimes(1);
        expect(findByIdSpy).toHaveBeenCalledWith('user-123');
      });
    });
  });
});
