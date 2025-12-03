import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeormPasswordResetTokenRepository } from '@infra/db/typeorm/repositories';
import { PasswordResetTokenEntity } from '@infra/db/typeorm/entities';

describe('TypeormPasswordResetTokenRepository - Delete By User Id', () => {
  let repository: TypeormPasswordResetTokenRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<PasswordResetTokenEntity>>;
  let mockQueryBuilder: any;

  beforeEach(async () => {
    mockQueryBuilder = {
      delete: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };

    mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
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

  describe('deleteByUserId', () => {
    it('should delete unused tokens by user id successfully', async () => {
      // Arrange
      const userId = 'user-123';
      mockQueryBuilder.execute.mockResolvedValue({ affected: 2 });

      // Act
      await repository.deleteByUserId(userId);

      // Assert
      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('user_id = :userId', {
        userId,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('used_at IS NULL');
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should handle repository errors during deleteByUserId', async () => {
      // Arrange
      const userId = 'user-123';
      mockQueryBuilder.execute.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(repository.deleteByUserId(userId)).rejects.toThrow(
        'Database error',
      );
    });
  });
});
