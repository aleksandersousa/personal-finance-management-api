import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TypeormUserRepository } from '@infra/db/typeorm/repositories/typeorm-user.repository';
import { UserEntity } from '@infra/db/typeorm/entities/user.entity';
import { UserSettingEntity } from '@infra/db/typeorm/entities/user-setting.entity';
import { CreateUserData } from '@/data/protocols/repositories/user-repository';

describe('TypeormUserRepository - Create User', () => {
  let repository: TypeormUserRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<UserEntity>>;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      manager: {} as EntityManager,
    } as any;

    const runSuccessfulTransaction = async (
      work: (
        m: EntityManager,
      ) => Promise<{ user: UserEntity; settings: UserSettingEntity }>,
    ): Promise<{ user: UserEntity; settings: UserSettingEntity }> => {
      const mockManager = {
        create: jest.fn((_Entity: unknown, data: object) => ({ ...data })),
        save: jest.fn(async (entity: Record<string, unknown>) => {
          if ('userId' in entity && entity.userId) {
            return {
              id: 'settings-id',
              userId: entity.userId,
              notificationsEnabled: false,
              notificationsTimeMinutes: 30,
              timezone: 'America/Sao_Paulo',
              createdAt: new Date('2024-01-01'),
            };
          }
          return {
            id: 'user-123',
            name: entity.name,
            email: entity.email,
            password: entity.password,
            avatarUrl: null,
            emailVerified: false,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          };
        }),
      } as unknown as EntityManager;
      return work(mockManager);
    };

    (mockRepository.manager as { transaction: unknown }).transaction = jest.fn(
      runSuccessfulTransaction,
    );

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

  describe('create', () => {
    const mockUserData: CreateUserData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedPassword123',
    };

    it('should create user and default user_settings in a transaction', async () => {
      const result = await repository.create(mockUserData);

      expect(
        (mockRepository.manager as unknown as { transaction: jest.Mock })
          .transaction,
      ).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword123',
        avatarUrl: null,
        emailVerified: false,
        notificationEnabled: false,
        notificationTimeMinutes: 30,
        timezone: 'America/Sao_Paulo',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });
    });

    it('should handle repository errors during creation', async () => {
      (mockRepository.manager as { transaction: unknown }).transaction = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      await expect(repository.create(mockUserData)).rejects.toThrow(
        'Database error',
      );
    });
  });
});
