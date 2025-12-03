import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeormPasswordResetTokenRepository } from '@infra/db/typeorm/repositories';
import { PasswordResetTokenEntity } from '@infra/db/typeorm/entities';

describe('TypeormPasswordResetTokenRepository - Create Token', () => {
  let repository: TypeormPasswordResetTokenRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<PasswordResetTokenEntity>>;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    testingModule = await Test.createTestingModule({
      providers: [
        TypeormPasswordResetTokenRepository,
        {
          provide: getRepositoryToken(PasswordResetTokenEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = testingModule.get<TypeormPasswordResetTokenRepository>(
      TypeormPasswordResetTokenRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const mockTokenEntity: PasswordResetTokenEntity = {
      id: 'token-123',
      userId: 'user-123',
      token: 'reset-token',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      usedAt: null,
      createdAt: new Date(),
      user: null as any,
    };

    it('should create and save a new token successfully', async () => {
      // Arrange
      mockRepository.create.mockReturnValue(mockTokenEntity);
      mockRepository.save.mockResolvedValue(mockTokenEntity);

      // Act
      const result = await repository.create(
        'user-123',
        'reset-token',
        mockTokenEntity.expiresAt,
      );

      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 'user-123',
        token: 'reset-token',
        expiresAt: mockTokenEntity.expiresAt,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockTokenEntity);
      expect(result).toEqual({
        id: mockTokenEntity.id,
        userId: mockTokenEntity.userId,
        token: mockTokenEntity.token,
        expiresAt: mockTokenEntity.expiresAt,
        usedAt: mockTokenEntity.usedAt,
        createdAt: mockTokenEntity.createdAt,
      });
    });

    it('should handle repository errors during creation', async () => {
      // Arrange
      mockRepository.create.mockReturnValue(mockTokenEntity);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        repository.create('user-123', 'reset-token', mockTokenEntity.expiresAt),
      ).rejects.toThrow('Database error');
    });
  });
});
