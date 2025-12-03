import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeormEmailVerificationTokenRepository } from '@infra/db/typeorm/repositories/typeorm-email-verification-token.repository';
import { EmailVerificationTokenEntity } from '@infra/db/typeorm/entities/email-verification-token.entity';

describe('TypeormEmailVerificationTokenRepository - Delete Expired Tokens', () => {
  let repository: TypeormEmailVerificationTokenRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<EmailVerificationTokenEntity>>;

  beforeEach(async () => {
    mockRepository = {
      delete: jest.fn(),
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
});

