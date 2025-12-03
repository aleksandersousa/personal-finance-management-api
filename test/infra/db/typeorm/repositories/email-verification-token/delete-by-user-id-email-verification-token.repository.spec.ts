import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeormEmailVerificationTokenRepository } from '@infra/db/typeorm/repositories/typeorm-email-verification-token.repository';
import { EmailVerificationTokenEntity } from '@infra/db/typeorm/entities/email-verification-token.entity';

describe('TypeormEmailVerificationTokenRepository - Delete By User ID', () => {
  let repository: TypeormEmailVerificationTokenRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<EmailVerificationTokenEntity>>;

  beforeEach(async () => {
    mockRepository = {
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

