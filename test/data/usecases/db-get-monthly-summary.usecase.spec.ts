import { DbGetMonthlySummaryUseCase } from '../../../src/data/usecases/db-get-monthly-summary.usecase';
import { EntryRepository } from '../../../src/data/protocols/repositories/entry-repository';
import { UserRepository } from '../../../src/data/protocols/repositories/user-repository';
import { Logger } from '../../../src/data/protocols/logger';
import { Metrics } from '../../../src/data/protocols/metrics';
import { UserModel } from '../../../src/domain/models/user.model';

describe('DbGetMonthlySummaryUseCase', () => {
  let sut: DbGetMonthlySummaryUseCase;
  let mockEntryRepository: jest.Mocked<EntryRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockLogger: jest.Mocked<Logger>;
  let mockMetrics: jest.Mocked<Metrics>;

  beforeEach(() => {
    mockEntryRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByUserIdAndMonth: jest.fn(),
      findByUserIdAndMonthWithFilters: jest.fn(),
      getMonthlySummaryStats: jest.fn(),
      getCategorySummaryForMonth: jest.fn(),
      getFixedEntriesSummary: jest.fn(),
      getCurrentBalance: jest.fn(),
      getDistinctMonthsYears: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
    };

    mockUserRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
    };

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      logBusinessEvent: jest.fn(),
      logSecurityEvent: jest.fn(),
      logPerformanceEvent: jest.fn(),
    };

    mockMetrics = {
      recordHttpRequest: jest.fn(),
      recordAuthEvent: jest.fn(),
      recordTransaction: jest.fn(),
      recordApiError: jest.fn(),
      updateActiveUsers: jest.fn(),
      getMetrics: jest.fn(),
    };

    sut = new DbGetMonthlySummaryUseCase(
      mockEntryRepository,
      mockUserRepository,
      mockLogger,
      mockMetrics,
    );
  });

  describe('execute', () => {
    const mockUser: UserModel = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedPassword',
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockSummaryStats = {
      totalIncome: 6800,
      totalExpenses: 4200,
      fixedIncome: 5000,
      dynamicIncome: 1800,
      fixedExpenses: 2500,
      dynamicExpenses: 1700,
      totalEntries: 28,
      incomeEntries: 12,
      expenseEntries: 16,
    };

    const mockCategorySummary = {
      items: [
        {
          categoryId: 'cat-1',
          categoryName: 'Salary',
          type: 'INCOME' as const,
          total: 5000,
          count: 1,
        },
        {
          categoryId: 'cat-2',
          categoryName: 'Housing',
          type: 'EXPENSE' as const,
          total: 1200,
          count: 3,
        },
        {
          categoryId: 'cat-3',
          categoryName: 'Food',
          type: 'EXPENSE' as const,
          total: 800,
          count: 5,
        },
      ],
      incomeTotal: 2,
      expenseTotal: 3,
    };

    const mockPreviousMonthStats = {
      totalIncome: 6600,
      totalExpenses: 4350,
      fixedIncome: 5000,
      dynamicIncome: 1600,
      fixedExpenses: 2600,
      dynamicExpenses: 1750,
      totalEntries: 25,
      incomeEntries: 10,
      expenseEntries: 15,
    };

    it('should generate monthly summary successfully without categories', async () => {
      const request = {
        userId: 'user-123',
        year: 2024,
        month: 1,
        includeCategories: false,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockEntryRepository.getMonthlySummaryStats.mockResolvedValue(
        mockSummaryStats,
      );
      mockEntryRepository.getMonthlySummaryStats
        .mockResolvedValueOnce(mockSummaryStats) // Current month
        .mockResolvedValueOnce(mockPreviousMonthStats); // Previous month

      const result = await sut.execute(request);

      expect(result.month).toBe('2024-01');
      expect(result.summary).toEqual({
        totalIncome: 6800,
        totalExpenses: 4200,
        balance: 2600,
        fixedIncome: 5000,
        dynamicIncome: 1800,
        fixedExpenses: 2500,
        dynamicExpenses: 1700,
        entriesCount: {
          total: 28,
          income: 12,
          expenses: 16,
        },
      });

      expect(result.categoryBreakdown).toBeUndefined();
      expect(result.comparisonWithPrevious).toEqual({
        incomeChange: 200,
        expenseChange: -150,
        balanceChange: 350,
        percentageChanges: {
          income: 3.03,
          expense: -3.45,
          balance: 15.56,
        },
      });

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(mockEntryRepository.getMonthlySummaryStats).toHaveBeenCalledTimes(
        2,
      );
      expect(
        mockEntryRepository.getCategorySummaryForMonth,
      ).not.toHaveBeenCalled();
    });

    it('should generate monthly summary successfully with categories', async () => {
      const request = {
        userId: 'user-123',
        year: 2024,
        month: 1,
        includeCategories: true,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockEntryRepository.getMonthlySummaryStats
        .mockResolvedValueOnce(mockSummaryStats) // Current month
        .mockResolvedValueOnce(mockPreviousMonthStats); // Previous month
      mockEntryRepository.getCategorySummaryForMonth.mockResolvedValue(
        mockCategorySummary,
      );

      const result = await sut.execute(request);

      expect(result.categoryBreakdown).toEqual(mockCategorySummary);
      expect(
        mockEntryRepository.getCategorySummaryForMonth,
      ).toHaveBeenCalledWith('user-123', 2024, 1);
    });

    it('should handle previous month calculation for January (go to previous year)', async () => {
      const request = {
        userId: 'user-123',
        year: 2024,
        month: 1,
        includeCategories: false,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockEntryRepository.getMonthlySummaryStats
        .mockResolvedValueOnce(mockSummaryStats) // Current: Jan 2024
        .mockResolvedValueOnce(mockPreviousMonthStats); // Previous: Dec 2023

      await sut.execute(request);

      expect(
        mockEntryRepository.getMonthlySummaryStats,
      ).toHaveBeenNthCalledWith(
        2,
        'user-123',
        2023, // Previous year
        12, // December
      );
    });

    it('should handle previous month calculation for non-January months', async () => {
      const request = {
        userId: 'user-123',
        year: 2024,
        month: 5,
        includeCategories: false,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockEntryRepository.getMonthlySummaryStats
        .mockResolvedValueOnce(mockSummaryStats) // Current: May 2024
        .mockResolvedValueOnce(mockPreviousMonthStats); // Previous: Apr 2024

      await sut.execute(request);

      expect(
        mockEntryRepository.getMonthlySummaryStats,
      ).toHaveBeenNthCalledWith(
        2,
        'user-123',
        2024, // Same year
        4, // April
      );
    });

    it('should handle zero division in percentage calculations', async () => {
      const request = {
        userId: 'user-123',
        year: 2024,
        month: 1,
        includeCategories: false,
      };

      const zeroStats = {
        ...mockPreviousMonthStats,
        totalIncome: 0,
        totalExpenses: 0,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockEntryRepository.getMonthlySummaryStats
        .mockResolvedValueOnce(mockSummaryStats) // Current month
        .mockResolvedValueOnce(zeroStats); // Previous month with zeros

      const result = await sut.execute(request);

      expect(result.comparisonWithPrevious.percentageChanges).toEqual({
        income: 0,
        expense: 0,
        balance: 0,
      });
    });

    it('should throw error if user ID is not provided', async () => {
      const request = {
        userId: '',
        year: 2024,
        month: 1,
      };

      await expect(sut.execute(request)).rejects.toThrow('User ID is required');
    });

    it('should throw error if year is invalid', async () => {
      const request = {
        userId: 'user-123',
        year: 1800,
        month: 1,
      };

      await expect(sut.execute(request)).rejects.toThrow('Invalid year');
    });

    it('should throw error if month is invalid', async () => {
      const request = {
        userId: 'user-123',
        year: 2024,
        month: 13,
      };

      await expect(sut.execute(request)).rejects.toThrow('Invalid month');
    });

    it('should throw error if user not found', async () => {
      const request = {
        userId: 'user-123',
        year: 2024,
        month: 1,
      };

      mockUserRepository.findById.mockResolvedValue(null);

      await expect(sut.execute(request)).rejects.toThrow('User not found');
    });

    it('should log error on failure', async () => {
      const request = {
        userId: 'user-123',
        year: 2024,
        month: 1,
      };

      const error = new Error('Database error');
      mockUserRepository.findById.mockRejectedValue(error);

      await expect(sut.execute(request)).rejects.toThrow('Database error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to generate monthly summary',
        error.stack,
      );
    });

    it('should handle repository error gracefully', async () => {
      const request = {
        userId: 'user-123',
        year: 2024,
        month: 1,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockEntryRepository.getMonthlySummaryStats.mockRejectedValue(
        new Error('Repository error'),
      );

      await expect(sut.execute(request)).rejects.toThrow('Repository error');
    });
  });
});
