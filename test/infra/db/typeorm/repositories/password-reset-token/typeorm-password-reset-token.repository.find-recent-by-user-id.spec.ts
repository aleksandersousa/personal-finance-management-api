import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { TypeormPasswordResetTokenRepository } from '@infra/db/typeorm/repositories';
import { PasswordResetTokenEntity } from '@infra/db/typeorm/entities';

describe('TypeormPasswordResetTokenRepository - Find Recent By User Id', () => {
  let repository: TypeormPasswordResetTokenRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<PasswordResetTokenEntity>>;

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
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

  describe('findRecentByUserId', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const mockTokenEntities: PasswordResetTokenEntity[] = [
      {
        id: 'token-1',
        userId: 'user-123',
        token: 'token-1',
        expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
        usedAt: null,
        createdAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
        user: null as any,
      },
      {
        id: 'token-2',
        userId: 'user-123',
        token: 'token-2',
        expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
        usedAt: null,
        createdAt: new Date(now.getTime() - 45 * 60 * 1000), // 45 minutes ago
        user: null as any,
      },
    ];

    it('should find recent tokens by user id successfully', async () => {
      // Arrange
      mockRepository.find.mockResolvedValue(mockTokenEntities);

      // Act
      const result = await repository.findRecentByUserId('user-123', 1);

      // Assert
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          createdAt: MoreThanOrEqual(expect.any(Date)),
        },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('token-1');
      expect(result[1].id).toBe('token-2');
    });

    it('should return empty array when no recent tokens found', async () => {
      // Arrange
      mockRepository.find.mockResolvedValue([]);

      // Act
      const result = await repository.findRecentByUserId('user-123', 1);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle repository errors during findRecentByUserId', async () => {
      // Arrange
      mockRepository.find.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(
        repository.findRecentByUserId('user-123', 1),
      ).rejects.toThrow('Database connection failed');
    });
  });
});
