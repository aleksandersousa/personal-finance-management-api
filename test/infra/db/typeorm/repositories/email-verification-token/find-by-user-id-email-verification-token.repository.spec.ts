import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeormEmailVerificationTokenRepository } from '@infra/db/typeorm/repositories/typeorm-email-verification-token.repository';
import { EmailVerificationTokenEntity } from '@infra/db/typeorm/entities/email-verification-token.entity';

describe('TypeormEmailVerificationTokenRepository - Find By User ID', () => {
  let repository: TypeormEmailVerificationTokenRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<EmailVerificationTokenEntity>>;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
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
});
