import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeormEmailVerificationTokenRepository } from '@infra/db/typeorm/repositories/typeorm-email-verification-token.repository';
import { EmailVerificationTokenEntity } from '@infra/db/typeorm/entities/email-verification-token.entity';

describe('TypeormEmailVerificationTokenRepository - Mark As Used', () => {
  let repository: TypeormEmailVerificationTokenRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<EmailVerificationTokenEntity>>;

  beforeEach(async () => {
    mockRepository = {
      update: jest.fn(),
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
});
