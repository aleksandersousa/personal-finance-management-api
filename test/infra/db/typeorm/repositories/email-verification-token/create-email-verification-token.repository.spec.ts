import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeormEmailVerificationTokenRepository } from '@infra/db/typeorm/repositories/typeorm-email-verification-token.repository';
import { EmailVerificationTokenEntity } from '@infra/db/typeorm/entities/email-verification-token.entity';

describe('TypeormEmailVerificationTokenRepository - Create Token', () => {
  let repository: TypeormEmailVerificationTokenRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<EmailVerificationTokenEntity>>;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
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
});
