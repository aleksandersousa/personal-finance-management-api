import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeormUserRepository } from '@infra/db/typeorm/repositories/typeorm-user.repository';
import { UserEntity } from '@infra/db/typeorm/entities/user.entity';
import { CreateUserData } from '@data/protocols/user-repository';

describe('TypeormUserRepository - Create User', () => {
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
});
