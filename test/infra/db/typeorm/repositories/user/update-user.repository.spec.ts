import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeormUserRepository } from '@infra/db/typeorm/repositories/typeorm-user.repository';
import { UserEntity } from '@infra/db/typeorm/entities/user.entity';

describe('TypeormUserRepository - Update User', () => {
  let repository: TypeormUserRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<UserEntity>>;

  beforeEach(async () => {
    mockRepository = {
      update: jest.fn(),
      findOne: jest.fn(),
    } as any;

    testingModule = await Test.createTestingModule({
      providers: [
        TypeormUserRepository,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = testingModule.get<TypeormUserRepository>(
      TypeormUserRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('update', () => {
    const mockUserEntity: UserEntity = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedPassword123',
      avatarUrl: null,
      emailVerified: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      entries: [],
      categories: [],
      emailVerificationTokens: [],
    };

    const updatedUserEntity: UserEntity = {
      ...mockUserEntity,
      emailVerified: true,
      updatedAt: new Date('2024-01-02'),
    };

    it('should update user successfully', async () => {
      // Arrange
      mockRepository.update.mockResolvedValue(undefined as any);
      mockRepository.findOne.mockResolvedValue(updatedUserEntity);

      // Act
      const result = await repository.update('user-123', {
        emailVerified: true,
      });

      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith('user-123', {
        emailVerified: true,
      });
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(result).toEqual({
        id: updatedUserEntity.id,
        name: updatedUserEntity.name,
        email: updatedUserEntity.email,
        password: updatedUserEntity.password,
        avatarUrl: updatedUserEntity.avatarUrl,
        emailVerified: updatedUserEntity.emailVerified,
        createdAt: updatedUserEntity.createdAt,
        updatedAt: updatedUserEntity.updatedAt,
      });
    });

    it('should throw error when user not found after update', async () => {
      // Arrange
      mockRepository.update.mockResolvedValue(undefined as any);
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        repository.update('nonexistent-id', { emailVerified: true }),
      ).rejects.toThrow('User not found after update');
      expect(mockRepository.update).toHaveBeenCalledWith('nonexistent-id', {
        emailVerified: true,
      });
    });

    it('should handle repository errors during update', async () => {
      // Arrange
      mockRepository.update.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(
        repository.update('user-123', { emailVerified: true }),
      ).rejects.toThrow('Database connection failed');
      expect(mockRepository.update).toHaveBeenCalledWith('user-123', {
        emailVerified: true,
      });
    });

    it('should handle repository errors during findOne after update', async () => {
      // Arrange
      mockRepository.update.mockResolvedValue(undefined as any);
      mockRepository.findOne.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(
        repository.update('user-123', { emailVerified: true }),
      ).rejects.toThrow('Database connection failed');
    });
  });
});
