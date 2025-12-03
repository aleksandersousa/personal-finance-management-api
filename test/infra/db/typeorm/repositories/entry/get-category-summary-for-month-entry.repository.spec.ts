import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TypeormEntryRepository } from '@infra/db/typeorm/repositories/typeorm-entry.repository';
import { EntryEntity } from '@infra/db/typeorm/entities/entry.entity';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { FinancialMetricsService } from '@infra/metrics/financial-metrics.service';

describe('TypeormEntryRepository - Get Category Summary For Month', () => {
  let repository: TypeormEntryRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<EntryEntity>>;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<EntryEntity>>;
  let mockLogger: jest.Mocked<ContextAwareLoggerService>;
  let mockMetrics: jest.Mocked<FinancialMetricsService>;

  const mockCategorySummaryResults = [
    {
      entry_categoryId: 'category-1',
      category_name: 'Food',
      entry_type: 'EXPENSE',
      sum: '1500.00',
      count: '5',
    },
    {
      entry_categoryId: 'category-2',
      category_name: 'Salary',
      entry_type: 'INCOME',
      sum: '5000.00',
      count: '1',
    },
    {
      entry_categoryId: 'category-3',
      category_name: null, // Test null category name
      entry_type: 'EXPENSE',
      sum: '500.00',
      count: '2',
    },
  ];

  beforeEach(async () => {
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
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

  describe('getCategorySummaryForMonth', () => {
    it('should get category summary for month successfully', async () => {
      // Mock query builder - we get all results then slice to top 3
      mockQueryBuilder.getRawMany.mockResolvedValue(mockCategorySummaryResults);

      const result = await repository.getCategorySummaryForMonth(
        'user-123',
        2024,
        1,
      );

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('entry');
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'entry.category',
        'category',
      );
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'entry.categoryId',
        'category.name',
        'entry.type',
        'SUM(entry.amount)',
        'COUNT(*)',
      ]);

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
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.categoryId IS NOT NULL',
      );
      expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith(
        'entry.categoryId, category.name, entry.type',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'SUM(entry.amount)',
        'DESC',
      );

      expect(result).toEqual({
        items: [
          {
            categoryId: 'category-1',
            categoryName: 'Food',
            type: 'EXPENSE',
            total: 1500,
            count: 5,
          },
          {
            categoryId: 'category-2',
            categoryName: 'Salary',
            type: 'INCOME',
            total: 5000,
            count: 1,
          },
          {
            categoryId: 'category-3',
            categoryName: 'Unknown Category', // Should default to 'Unknown Category'
            type: 'EXPENSE',
            total: 500,
            count: 2,
          },
        ],
        incomeTotal: 1,
        expenseTotal: 2,
      });

      // Verify business event logging
      expect(mockLogger.logBusinessEvent).toHaveBeenCalledWith({
        event: 'category_summary_calculated',
        userId: 'user-123',
        metadata: {
          year: 2024,
          month: 1,
          categoriesCount: 3,
          incomeTotal: 1,
          expenseTotal: 2,
          duration: 0, // Date.now() - startTime mocked to return 0
        },
      });

      // Verify metrics recording
      expect(mockMetrics.recordTransaction).toHaveBeenCalledWith(
        'get_category_summary',
        'success',
      );
    });

    it('should handle empty results', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await repository.getCategorySummaryForMonth(
        'user-123',
        2024,
        1,
      );

      expect(result).toEqual({
        items: [],
        incomeTotal: 0,
        expenseTotal: 0,
      });

      // Verify business event logging with zero categories
      expect(mockLogger.logBusinessEvent).toHaveBeenCalledWith({
        event: 'category_summary_calculated',
        userId: 'user-123',
        metadata: {
          year: 2024,
          month: 1,
          categoriesCount: 0,
          incomeTotal: 0,
          expenseTotal: 0,
          duration: 0,
        },
      });
    });

    it('should handle null values in result data', async () => {
      const resultsWithNulls = [
        {
          entry_categoryId: 'category-1',
          category_name: 'Food',
          entry_type: 'EXPENSE',
          sum: null, // null sum
          count: null, // null count
        },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(resultsWithNulls);

      const result = await repository.getCategorySummaryForMonth(
        'user-123',
        2024,
        1,
      );

      expect(result).toEqual({
        items: [
          {
            categoryId: 'category-1',
            categoryName: 'Food',
            type: 'EXPENSE',
            total: 0, // Should convert null to 0
            count: 0, // Should convert null to 0
          },
        ],
        incomeTotal: 0,
        expenseTotal: 1,
      });
    });

    it('should handle database errors during getCategorySummaryForMonth', async () => {
      const dbError = new Error('Database query failed');
      mockQueryBuilder.getRawMany.mockRejectedValue(dbError);

      await expect(
        repository.getCategorySummaryForMonth('user-123', 2024, 1),
      ).rejects.toThrow('Database query failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get category summary for user user-123',
        dbError.stack,
      );
      expect(mockMetrics.recordApiError).toHaveBeenCalledWith(
        'get_category_summary',
        'Database query failed',
      );
    });

    it('should calculate correct date range for different months', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      // Test June 2024
      await repository.getCategorySummaryForMonth('user-123', 2024, 6);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.date >= :startDate',
        { startDate: new Date(2024, 5, 1) }, // June 1st
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.date <= :endDate',
        { endDate: new Date(2024, 6, 0, 23, 59, 59) }, // June 30th
      );
    });

    it('should handle undefined sum and count values', async () => {
      const resultsWithUndefined = [
        {
          entry_categoryId: 'category-1',
          category_name: 'Food',
          entry_type: 'EXPENSE',
          sum: undefined,
          count: undefined,
        },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(resultsWithUndefined);

      const result = await repository.getCategorySummaryForMonth(
        'user-123',
        2024,
        1,
      );

      expect(result).toEqual({
        items: [
          {
            categoryId: 'category-1',
            categoryName: 'Food',
            type: 'EXPENSE',
            total: 0, // Should convert undefined to 0
            count: 0, // Should convert undefined to 0
          },
        ],
        incomeTotal: 0,
        expenseTotal: 1,
      });
    });
  });
});
