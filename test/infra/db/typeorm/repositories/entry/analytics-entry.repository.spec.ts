import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeormEntryRepository } from '@infra/db/typeorm/repositories/typeorm-entry.repository';
import { EntryEntity } from '@infra/db/typeorm/entities/entry.entity';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { FinancialMetricsService } from '@infra/metrics/financial-metrics.service';

describe('TypeormEntryRepository - Analytics', () => {
  let repository: TypeormEntryRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<EntryEntity>>;
  let mockLogger: jest.Mocked<ContextAwareLoggerService>;
  let mockMetrics: jest.Mocked<FinancialMetricsService>;

  beforeEach(async () => {
    mockRepository = {
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

  describe('getMonthlySummaryStats', () => {
    it('should get monthly summary stats successfully', async () => {
      const userId = 'test-user-id';
      const mockResult = {
        totalIncome: '5000.00',
        totalExpenses: '2500.00',
        totalEntries: '10',
        fixedIncome: '3000.00',
        fixedExpenses: '1500.00',
        dynamicIncome: '2000.00',
        dynamicExpenses: '1000.00',
        incomeEntries: '6',
        expenseEntries: '4',
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

      const result = await repository.getMonthlySummaryStats(userId, 2024, 1);

      expect(result).toEqual({
        totalIncome: 5000,
        totalExpenses: 2500,
        totalEntries: 10,
        fixedIncome: 3000,
        fixedExpenses: 1500,
        dynamicIncome: 2000,
        dynamicExpenses: 1000,
        incomeEntries: 6,
        expenseEntries: 4,
      });

      expect(mockLogger.logBusinessEvent).toHaveBeenCalledWith({
        event: 'monthly_summary_stats_calculated',
        userId,
        metadata: expect.objectContaining({
          year: 2024,
          month: 1,
          duration: expect.any(Number),
        }),
      });

      expect(mockMetrics.recordTransaction).toHaveBeenCalledWith(
        'get_monthly_summary_stats',
        'success',
      );
    });
  });

  describe('getCategorySummaryForMonth', () => {
    it('should get category summary for month successfully', async () => {
      const userId = 'test-user-id';
      const mockResults = [
        {
          entry_categoryId: 'category-1',
          category_name: 'Food',
          entry_type: 'EXPENSE',
          sum: '1000.00',
          count: '5',
        },
      ];

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockResults),
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await repository.getCategorySummaryForMonth(
        userId,
        2024,
        1,
      );

      expect(result).toEqual({
        items: [
          {
            categoryId: 'category-1',
            categoryName: 'Food',
            type: 'EXPENSE',
            total: 1000,
            count: 5,
          },
        ],
        incomeTotal: 0,
        expenseTotal: 1,
      });
    });
  });

  describe('getFixedEntriesSummary', () => {
    it('should get fixed entries summary', async () => {
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

      const result = await repository.getFixedEntriesSummary(userId);

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

      const result = await repository.getFixedEntriesSummary(userId);

      expect(result).toEqual({
        fixedIncome: 0,
        fixedExpenses: 0,
        fixedNetFlow: 0,
        entriesCount: 0,
      });
    });
  });

  describe('getCurrentBalance', () => {
    it('should get current balance', async () => {
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

      const result = await repository.getCurrentBalance(userId);

      expect(result).toBe(4500);
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

      const result = await repository.getCurrentBalance(userId);

      expect(result).toBe(0);
    });
  });
});
