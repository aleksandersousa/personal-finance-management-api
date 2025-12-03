import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeormEntryRepository } from '@infra/db/typeorm/repositories/typeorm-entry.repository';
import { EntryEntity } from '@infra/db/typeorm/entities/entry.entity';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { FinancialMetricsService } from '@infra/metrics/financial-metrics.service';

describe('TypeormEntryRepository - Get Fixed Entries Summary', () => {
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

  describe('getFixedEntriesSummary', () => {
    it('should get fixed entries summary', async () => {
      // Arrange
      const userId = 'test-user-id';
      const mockResult = {
        fixedIncome: '5000.00',
        fixedExpenses: '2500.00',
        entriesCount: '5',
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
      const result = await repository.getFixedEntriesSummary(userId);

      // Assert
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('entry');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        "SUM(CASE WHEN entry.type = 'INCOME' AND entry.isFixed = true THEN entry.amount ELSE 0 END)",
        'fixedIncome',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        "SUM(CASE WHEN entry.type = 'EXPENSE' AND entry.isFixed = true THEN entry.amount ELSE 0 END)",
        'fixedExpenses',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        'COUNT(CASE WHEN entry.isFixed = true THEN 1 END)',
        'entriesCount',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'entry.userId = :userId',
        { userId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.deletedAt IS NULL',
      );
      expect(mockQueryBuilder.getRawOne).toHaveBeenCalled();

      expect(result).toEqual({
        fixedIncome: 5000,
        fixedExpenses: 2500,
        fixedNetFlow: 2500,
        entriesCount: 5,
      });

      expect(mockLogger.logBusinessEvent).toHaveBeenCalledWith({
        event: 'fixed_entries_summary_calculated',
        userId,
        metadata: expect.objectContaining({
          fixedIncome: 5000,
          fixedExpenses: 2500,
          fixedNetFlow: 2500,
          entriesCount: 5,
          duration: expect.any(Number),
        }),
      });

      expect(mockMetrics.recordTransaction).toHaveBeenCalledWith(
        'get_fixed_entries_summary',
        'success',
      );
    });

    it('should handle null result from database query', async () => {
      // This test targets lines 449 and 475 where parseFloat and parseInt handle null/undefined values
      const userId = 'test-user-id';

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null), // null result to test fallback
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      // Act
      const result = await repository.getFixedEntriesSummary(userId);

      // Assert
      expect(result).toEqual({
        fixedIncome: 0, // parseFloat(null?.fixedIncome || '0')
        fixedExpenses: 0, // parseFloat(null?.fixedExpenses || '0')
        fixedNetFlow: 0,
        entriesCount: 0, // parseInt(null?.entriesCount || '0')
      });

      expect(mockLogger.logBusinessEvent).toHaveBeenCalledWith({
        event: 'fixed_entries_summary_calculated',
        userId,
        metadata: expect.objectContaining({
          fixedIncome: 0,
          fixedExpenses: 0,
          fixedNetFlow: 0,
          entriesCount: 0,
          duration: expect.any(Number),
        }),
      });
    });

    it('should handle undefined values in database result', async () => {
      // This test targets lines 449 and 475 with undefined values in the result object
      const userId = 'test-user-id';
      const mockResult = {
        fixedIncome: undefined, // Test undefined fixedIncome
        fixedExpenses: undefined, // Test undefined fixedExpenses
        entriesCount: undefined, // Test undefined entriesCount
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
      const result = await repository.getFixedEntriesSummary(userId);

      // Assert
      expect(result).toEqual({
        fixedIncome: 0, // parseFloat(undefined || '0')
        fixedExpenses: 0, // parseFloat(undefined || '0')
        fixedNetFlow: 0,
        entriesCount: 0, // parseInt(undefined || '0')
      });

      expect(mockLogger.logBusinessEvent).toHaveBeenCalledWith({
        event: 'fixed_entries_summary_calculated',
        userId,
        metadata: expect.objectContaining({
          fixedIncome: 0,
          fixedExpenses: 0,
          fixedNetFlow: 0,
          entriesCount: 0,
        }),
      });
    });

    it('should handle empty string values in database result', async () => {
      // This test ensures parseFloat and parseInt handle empty strings correctly
      const userId = 'test-user-id';
      const mockResult = {
        fixedIncome: '', // Empty string
        fixedExpenses: '', // Empty string
        entriesCount: '', // Empty string
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
      const result = await repository.getFixedEntriesSummary(userId);

      // Assert
      expect(result).toEqual({
        fixedIncome: 0, // parseFloat('' || '0')
        fixedExpenses: 0, // parseFloat('' || '0')
        fixedNetFlow: 0,
        entriesCount: 0, // parseInt('' || '0')
      });
    });

    it('should handle errors when getting fixed entries summary', async () => {
      // Arrange
      const userId = 'test-user-id';
      const error = new Error('Database error');

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockRejectedValue(error),
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      // Act & Assert
      await expect(repository.getFixedEntriesSummary(userId)).rejects.toThrow(
        error,
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        `Failed to get fixed entries summary for user ${userId}`,
        error.stack,
      );

      expect(mockMetrics.recordApiError).toHaveBeenCalledWith(
        'get_fixed_entries_summary',
        error.message,
      );
    });
  });
});
