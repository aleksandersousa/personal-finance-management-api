import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeormPasswordResetTokenRepository } from '@infra/db/typeorm/repositories';
import { PasswordResetTokenEntity } from '@infra/db/typeorm/entities';

describe('TypeormPasswordResetTokenRepository - Find By Token', () => {
  let repository: TypeormPasswordResetTokenRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<PasswordResetTokenEntity>>;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
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

  describe('findByToken', () => {
    const mockTokenEntity: PasswordResetTokenEntity = {
      id: 'token-123',
      userId: 'user-123',
      token: 'reset-token',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      usedAt: null,
      createdAt: new Date(),
      user: null as any,
    };

    it('should find token by token string successfully', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockTokenEntity);

      // Act
      const result = await repository.findByToken('reset-token');

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { token: 'reset-token' },
      });
      expect(result).toEqual({
        id: mockTokenEntity.id,
        userId: mockTokenEntity.userId,
        token: mockTokenEntity.token,
        expiresAt: mockTokenEntity.expiresAt,
        usedAt: mockTokenEntity.usedAt,
        createdAt: mockTokenEntity.createdAt,
      });
    });

    it('should return null when token is not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findByToken('nonexistent-token');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle repository errors during findByToken', async () => {
      // Arrange
      mockRepository.findOne.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(repository.findByToken('reset-token')).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
