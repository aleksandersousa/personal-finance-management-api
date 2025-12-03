import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TypeormEntryRepository } from '@infra/db/typeorm/repositories/typeorm-entry.repository';
import { EntryEntity } from '@infra/db/typeorm/entities/entry.entity';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { FinancialMetricsService } from '@infra/metrics/financial-metrics.service';

describe('TypeormEntryRepository - Get Monthly Summary Stats', () => {
  let repository: TypeormEntryRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<EntryEntity>>;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<EntryEntity>>;
  let mockLogger: jest.Mocked<ContextAwareLoggerService>;
  let mockMetrics: jest.Mocked<FinancialMetricsService>;

  const mockSummaryStats = {
    totalIncome: '5000.00',
    totalExpenses: '3000.00',
    fixedIncome: '4000.00',
    dynamicIncome: '1000.00',
    fixedExpenses: '2000.00',
    dynamicExpenses: '1000.00',
    totalEntries: '10',
    incomeEntries: '4',
    expenseEntries: '6',
  };

  beforeEach(async () => {
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    } as any;

    mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
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

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('entry');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        "SUM(CASE WHEN entry.type = 'INCOME' THEN entry.amount ELSE 0 END)",
        'totalIncome',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        "SUM(CASE WHEN entry.type = 'EXPENSE' THEN entry.amount ELSE 0 END)",
        'totalExpenses',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        "SUM(CASE WHEN entry.type = 'INCOME' AND entry.isFixed = true THEN entry.amount ELSE 0 END)",
        'fixedIncome',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        "SUM(CASE WHEN entry.type = 'INCOME' AND entry.isFixed = false THEN entry.amount ELSE 0 END)",
        'dynamicIncome',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        "SUM(CASE WHEN entry.type = 'EXPENSE' AND entry.isFixed = true THEN entry.amount ELSE 0 END)",
        'fixedExpenses',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        "SUM(CASE WHEN entry.type = 'EXPENSE' AND entry.isFixed = false THEN entry.amount ELSE 0 END)",
        'dynamicExpenses',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        'COUNT(*)',
        'totalEntries',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        "COUNT(CASE WHEN entry.type = 'INCOME' THEN 1 END)",
        'incomeEntries',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        "COUNT(CASE WHEN entry.type = 'EXPENSE' THEN 1 END)",
        'expenseEntries',
      );

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'entry.userId = :userId',
        { userId: 'user-123' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.date >= :startDate',
        { startDate: new Date(2024, 0, 1) },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.date <= :endDate',
        { endDate: new Date(2024, 1, 0, 23, 59, 59) },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.deletedAt IS NULL',
      );

      expect(result).toEqual({
        totalIncome: 5000,
        totalExpenses: 3000,
        fixedIncome: 4000,
        dynamicIncome: 1000,
        fixedExpenses: 2000,
        dynamicExpenses: 1000,
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
        fixedIncome: 0,
        dynamicIncome: 0,
        fixedExpenses: 0,
        dynamicExpenses: 0,
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
        fixedIncome: 0,
        dynamicIncome: 0,
        fixedExpenses: 0,
        dynamicExpenses: 0,
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
      await repository.getMonthlySummaryStats('user-123', 2024, 2);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.date >= :startDate',
        { startDate: new Date(2024, 1, 1) }, // February 1st
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.date <= :endDate',
        { endDate: new Date(2024, 2, 0, 23, 59, 59) }, // February 29th (leap year)
      );
    });

    it('should calculate correct date range for December', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue(mockSummaryStats);

      await repository.getMonthlySummaryStats('user-123', 2024, 12);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.date >= :startDate',
        { startDate: new Date(2024, 11, 1) }, // December 1st
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.date <= :endDate',
        { endDate: new Date(2024, 12, 0, 23, 59, 59) }, // December 31st
      );
    });
  });
});
