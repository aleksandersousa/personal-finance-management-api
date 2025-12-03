import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeormPasswordResetTokenRepository } from '@infra/db/typeorm/repositories';
import { PasswordResetTokenEntity } from '@infra/db/typeorm/entities';

describe('TypeormPasswordResetTokenRepository - Mark As Used', () => {
  let repository: TypeormPasswordResetTokenRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<PasswordResetTokenEntity>>;

  beforeEach(async () => {
    mockRepository = {
      update: jest.fn(),
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

  describe('markAsUsed', () => {
    it('should mark token as used successfully', async () => {
      // Arrange
      const tokenId = 'token-123';
      mockRepository.update.mockResolvedValue({ affected: 1 } as any);

      // Act
      await repository.markAsUsed(tokenId);

      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith(tokenId, {
        usedAt: expect.any(Date),
      });
    });

    it('should handle repository errors during markAsUsed', async () => {
      // Arrange
      const tokenId = 'token-123';
      mockRepository.update.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(repository.markAsUsed(tokenId)).rejects.toThrow(
        'Database error',
      );
    });
  });
});
