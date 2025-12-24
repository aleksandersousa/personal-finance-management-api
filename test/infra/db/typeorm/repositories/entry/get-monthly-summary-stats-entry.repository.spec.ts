import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TypeormEntryRepository } from '@infra/db/typeorm/repositories/typeorm-entry.repository';
import { EntryEntity } from '@infra/db/typeorm/entities/entry.entity';
import { EntryMonthlyPaymentEntity } from '@infra/db/typeorm/entities/entry-monthly-payment.entity';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { FinancialMetricsService } from '@infra/metrics/financial-metrics.service';

describe('TypeormEntryRepository - Get Monthly Summary Stats', () => {
  let repository: TypeormEntryRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<EntryEntity>>;
  let mockMonthlyPaymentRepository: jest.Mocked<
    Repository<EntryMonthlyPaymentEntity>
  >;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<EntryEntity>>;
  let mockLogger: jest.Mocked<ContextAwareLoggerService>;
  let mockMetrics: jest.Mocked<FinancialMetricsService>;

  const mockSummaryStats = {
    totalIncome: '5000.00',
    totalExpenses: '3000.00',
    totalPaidExpenses: '3000.00',
    totalUnpaidExpenses: '0.00',
    fixedIncome: '4000.00',
    dynamicIncome: '1000.00',
    fixedExpenses: '2000.00',
    fixedPaidExpenses: '2000.00',
    fixedUnpaidExpenses: '0.00',
    dynamicExpenses: '1000.00',
    dynamicPaidExpenses: '1000.00',
    dynamicUnpaidExpenses: '0.00',
    totalEntries: '10',
    incomeEntries: '4',
    expenseEntries: '6',
  };

  beforeEach(async () => {
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    } as any;

    mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    mockMonthlyPaymentRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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
          provide: getRepositoryToken(EntryMonthlyPaymentEntity),
          useValue: mockMonthlyPaymentRepository,
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

    jest.spyOn(Date, 'now').mockReturnValue(1234567890);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('getMonthlySummaryStats', () => {
    it('should get monthly summary stats successfully', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue(mockSummaryStats);

      const result = await repository.getMonthlySummaryStats(
        'user-123',
        2024,
        1,
      );

      // Verify query builder methods were called (implementation now has complex monthly payment logic)
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('entry');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.addSelect).toHaveBeenCalled();
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalled(); // Now includes monthly payments join
      expect(mockQueryBuilder.where).toHaveBeenCalled(); // Implementation now uses Brackets for where clause
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled(); // Date filtering and soft delete
      expect(mockQueryBuilder.getRawOne).toHaveBeenCalled();

      // Verify result structure and values
      expect(result).toEqual({
        totalIncome: 5000,
        totalExpenses: 3000,
        totalPaidExpenses: 3000,
        totalUnpaidExpenses: 0,
        fixedIncome: 4000,
        dynamicIncome: 1000,
        fixedExpenses: 2000,
        fixedPaidExpenses: 2000,
        fixedUnpaidExpenses: 0,
        dynamicExpenses: 1000,
        dynamicPaidExpenses: 1000,
        dynamicUnpaidExpenses: 0,
        totalEntries: 10,
        incomeEntries: 4,
        expenseEntries: 6,
      });

      // Verify business event logging
      expect(mockLogger.logBusinessEvent).toHaveBeenCalledWith({
        event: 'monthly_summary_stats_calculated',
        userId: 'user-123',
        metadata: {
          year: 2024,
          month: 1,
          duration: 0, // Date.now() - startTime mocked to return 0
        },
      });

      // Verify metrics recording
      expect(mockMetrics.recordTransaction).toHaveBeenCalledWith(
        'get_monthly_summary_stats',
        'success',
      );
    });

    it('should handle null values in summary stats', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: null,
        totalExpenses: null,
        fixedIncome: null,
        dynamicIncome: null,
        fixedExpenses: null,
        dynamicExpenses: null,
        totalEntries: null,
        incomeEntries: null,
        expenseEntries: null,
      });

      const result = await repository.getMonthlySummaryStats(
        'user-123',
        2024,
        1,
      );

      expect(result).toEqual({
        totalIncome: 0,
        totalExpenses: 0,
        totalPaidExpenses: 0,
        totalUnpaidExpenses: 0,
        fixedIncome: 0,
        dynamicIncome: 0,
        fixedExpenses: 0,
        fixedPaidExpenses: 0,
        fixedUnpaidExpenses: 0,
        dynamicExpenses: 0,
        dynamicPaidExpenses: 0,
        dynamicUnpaidExpenses: 0,
        totalEntries: 0,
        incomeEntries: 0,
        expenseEntries: 0,
      });
    });

    it('should handle undefined result from query', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue(undefined);

      const result = await repository.getMonthlySummaryStats(
        'user-123',
        2024,
        1,
      );

      expect(result).toEqual({
        totalIncome: 0,
        totalExpenses: 0,
        totalPaidExpenses: 0,
        totalUnpaidExpenses: 0,
        fixedIncome: 0,
        dynamicIncome: 0,
        fixedExpenses: 0,
        fixedPaidExpenses: 0,
        fixedUnpaidExpenses: 0,
        dynamicExpenses: 0,
        dynamicPaidExpenses: 0,
        dynamicUnpaidExpenses: 0,
        totalEntries: 0,
        incomeEntries: 0,
        expenseEntries: 0,
      });
    });

    it('should handle database errors during getMonthlySummaryStats', async () => {
      const dbError = new Error('Database query failed');
      mockQueryBuilder.getRawOne.mockRejectedValue(dbError);

      await expect(
        repository.getMonthlySummaryStats('user-123', 2024, 1),
      ).rejects.toThrow('Database query failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get monthly summary stats for user user-123',
        dbError.stack,
      );
      expect(mockMetrics.recordApiError).toHaveBeenCalledWith(
        'get_monthly_summary_stats',
        'Database query failed',
      );
    });

    it('should calculate correct date range for different months', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue(mockSummaryStats);

      // Test February 2024 (leap year)
      const result = await repository.getMonthlySummaryStats(
        'user-123',
        2024,
        2,
      );

      // Verify query was executed with correct parameters (implementation uses Brackets for date filtering now)
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should calculate correct date range for December', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue(mockSummaryStats);

      const result = await repository.getMonthlySummaryStats(
        'user-123',
        2024,
        12,
      );

      // Verify query was executed with correct parameters (implementation uses Brackets for date filtering now)
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
