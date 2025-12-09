import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeormEntryRepository } from '@infra/db/typeorm/repositories/typeorm-entry.repository';
import { EntryEntity } from '@infra/db/typeorm/entities/entry.entity';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { FinancialMetricsService } from '@infra/metrics/financial-metrics.service';

describe('TypeormEntryRepository - Get Current Balance', () => {
  let repository: TypeormEntryRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<EntryEntity>>;
  let mockLogger: jest.Mocked<ContextAwareLoggerService>;
  let mockMetrics: jest.Mocked<FinancialMetricsService>;

  beforeEach(async () => {
    mockRepository = {
      createQueryBuilder: jest.fn(),
    } as any;

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      logBusinessEvent: jest.fn(),
    } as any;

    mockMetrics = {
      recordHttpRequest: jest.fn(),
      recordAuthEvent: jest.fn(),
      recordTransaction: jest.fn(),
      recordApiError: jest.fn(),
      updateActiveUsers: jest.fn(),
      getMetrics: jest.fn(),
    } as any;

    testingModule = await Test.createTestingModule({
      providers: [
        TypeormEntryRepository,
        {
          provide: getRepositoryToken(EntryEntity),
          useValue: mockRepository,
        },
        {
          provide: 'Logger',
          useValue: mockLogger,
        },
        {
          provide: 'Metrics',
          useValue: mockMetrics,
        },
      ],
    }).compile();

    repository = testingModule.get<TypeormEntryRepository>(
      TypeormEntryRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentBalance', () => {
    it('should get current balance', async () => {
      // Arrange
      const userId = 'test-user-id';
      const mockResult = {
        totalIncome: '8000.00',
        totalExpenses: '3500.00',
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockResult),
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      // Act
      const result = await repository.getCurrentBalance(userId);

      // Assert
      expect(result).toBe(4500);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('entry');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        "SUM(CASE WHEN entry.type = 'INCOME' THEN entry.amount ELSE 0 END)",
        'totalIncome',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        "SUM(CASE WHEN entry.type = 'EXPENSE' AND (entry.isPaid = false OR entry.isPaid IS NULL) THEN entry.amount ELSE 0 END)",
        'totalExpenses',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'entry.userId = :userId',
        { userId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.deletedAt IS NULL',
      );
      expect(mockQueryBuilder.getRawOne).toHaveBeenCalled();
      expect(mockLogger.logBusinessEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'current_balance_calculated',
          userId,
          metadata: expect.objectContaining({
            totalIncome: 8000,
            totalExpenses: 3500,
            currentBalance: 4500,
          }),
        }),
      );
      expect(mockMetrics.recordTransaction).toHaveBeenCalledWith(
        'get_current_balance',
        'success',
      );
    });

    it('should handle null result from database', async () => {
      // Arrange
      const userId = 'test-user-id';
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      // Act
      const result = await repository.getCurrentBalance(userId);

      // Assert
      expect(result).toBe(0);
      expect(mockLogger.logBusinessEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'current_balance_calculated',
          userId,
          metadata: expect.objectContaining({
            totalIncome: 0,
            totalExpenses: 0,
            currentBalance: 0,
          }),
        }),
      );
    });

    it('should handle empty string values from database', async () => {
      // Arrange
      const userId = 'test-user-id';
      const mockResult = {
        totalIncome: '',
        totalExpenses: '',
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockResult),
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      // Act
      const result = await repository.getCurrentBalance(userId);

      // Assert
      expect(result).toBe(0);
      expect(mockLogger.logBusinessEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'current_balance_calculated',
          userId,
          metadata: expect.objectContaining({
            totalIncome: 0,
            totalExpenses: 0,
            currentBalance: 0,
          }),
        }),
      );
    });

    it('should handle negative balance', async () => {
      // Arrange
      const userId = 'test-user-id';
      const mockResult = {
        totalIncome: '1000.00',
        totalExpenses: '3000.00',
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockResult),
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      // Act
      const result = await repository.getCurrentBalance(userId);

      // Assert
      expect(result).toBe(-2000);
      expect(mockLogger.logBusinessEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'current_balance_calculated',
          userId,
          metadata: expect.objectContaining({
            totalIncome: 1000,
            totalExpenses: 3000,
            currentBalance: -2000,
          }),
        }),
      );
    });

    it('should handle database error', async () => {
      // Arrange
      const userId = 'test-user-id';
      const mockError = new Error('Database connection error');
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockRejectedValue(mockError),
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      // Act & Assert
      await expect(repository.getCurrentBalance(userId)).rejects.toThrow(
        mockError,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Failed to get current balance for user ${userId}`,
        mockError.stack,
      );
      expect(mockMetrics.recordApiError).toHaveBeenCalledWith(
        'get_current_balance',
        mockError.message,
      );
    });
  });
});
