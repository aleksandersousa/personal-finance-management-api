import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeormEmailVerificationTokenRepository } from '@infra/db/typeorm/repositories/typeorm-email-verification-token.repository';
import { EmailVerificationTokenEntity } from '@infra/db/typeorm/entities/email-verification-token.entity';

describe('TypeormEmailVerificationTokenRepository', () => {
  let repository: TypeormEmailVerificationTokenRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<EmailVerificationTokenEntity>>;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    testingModule = await Test.createTestingModule({
      providers: [
        TypeormEmailVerificationTokenRepository,
        {
          provide: getRepositoryToken(EmailVerificationTokenEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = testingModule.get<TypeormEmailVerificationTokenRepository>(
      TypeormEmailVerificationTokenRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const mockTokenEntity: EmailVerificationTokenEntity = {
      id: 'token-123',
      userId: 'user-123',
      token: 'verification-token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
        'verification-token',
        mockTokenEntity.expiresAt,
      );

      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 'user-123',
        token: 'verification-token',
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
        repository.create(
          'user-123',
          'verification-token',
          mockTokenEntity.expiresAt,
        ),
      ).rejects.toThrow('Database error');
    });
  });

  describe('findByToken', () => {
    const mockTokenEntity: EmailVerificationTokenEntity = {
      id: 'token-123',
      userId: 'user-123',
      token: 'verification-token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      usedAt: null,
      createdAt: new Date(),
      user: null as any,
    };

    it('should find token by token string successfully', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockTokenEntity);

      // Act
      const result = await repository.findByToken('verification-token');

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { token: 'verification-token' },
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
      await expect(
        repository.findByToken('verification-token'),
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByUserId', () => {
    const mockTokenEntity: EmailVerificationTokenEntity = {
      id: 'token-123',
      userId: 'user-123',
      token: 'verification-token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      usedAt: null,
      createdAt: new Date(),
      user: null as any,
    };

    it('should find token by user id successfully', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockTokenEntity);

      // Act
      const result = await repository.findByUserId('user-123');

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        order: { createdAt: 'DESC' },
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

    it('should return null when token is not found for user', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findByUserId('user-123');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('markAsUsed', () => {
    it('should mark token as used successfully', async () => {
      // Arrange
      mockRepository.update.mockResolvedValue(undefined as any);

      // Act
      await repository.markAsUsed('token-123');

      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith('token-123', {
        usedAt: expect.any(Date),
      });
    });

    it('should handle repository errors during markAsUsed', async () => {
      // Arrange
      mockRepository.update.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(repository.markAsUsed('token-123')).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('deleteExpiredTokens', () => {
    it('should delete expired tokens successfully', async () => {
      // Arrange
      mockRepository.delete.mockResolvedValue(undefined as any);

      // Act
      await repository.deleteExpiredTokens();

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith({
        expiresAt: expect.any(Object),
      });
    });

    it('should handle repository errors during deleteExpiredTokens', async () => {
      // Arrange
      mockRepository.delete.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(repository.deleteExpiredTokens()).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('deleteByUserId', () => {
    it('should delete unused tokens for user successfully', async () => {
      // Arrange
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      };
      mockRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // Act
      await repository.deleteByUserId('user-123');

      // Assert
      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('user_id = :userId', {
        userId: 'user-123',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('used_at IS NULL');
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should handle repository errors during deleteByUserId', async () => {
      // Arrange
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest
          .fn()
          .mockRejectedValue(new Error('Database connection failed')),
      };
      mockRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      // Act & Assert
      await expect(repository.deleteByUserId('user-123')).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
