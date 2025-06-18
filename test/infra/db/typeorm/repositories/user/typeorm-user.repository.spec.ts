import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeormUserRepository } from '@infra/db/typeorm/repositories/typeorm-user.repository';
import { UserEntity } from '@infra/db/typeorm/entities/user.entity';
import { CreateUserData } from '@data/protocols/user-repository';

describe('TypeormUserRepository', () => {
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

  describe('create', () => {
    const mockUserData: CreateUserData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedPassword123',
    };

    const mockUserEntity: UserEntity = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedPassword123',
      avatarUrl: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      entries: [],
      categories: [],
    };

    it('should create and save a new user successfully', async () => {
      // Arrange
      mockRepository.create.mockReturnValue(mockUserEntity);
      mockRepository.save.mockResolvedValue(mockUserEntity);

      // Act
      const result = await repository.create(mockUserData);

      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith(mockUserData);
      expect(mockRepository.save).toHaveBeenCalledWith(mockUserEntity);
      expect(result).toEqual({
        id: mockUserEntity.id,
        name: mockUserEntity.name,
        email: mockUserEntity.email,
        password: mockUserEntity.password,
        avatarUrl: mockUserEntity.avatarUrl,
        createdAt: mockUserEntity.createdAt,
        updatedAt: mockUserEntity.updatedAt,
      });
    });

    it('should handle repository errors during creation', async () => {
      // Arrange
      mockRepository.create.mockReturnValue(mockUserEntity);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(repository.create(mockUserData)).rejects.toThrow(
        'Database error',
      );
      expect(mockRepository.create).toHaveBeenCalledWith(mockUserData);
      expect(mockRepository.save).toHaveBeenCalledWith(mockUserEntity);
    });
  });

  describe('findByEmail', () => {
    const mockUserEntity: UserEntity = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedPassword123',
      avatarUrl: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      entries: [],
      categories: [],
    };

    it('should find user by email successfully', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockUserEntity);

      // Act
      const result = await repository.findByEmail('john@example.com');

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
      expect(result).toEqual({
        id: mockUserEntity.id,
        name: mockUserEntity.name,
        email: mockUserEntity.email,
        password: mockUserEntity.password,
        avatarUrl: mockUserEntity.avatarUrl,
        createdAt: mockUserEntity.createdAt,
        updatedAt: mockUserEntity.updatedAt,
      });
    });

    it('should return null when user is not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findByEmail('nonexistent@example.com');

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
      expect(result).toBeNull();
    });

    it('should handle repository errors during findByEmail', async () => {
      // Arrange
      mockRepository.findOne.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(repository.findByEmail('john@example.com')).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
    });
  });

  describe('findById', () => {
    const mockUserEntity: UserEntity = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedPassword123',
      avatarUrl: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      entries: [],
      categories: [],
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
