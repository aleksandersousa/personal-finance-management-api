import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeormUserRepository } from '@infra/db/typeorm/repositories/typeorm-user.repository';
import { UserEntity } from '@infra/db/typeorm/entities/user.entity';
import { UserSettingEntity } from '@infra/db/typeorm/entities/user-setting.entity';

describe('TypeormUserRepository - Find By Email', () => {
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
        {
          provide: getRepositoryToken(UserSettingEntity),
          useValue: { update: jest.fn() },
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

  describe('findByEmail', () => {
    const mockUserSetting: UserSettingEntity = {
      id: 'st-1',
      userId: 'user-123',
      notificationsEnabled: true,
      notificationsTimeMinutes: 30,
      timezone: 'America/Sao_Paulo',
      createdAt: new Date('2024-01-01'),
      user: undefined as any,
    };

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
      userSetting: mockUserSetting,
    };

    it('should find user by email successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockUserEntity);

      const result = await repository.findByEmail('john@example.com');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
        relations: ['userSetting'],
      });
      expect(result).toEqual({
        id: mockUserEntity.id,
        name: mockUserEntity.name,
        email: mockUserEntity.email,
        password: mockUserEntity.password,
        avatarUrl: mockUserEntity.avatarUrl,
        emailVerified: mockUserEntity.emailVerified,
        notificationEnabled: mockUserSetting.notificationsEnabled,
        notificationTimeMinutes: mockUserSetting.notificationsTimeMinutes,
        timezone: mockUserSetting.timezone,
        createdAt: mockUserEntity.createdAt,
        updatedAt: mockUserEntity.updatedAt,
      });
    });

    it('should return null when user is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should handle repository errors', async () => {
      mockRepository.findOne.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(repository.findByEmail('john@example.com')).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
