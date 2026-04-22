import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeormUserRepository } from '@infra/db/typeorm/repositories/typeorm-user.repository';
import { UserEntity } from '@infra/db/typeorm/entities/user.entity';
import { UserSettingEntity } from '@infra/db/typeorm/entities/user-setting.entity';

describe('TypeormUserRepository - Update User', () => {
  let repository: TypeormUserRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<UserEntity>>;
  let mockUserSettingRepository: jest.Mocked<Repository<UserSettingEntity>>;

  beforeEach(async () => {
    mockRepository = {
      update: jest.fn(),
      findOne: jest.fn(),
    } as any;

    mockUserSettingRepository = {
      update: jest.fn(),
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
          useValue: mockUserSettingRepository,
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

    const updatedUserEntity: UserEntity = {
      ...mockUserEntity,
      emailVerified: true,
      updatedAt: new Date('2024-01-02'),
    };

    it('should update user successfully', async () => {
      mockRepository.update.mockResolvedValue(undefined as any);
      mockRepository.findOne.mockResolvedValue(updatedUserEntity);

      const result = await repository.update('user-123', {
        emailVerified: true,
      });

      expect(mockRepository.update).toHaveBeenCalledWith('user-123', {
        emailVerified: true,
      });
      expect(mockUserSettingRepository.update).not.toHaveBeenCalled();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        relations: ['userSetting'],
      });
      expect(result).toEqual({
        id: updatedUserEntity.id,
        name: updatedUserEntity.name,
        email: updatedUserEntity.email,
        password: updatedUserEntity.password,
        avatarUrl: updatedUserEntity.avatarUrl,
        emailVerified: updatedUserEntity.emailVerified,
        notificationEnabled: mockUserSetting.notificationsEnabled,
        notificationTimeMinutes: mockUserSetting.notificationsTimeMinutes,
        timezone: mockUserSetting.timezone,
        createdAt: updatedUserEntity.createdAt,
        updatedAt: updatedUserEntity.updatedAt,
      });
    });

    it('should throw error when user not found after update', async () => {
      mockRepository.update.mockResolvedValue(undefined as any);
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        repository.update('nonexistent-id', { emailVerified: true }),
      ).rejects.toThrow('User not found after update');
      expect(mockRepository.update).toHaveBeenCalledWith('nonexistent-id', {
        emailVerified: true,
      });
    });

    it('should handle repository errors during update', async () => {
      mockRepository.update.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(
        repository.update('user-123', { emailVerified: true }),
      ).rejects.toThrow('Database connection failed');
      expect(mockRepository.update).toHaveBeenCalledWith('user-123', {
        emailVerified: true,
      });
    });

    it('should handle repository errors during findOne after update', async () => {
      mockRepository.update.mockResolvedValue(undefined as any);
      mockRepository.findOne.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(
        repository.update('user-123', { emailVerified: true }),
      ).rejects.toThrow('Database connection failed');
    });
  });
});
