import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeormUserRepository } from '@infra/db/typeorm/repositories/typeorm-user.repository';
import { UserEntity } from '@infra/db/typeorm/entities/user.entity';

describe('TypeormUserRepository - Find By ID', () => {
  let repository: TypeormUserRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<UserEntity>>;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
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

  describe('findById', () => {
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

    it('should find user by id successfully', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockUserEntity);

      // Act
      const result = await repository.findById('user-123');

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(result).toEqual({
        id: mockUserEntity.id,
        name: mockUserEntity.name,
        email: mockUserEntity.email,
        password: mockUserEntity.password,
        avatarUrl: mockUserEntity.avatarUrl,
        emailVerified: mockUserEntity.emailVerified,
        createdAt: mockUserEntity.createdAt,
        updatedAt: mockUserEntity.updatedAt,
      });
    });

    it('should return null when user is not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findById('nonexistent-id');

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'nonexistent-id' },
      });
      expect(result).toBeNull();
    });

    it('should handle repository errors during findById', async () => {
      // Arrange
      mockRepository.findOne.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(repository.findById('user-123')).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });
  });
});
