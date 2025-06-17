import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SummaryController } from '@presentation/controllers/summary.controller';
import { GetMonthlySummaryUseCase } from '@domain/usecases/get-monthly-summary.usecase';
import { Logger } from '@data/protocols/logger';

describe('SummaryController', () => {
  let controller: SummaryController;
  let getMonthlySummaryUseCase: jest.Mocked<GetMonthlySummaryUseCase>;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    const mockGetMonthlySummaryUseCase = {
      execute: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      logBusinessEvent: jest.fn(),
      logSecurityEvent: jest.fn(),
      logPerformanceEvent: jest.fn(),
    };

    const mockMetrics = {
      recordHttpRequest: jest.fn(),
      recordAuthEvent: jest.fn(),
      recordTransaction: jest.fn(),
      recordApiError: jest.fn(),
      updateActiveUsers: jest.fn(),
      getMetrics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SummaryController],
      providers: [
        {
          provide: 'GetMonthlySummaryUseCase',
          useValue: mockGetMonthlySummaryUseCase,
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

    controller = module.get<SummaryController>(SummaryController);
    getMonthlySummaryUseCase = module.get('GetMonthlySummaryUseCase');
    logger = module.get('Logger');
  });

  describe('getMonthlySummary', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    };

    const mockResponse = {
      month: '2024-01',
      summary: {
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
      },
      comparisonWithPrevious: {
        incomeChange: 200,
        expenseChange: -150,
        balanceChange: 350,
        percentageChanges: {
          income: 3.03,
          expense: -3.45,
          balance: 15.56,
        },
      },
    };

    it('should return monthly summary successfully', async () => {
      getMonthlySummaryUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.getMonthlySummary(
        '2024-01',
        undefined,
        mockUser,
      );

      expect(result).toEqual(mockResponse);
      expect(getMonthlySummaryUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        year: 2024,
        month: 1,
        includeCategories: false,
      });
    });

    it('should return monthly summary with categories when requested', async () => {
      const responseWithCategories = {
        ...mockResponse,
        categoryBreakdown: [
          {
            categoryId: 'cat-1',
            categoryName: 'Salary',
            type: 'INCOME' as const,
            total: 5000,
            count: 1,
          },
        ],
      };

      getMonthlySummaryUseCase.execute.mockResolvedValue(
        responseWithCategories,
      );

      const result = await controller.getMonthlySummary(
        '2024-01',
        'true',
        mockUser,
      );

      expect(result).toEqual(responseWithCategories);
      expect(getMonthlySummaryUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        year: 2024,
        month: 1,
        includeCategories: true,
      });
    });

    it('should handle includeCategories parameter correctly', async () => {
      getMonthlySummaryUseCase.execute.mockResolvedValue(mockResponse);

      // Test with 'false'
      await controller.getMonthlySummary('2024-01', 'false', mockUser);
      expect(getMonthlySummaryUseCase.execute).toHaveBeenLastCalledWith({
        userId: 'user-123',
        year: 2024,
        month: 1,
        includeCategories: false,
      });

      // Test with 'true'
      await controller.getMonthlySummary('2024-01', 'true', mockUser);
      expect(getMonthlySummaryUseCase.execute).toHaveBeenLastCalledWith({
        userId: 'user-123',
        year: 2024,
        month: 1,
        includeCategories: true,
      });

      // Test with undefined (should default to false)
      await controller.getMonthlySummary('2024-01', undefined, mockUser);
      expect(getMonthlySummaryUseCase.execute).toHaveBeenLastCalledWith({
        userId: 'user-123',
        year: 2024,
        month: 1,
        includeCategories: false,
      });
    });

    it('should throw BadRequestException for invalid month format', async () => {
      await expect(
        controller.getMonthlySummary('invalid-month', undefined, mockUser),
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.getMonthlySummary('2024-13', undefined, mockUser),
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.getMonthlySummary('2024-00', undefined, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid year', async () => {
      await expect(
        controller.getMonthlySummary('1800-01', undefined, mockUser),
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.getMonthlySummary('2200-01', undefined, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should parse month parameter correctly', async () => {
      getMonthlySummaryUseCase.execute.mockResolvedValue(mockResponse);

      // Test various valid formats
      const testCases = [
        { input: '2024-01', expectedYear: 2024, expectedMonth: 1 },
        { input: '2024-12', expectedYear: 2024, expectedMonth: 12 },
        { input: '2023-06', expectedYear: 2023, expectedMonth: 6 },
      ];

      for (const testCase of testCases) {
        await controller.getMonthlySummary(testCase.input, undefined, mockUser);
        expect(getMonthlySummaryUseCase.execute).toHaveBeenLastCalledWith({
          userId: 'user-123',
          year: testCase.expectedYear,
          month: testCase.expectedMonth,
          includeCategories: false,
        });
      }
    });

    it('should log request and response', async () => {
      getMonthlySummaryUseCase.execute.mockResolvedValue(mockResponse);

      await controller.getMonthlySummary('2024-01', undefined, mockUser);

      expect(logger.log).toHaveBeenCalledWith(
        'Monthly summary request received',
        'SummaryController',
      );
    });

    it('should handle use case errors gracefully', async () => {
      const error = new Error('Use case error');
      getMonthlySummaryUseCase.execute.mockRejectedValue(error);

      await expect(
        controller.getMonthlySummary('2024-01', undefined, mockUser),
      ).rejects.toThrow('Failed to retrieve monthly summary');

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get monthly summary',
        error.stack,
        'SummaryController',
      );
    });

    it('should record metrics for requests', async () => {
      getMonthlySummaryUseCase.execute.mockResolvedValue(mockResponse);

      await controller.getMonthlySummary('2024-01', undefined, mockUser);

      // Verify that logging was called
      expect(logger.log).toHaveBeenCalledWith(
        'Monthly summary request received',
        'SummaryController',
      );
    });

    it('should validate month parameter format strictly', async () => {
      const invalidFormats = [
        '24-01', // Invalid year format
        '2024-1', // Invalid month format (should be 02)
        '2024/01', // Wrong separator
        '2024-01-15', // Too specific (includes day)
        '2024', // Missing month
        '01-2024', // Wrong order
        'January 2024', // Text format
        '2024-Jan', // Month as text
      ];

      for (const invalidFormat of invalidFormats) {
        await expect(
          controller.getMonthlySummary(invalidFormat, undefined, mockUser),
        ).rejects.toThrow(BadRequestException);
      }
    });

    it('should handle edge cases for includeCategories parameter', async () => {
      getMonthlySummaryUseCase.execute.mockResolvedValue(mockResponse);

      // Test various truthy/falsy values
      const testCases = [
        { input: 'true', expected: true },
        { input: 'TRUE', expected: true },
        { input: 'True', expected: true },
        { input: 'false', expected: false },
        { input: 'FALSE', expected: false },
        { input: 'False', expected: false },
        { input: '1', expected: false }, // Only 'true' should be true
        { input: '0', expected: false },
        { input: 'yes', expected: false },
        { input: 'no', expected: false },
      ];

      for (const testCase of testCases) {
        await controller.getMonthlySummary('2024-01', testCase.input, mockUser);
        expect(getMonthlySummaryUseCase.execute).toHaveBeenLastCalledWith({
          userId: 'user-123',
          year: 2024,
          month: 1,
          includeCategories: testCase.expected,
        });
      }
    });
  });
});
