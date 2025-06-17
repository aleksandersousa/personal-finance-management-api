import { DbPredictCashFlowUseCase } from '../../../src/data/usecases/db-predict-cash-flow.usecase';
import { PredictCashFlowData } from '@domain/usecases/predict-cash-flow.usecase';
import { EntryRepositoryStub } from '../mocks/repositories/entry-repository.stub';
import { LoggerSpy } from '../../infra/mocks/logging/logger.spy';
import { MetricsSpy } from '../../infra/mocks/metrics/metrics.spy';
import { MockEntryFactory } from '../../domain/mocks/models/entry.mock';
import { ForecastCacheStub } from '../mocks/protocols/cache.stub';
import { MockCashFlowForecastFactory } from '../../domain/mocks/usecases/predict-cash-flow.mock';

describe('DbPredictCashFlowUseCase', () => {
  let useCase: DbPredictCashFlowUseCase;
  let entryRepositoryStub: EntryRepositoryStub;
  let loggerSpy: LoggerSpy;
  let metricsSpy: MetricsSpy;
  let cacheStub: ForecastCacheStub;

  beforeEach(() => {
    entryRepositoryStub = new EntryRepositoryStub();
    loggerSpy = new LoggerSpy();
    metricsSpy = new MetricsSpy();
    cacheStub = new ForecastCacheStub();
    useCase = new DbPredictCashFlowUseCase(
      entryRepositoryStub,
      loggerSpy,
      metricsSpy,
      cacheStub,
    );
  });

  afterEach(() => {
    entryRepositoryStub.clear();
    loggerSpy.clear();
    metricsSpy.clear();
    cacheStub.clear();
    cacheStub.mockCacheMiss();
  });

  describe('execute', () => {
    const validPredictData: PredictCashFlowData = {
      userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      months: 6,
      includeFixed: true,
      includeRecurring: false,
    };

    it('should predict cash flow based on fixed entries', async () => {
      // Arrange
      const fixedIncomeEntry = MockEntryFactory.create({
        id: 'income-entry-1',
        userId: validPredictData.userId,
        type: 'INCOME',
        amount: 5000,
        isFixed: true,
        description: 'Monthly Salary',
      });

      const fixedExpenseEntry = MockEntryFactory.create({
        id: 'expense-entry-1',
        userId: validPredictData.userId,
        type: 'EXPENSE',
        amount: 2500,
        isFixed: true,
        description: 'Monthly Rent',
      });

      entryRepositoryStub.seed([fixedIncomeEntry, fixedExpenseEntry]);

      // Act
      const result = await useCase.execute(validPredictData);

      // Assert
      expect(result).toHaveProperty('forecastPeriod');
      expect(result.forecastPeriod.monthsCount).toBe(6);
      expect(result.monthlyProjections).toHaveLength(6);
      expect(result.monthlyProjections[0].projectedIncome).toBe(5000);
      expect(result.monthlyProjections[0].projectedExpenses).toBe(2500);
      expect(result.monthlyProjections[0].netFlow).toBe(2500);
      expect(result.summary.totalProjectedIncome).toBe(30000);
      expect(result.summary.totalProjectedExpenses).toBe(15000);
      expect(result.summary.totalNetFlow).toBe(15000);
      expect(result.insights.trend).toBe('positive');
      expect(result.insights.riskLevel).toBe('low');
    });

    it('should validate months parameter (minimum 1)', async () => {
      // Arrange
      const invalidData = { ...validPredictData, months: 0 };

      // Act & Assert
      await expect(useCase.execute(invalidData)).rejects.toThrow(
        'Months must be between 1 and 12',
      );
    });

    it('should validate months parameter (maximum 12)', async () => {
      // Arrange
      const invalidData = { ...validPredictData, months: 13 };

      // Act & Assert
      await expect(useCase.execute(invalidData)).rejects.toThrow(
        'Months must be between 1 and 12',
      );
    });

    it('should handle no fixed entries scenario', async () => {
      // Arrange
      const dynamicEntry = MockEntryFactory.create({
        id: 'dynamic-entry-1',
        userId: validPredictData.userId,
        type: 'INCOME',
        amount: 1000,
        isFixed: false,
        description: 'Freelance Work',
      });

      entryRepositoryStub.seed([dynamicEntry]);

      // Act
      const result = await useCase.execute(validPredictData);

      // Assert
      expect(result.monthlyProjections[0].projectedIncome).toBe(0);
      expect(result.monthlyProjections[0].projectedExpenses).toBe(0);
      expect(result.monthlyProjections[0].netFlow).toBe(0);
      expect(result.summary.totalProjectedIncome).toBe(0);
      expect(result.summary.totalProjectedExpenses).toBe(0);
      expect(result.insights.trend).toBe('stable');
    });

    it('should calculate confidence based on data consistency', async () => {
      // Arrange
      const consistentEntries = [
        MockEntryFactory.create({
          id: 'consistent-income-1',
          userId: validPredictData.userId,
          type: 'INCOME',
          amount: 5000,
          isFixed: true,
        }),
        MockEntryFactory.create({
          id: 'consistent-expense-1',
          userId: validPredictData.userId,
          type: 'EXPENSE',
          amount: 2000,
          isFixed: true,
        }),
        MockEntryFactory.create({
          id: 'consistent-income-2',
          userId: validPredictData.userId,
          type: 'INCOME',
          amount: 1000,
          isFixed: true,
        }),
        MockEntryFactory.create({
          id: 'consistent-expense-2',
          userId: validPredictData.userId,
          type: 'EXPENSE',
          amount: 500,
          isFixed: true,
        }),
        MockEntryFactory.create({
          id: 'consistent-expense-3',
          userId: validPredictData.userId,
          type: 'EXPENSE',
          amount: 300,
          isFixed: true,
        }),
      ];

      entryRepositoryStub.seed(consistentEntries);

      // Act
      const result = await useCase.execute(validPredictData);

      // Assert
      expect(result.monthlyProjections[0].confidence).toBe('high');
    });

    it('should generate appropriate recommendations', async () => {
      // Arrange
      const positiveFlowEntries = [
        MockEntryFactory.create({
          id: 'positive-income-1',
          userId: validPredictData.userId,
          type: 'INCOME',
          amount: 6000,
          isFixed: true,
        }),
        MockEntryFactory.create({
          id: 'positive-expense-1',
          userId: validPredictData.userId,
          type: 'EXPENSE',
          amount: 2000,
          isFixed: true,
        }),
      ];

      entryRepositoryStub.seed(positiveFlowEntries);

      // Act
      const result = await useCase.execute(validPredictData);

      // Assert
      expect(result.insights.recommendations).toContain(
        'Your fixed income covers all fixed expenses',
      );
      expect(result.insights.recommendations).toContain(
        'Consider increasing savings rate',
      );
    });

    it('should handle repository errors', async () => {
      // Arrange
      entryRepositoryStub.mockFailure(new Error('Database connection failed'));

      // Act & Assert
      await expect(useCase.execute(validPredictData)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should log business events with all required metadata', async () => {
      // Arrange
      const entry = MockEntryFactory.create({
        id: 'log-test-entry-1',
        userId: validPredictData.userId,
        type: 'INCOME',
        amount: 5000,
        isFixed: true,
      });
      entryRepositoryStub.seed([entry]);

      // Act
      await useCase.execute(validPredictData);

      // Assert
      expect(loggerSpy.hasLoggedEvent('cash_flow_prediction_generated')).toBe(
        true,
      );
      const businessEvents = loggerSpy.getBusinessEvents(
        'cash_flow_prediction_generated',
      );
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0].metadata).toMatchObject({
        months: validPredictData.months,
        totalNetFlow: expect.any(Number),
        trend: expect.any(String),
        riskLevel: expect.any(String),
      });
    });

    it('should record metrics', async () => {
      // Arrange
      const entry = MockEntryFactory.create({
        id: 'metrics-test-entry-1',
        userId: validPredictData.userId,
        type: 'INCOME',
        amount: 5000,
        isFixed: true,
      });
      entryRepositoryStub.seed([entry]);

      // Act
      await useCase.execute(validPredictData);

      // Assert
      expect(metricsSpy.hasRecordedMetric('financial_transactions_total')).toBe(
        true,
      );
      const transactionMetrics = metricsSpy.getMetricsByFilter(
        'financial_transactions_total',
      );
      expect(transactionMetrics).toHaveLength(1);
      expect(transactionMetrics[0].labels).toMatchObject({
        type: 'cash_flow_prediction',
        status: 'success',
      });
    });

    it('should return cached forecast when available', async () => {
      // Arrange
      const mockForecast =
        MockCashFlowForecastFactory.createWithCustomMonths(6);
      cacheStub.mockCacheHit(mockForecast);

      // Act
      const result = await useCase.execute(validPredictData);

      // Assert
      expect(result).toBe(mockForecast);
      expect(loggerSpy.hasLoggedEvent('cash_flow_prediction_cache_hit')).toBe(
        true,
      );

      // Verify that metrics were recorded correctly
      const metrics = metricsSpy.getMetricsByFilter(
        'financial_transactions_total',
      );
      const cacheMetric = metrics.find(
        m =>
          m.labels.type === 'cash_flow_prediction_cached' &&
          m.labels.status === 'success',
      );
      expect(cacheMetric).toBeDefined();

      // Verify repository was not called (indirectly, by checking that our result is exactly the mock)
      expect(result).toEqual(mockForecast);
    });

    it('should cache forecast result after calculation', async () => {
      // Arrange
      const entry = MockEntryFactory.create({
        id: 'cache-test-entry-1',
        userId: validPredictData.userId,
        type: 'INCOME',
        amount: 5000,
        isFixed: true,
      });
      entryRepositoryStub.seed([entry]);

      // Act
      await useCase.execute(validPredictData);

      // Assert
      expect(loggerSpy.hasLoggedEvent('cash_flow_prediction_cached')).toBe(
        true,
      );
    });

    it('should generate recommendations for negative trend', async () => {
      // Arrange
      const negativeFlowEntries = [
        MockEntryFactory.create({
          id: 'negative-expense-1',
          userId: validPredictData.userId,
          type: 'EXPENSE',
          amount: 6000,
          isFixed: true,
        }),
        MockEntryFactory.create({
          id: 'negative-income-1',
          userId: validPredictData.userId,
          type: 'INCOME',
          amount: 2000,
          isFixed: true,
        }),
      ];

      entryRepositoryStub.seed(negativeFlowEntries);

      // Act
      const result = await useCase.execute(validPredictData);

      // Assert
      expect(result.insights.trend).toBe('negative');
      expect(result.insights.riskLevel).toBe('high');
      expect(result.insights.recommendations).toContain(
        'Consider reducing expenses or increasing income',
      );
    });

    it('should generate recommendations when no income entries', async () => {
      // Arrange
      const onlyExpenseEntries = [
        MockEntryFactory.create({
          id: 'only-expense-1',
          userId: validPredictData.userId,
          type: 'EXPENSE',
          amount: 3000,
          isFixed: true,
        }),
      ];

      entryRepositoryStub.seed(onlyExpenseEntries);

      // Act
      const result = await useCase.execute(validPredictData);

      // Assert
      expect(result.insights.recommendations).toContain(
        'Add fixed income sources for better prediction',
      );
    });

    it('should generate recommendations when no expense entries', async () => {
      // Arrange
      const onlyIncomeEntries = [
        MockEntryFactory.create({
          id: 'only-income-1',
          userId: validPredictData.userId,
          type: 'INCOME',
          amount: 3000,
          isFixed: true,
        }),
      ];

      entryRepositoryStub.seed(onlyIncomeEntries);

      // Act
      const result = await useCase.execute(validPredictData);

      // Assert
      expect(result.insights.recommendations).toContain(
        'Add fixed expenses for more accurate forecasting',
      );
    });

    it('should handle stable trend (netFlow between -100 and 100)', async () => {
      // Arrange
      const stableEntry1 = MockEntryFactory.create({
        id: 'stable-income-1',
        userId: validPredictData.userId,
        type: 'INCOME',
        amount: 1000,
        isFixed: true,
      });

      const stableEntry2 = MockEntryFactory.create({
        id: 'stable-expense-1',
        userId: validPredictData.userId,
        type: 'EXPENSE',
        amount: 950,
        isFixed: true,
      });

      entryRepositoryStub.seed([stableEntry1, stableEntry2]);

      // Act
      const result = await useCase.execute(validPredictData);

      // Assert
      expect(result.insights.trend).toBe('stable');
      expect(result.monthlyProjections[0].netFlow).toBe(50);
    });

    it('should handle exactly zero months case', async () => {
      // This is an edge case that tests the calculateSummary method with empty projections
      // We'll use a private method to force this scenario

      // Arrange
      // Create a special version of the repository that returns empty data
      entryRepositoryStub.getFixedEntriesSummary = jest.fn().mockResolvedValue({
        fixedIncome: 0,
        fixedExpenses: 0,
        fixedNetFlow: 0,
        entriesCount: 0,
      });

      entryRepositoryStub.getCurrentBalance = jest.fn().mockResolvedValue(0);

      // Force months to be 0 (even though validation would normally catch this)
      const zeroMonthsData = { ...validPredictData, months: 0 };

      // Act & Assert - should throw validation error
      await expect(useCase.execute(zeroMonthsData)).rejects.toThrow(
        'Months must be between 1 and 12',
      );
    });

    it('should handle medium risk level scenario', async () => {
      // Arrange
      const mediumRiskEntries = [
        MockEntryFactory.create({
          id: 'medium-risk-income-1',
          userId: validPredictData.userId,
          type: 'INCOME',
          amount: 3000,
          isFixed: true,
        }),
        MockEntryFactory.create({
          id: 'medium-risk-expense-1',
          userId: validPredictData.userId,
          type: 'EXPENSE',
          amount: 3000,
          isFixed: true,
        }),
      ];

      entryRepositoryStub.seed(mediumRiskEntries);
      entryRepositoryStub.getCurrentBalance = jest.fn().mockResolvedValue(2000);

      // Act
      const result = await useCase.execute(validPredictData);

      // Assert
      expect(result.insights.riskLevel).toBe('medium');
      expect(result.monthlyProjections[0].netFlow).toBe(0);
      expect(result.monthlyProjections[0].cumulativeBalance).toBeGreaterThan(0);
    });

    it('should handle high risk level scenario', async () => {
      // Arrange
      const highRiskEntries = [
        MockEntryFactory.create({
          id: 'high-risk-income-1',
          userId: validPredictData.userId,
          type: 'INCOME',
          amount: 2000,
          isFixed: true,
        }),
        MockEntryFactory.create({
          id: 'high-risk-expense-1',
          userId: validPredictData.userId,
          type: 'EXPENSE',
          amount: 3000,
          isFixed: true,
        }),
      ];

      entryRepositoryStub.seed(highRiskEntries);
      entryRepositoryStub.getCurrentBalance = jest.fn().mockResolvedValue(-500);

      // Act
      const result = await useCase.execute(validPredictData);

      // Assert
      expect(result.insights.riskLevel).toBe('high');
      expect(result.monthlyProjections[0].netFlow).toBeLessThan(0);
      expect(result.insights.recommendations).toContain(
        'Consider reducing expenses or increasing income',
      );
    });

    it('should handle the case when no cache service is provided', async () => {
      // Arrange
      const useCaseWithoutCache = new DbPredictCashFlowUseCase(
        entryRepositoryStub,
        loggerSpy,
        metricsSpy,
        // No cache service
      );

      const entry = MockEntryFactory.create({
        id: 'no-cache-entry-1',
        userId: validPredictData.userId,
        type: 'INCOME',
        amount: 5000,
        isFixed: true,
      });

      entryRepositoryStub.seed([entry]);

      // Act
      const result = await useCaseWithoutCache.execute(validPredictData);

      // Assert
      expect(result).toHaveProperty('forecastPeriod');
      expect(result).toHaveProperty('monthlyProjections');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('insights');

      // Verify no cache events were logged
      expect(loggerSpy.hasLoggedEvent('cash_flow_prediction_cache_hit')).toBe(
        false,
      );
      expect(loggerSpy.hasLoggedEvent('cash_flow_prediction_cached')).toBe(
        false,
      );
    });

    it('should handle undefined cache service', async () => {
      // Arrange
      // Create a use case with explicitly undefined cache service
      const useCaseWithUndefinedCache = new DbPredictCashFlowUseCase(
        entryRepositoryStub,
        loggerSpy,
        metricsSpy,
        undefined,
      );

      const entry = MockEntryFactory.create({
        id: 'undefined-cache-entry-1',
        userId: validPredictData.userId,
        type: 'INCOME',
        amount: 5000,
        isFixed: true,
      });

      entryRepositoryStub.seed([entry]);

      // Act
      const result = await useCaseWithUndefinedCache.execute(validPredictData);

      // Assert
      expect(result).toHaveProperty('forecastPeriod');
      // Verify no cache events were logged
      expect(loggerSpy.hasLoggedEvent('cash_flow_prediction_cache_hit')).toBe(
        false,
      );
      expect(loggerSpy.hasLoggedEvent('cash_flow_prediction_cached')).toBe(
        false,
      );
    });

    it('should calculate low confidence when no entries exist', async () => {
      // Arrange
      entryRepositoryStub.clear();
      entryRepositoryStub.getFixedEntriesSummary = jest.fn().mockResolvedValue({
        fixedIncome: 0,
        fixedExpenses: 0,
        entriesCount: 0,
      });

      // Act
      const result = await useCase.execute(validPredictData);

      // Assert
      expect(result.monthlyProjections[0].confidence).toBe('low');
    });

    it('should calculate medium confidence with few entries', async () => {
      // Arrange
      entryRepositoryStub.clear();
      entryRepositoryStub.getFixedEntriesSummary = jest.fn().mockResolvedValue({
        fixedIncome: 3000,
        fixedExpenses: 0,
        entriesCount: 3,
      });

      // Act
      const result = await useCase.execute(validPredictData);

      // Assert
      expect(result.monthlyProjections[0].confidence).toBe('medium');
    });
  });

  describe('calculateSummary', () => {
    it('should handle empty projections', () => {
      const calculateSummary = (useCase as any)['calculateSummary'].bind(
        useCase,
      );
      const result = calculateSummary([]);

      expect(result.totalProjectedIncome).toBe(0);
      expect(result.totalProjectedExpenses).toBe(0);
      expect(result.totalNetFlow).toBe(0);
      expect(result.finalBalance).toBe(0);
      expect(result.averageMonthlyFlow).toBe(0);
    });

    it('should calculate summary with projections correctly', () => {
      // Test the finalBalance ternary operator (lines 249-251)
      const calculateSummary = (useCase as any)['calculateSummary'].bind(
        useCase,
      );

      const projections = [
        {
          projectedIncome: 1000,
          projectedExpenses: 500,
          cumulativeBalance: 500,
        },
        {
          projectedIncome: 1000,
          projectedExpenses: 600,
          cumulativeBalance: 900,
        },
      ];

      const result = calculateSummary(projections);

      expect(result.totalProjectedIncome).toBe(2000);
      expect(result.totalProjectedExpenses).toBe(1100);
      expect(result.totalNetFlow).toBe(900);
      expect(result.finalBalance).toBe(900); // This tests the ternary operator
      expect(result.averageMonthlyFlow).toBe(450);
    });
  });

  describe('calculateConfidence', () => {
    it('should return medium confidence with entriesCount >= 2 and only hasIncome', () => {
      // This tests line 226: } else if (entriesCount >= 2 && (hasIncome || hasExpenses)) {
      const calculateConfidence = (useCase as any)['calculateConfidence'].bind(
        useCase,
      );

      const fixedSummary = {
        entriesCount: 3,
        fixedIncome: 5000, // Has income
        fixedExpenses: 0, // No expenses
      };

      const result = calculateConfidence(fixedSummary);
      expect(result).toBe('medium');
    });

    it('should return medium confidence with entriesCount >= 2 and only hasExpenses', () => {
      // This also tests line 226: } else if (entriesCount >= 2 && (hasIncome || hasExpenses)) {
      const calculateConfidence = (useCase as any)['calculateConfidence'].bind(
        useCase,
      );

      const fixedSummary = {
        entriesCount: 2,
        fixedIncome: 0, // No income
        fixedExpenses: 2500, // Has expenses
      };

      const result = calculateConfidence(fixedSummary);
      expect(result).toBe('medium');
    });

    it('should return medium confidence with entriesCount exactly 2 and both income and expenses', () => {
      // This tests the edge case for line 226
      const calculateConfidence = (useCase as any)['calculateConfidence'].bind(
        useCase,
      );

      const fixedSummary = {
        entriesCount: 2,
        fixedIncome: 1000,
        fixedExpenses: 500,
      };

      const result = calculateConfidence(fixedSummary);
      expect(result).toBe('medium'); // Should be medium, not high, because entriesCount < 5
    });

    it('should return low confidence when entriesCount < 2', () => {
      const calculateConfidence = (useCase as any)['calculateConfidence'].bind(
        useCase,
      );

      const fixedSummary = {
        entriesCount: 1,
        fixedIncome: 1000,
        fixedExpenses: 500,
      };

      const result = calculateConfidence(fixedSummary);
      expect(result).toBe('low');
    });
  });

  describe('determineTrend', () => {
    it('should return stable for netFlow between -100 and 100', () => {
      // This test targets line 226 which handles the stable trend case
      const determineTrend = (useCase as any)['determineTrend'].bind(useCase);
      expect(determineTrend(0)).toBe('stable');
      expect(determineTrend(50)).toBe('stable');
      expect(determineTrend(-50)).toBe('stable');
      expect(determineTrend(99)).toBe('stable');
      expect(determineTrend(-99)).toBe('stable');
    });

    it('should return positive for netFlow > 100', () => {
      const determineTrend = (useCase as any)['determineTrend'].bind(useCase);
      expect(determineTrend(101)).toBe('positive');
      expect(determineTrend(1000)).toBe('positive');
    });

    it('should return negative for netFlow < -100', () => {
      const determineTrend = (useCase as any)['determineTrend'].bind(useCase);
      expect(determineTrend(-101)).toBe('negative');
      expect(determineTrend(-1000)).toBe('negative');
    });
  });

  describe('assessRiskLevel', () => {
    it('should return medium risk when netFlow >= 0 or finalBalance > 0', () => {
      // This test targets line 249 which handles the medium risk case
      const assessRiskLevel = (useCase as any)['assessRiskLevel'].bind(useCase);

      // Case 1: netFlow = 0, finalBalance = 0
      const projections1 = [{ cumulativeBalance: 0 }];
      const fixedSummary1 = { fixedNetFlow: 0 };
      expect(assessRiskLevel(fixedSummary1, projections1)).toBe('medium');

      // Case 2: netFlow < 0, finalBalance > 0
      const projections2 = [{ cumulativeBalance: 100 }];
      const fixedSummary2 = { fixedNetFlow: -50 };
      expect(assessRiskLevel(fixedSummary2, projections2)).toBe('medium');

      // Case 3: netFlow = 0, finalBalance > 0
      const projections3 = [{ cumulativeBalance: 100 }];
      const fixedSummary3 = { fixedNetFlow: 0 };
      expect(assessRiskLevel(fixedSummary3, projections3)).toBe('medium');
    });

    it('should return high risk when projections array is empty', () => {
      // This test specifically targets lines 249-251: the ternary operator that returns 0 when projections.length is 0
      const assessRiskLevel = (useCase as any)['assessRiskLevel'].bind(useCase);

      const emptyProjections = []; // Empty array to trigger projections.length > 0 to be false
      const fixedSummary = { fixedNetFlow: -100 }; // Negative netFlow

      const result = assessRiskLevel(fixedSummary, emptyProjections);

      expect(result).toBe('high'); // Should be high risk due to negative netFlow and finalBalance = 0
    });

    it('should return high risk when netFlow < 0 and finalBalance <= 0', () => {
      const assessRiskLevel = (useCase as any)['assessRiskLevel'].bind(useCase);

      const projections = [{ cumulativeBalance: -100 }];
      const fixedSummary = { fixedNetFlow: -200 };

      const result = assessRiskLevel(fixedSummary, projections);

      expect(result).toBe('high');
    });

    it('should return low risk when netFlow > 0 and finalBalance > 5000', () => {
      const assessRiskLevel = (useCase as any)['assessRiskLevel'].bind(useCase);

      const projections = [{ cumulativeBalance: 6000 }];
      const fixedSummary = { fixedNetFlow: 1000 };

      const result = assessRiskLevel(fixedSummary, projections);

      expect(result).toBe('low');
    });
  });

  describe('generateRecommendations', () => {
    it('should recommend adding income sources when no income', () => {
      // Arrange
      const fixedSummary = {
        fixedIncome: 0,
        fixedExpenses: 2000,
        fixedNetFlow: -2000,
        entriesCount: 1,
      };

      // Act
      const generateRecommendations = (useCase as any)[
        'generateRecommendations'
      ].bind(useCase);
      const recommendations = generateRecommendations(
        fixedSummary,
        'negative',
        'high',
      );

      // Assert
      expect(recommendations).toContain(
        'Add fixed income sources for better prediction',
      );
      expect(recommendations).toContain(
        'Consider reducing expenses or increasing income',
      );
    });

    it('should recommend adding expense tracking when no expenses', () => {
      // Arrange
      const fixedSummary = {
        fixedIncome: 5000,
        fixedExpenses: 0,
        fixedNetFlow: 5000,
        entriesCount: 1,
      };

      // Act
      const generateRecommendations = (useCase as any)[
        'generateRecommendations'
      ].bind(useCase);
      const recommendations = generateRecommendations(
        fixedSummary,
        'positive',
        'low',
      );

      // Assert
      expect(recommendations).toContain(
        'Add fixed expenses for more accurate forecasting',
      );
      expect(recommendations).toContain('Consider increasing savings rate');
      expect(recommendations).toContain('Emergency fund looks stable');
    });
  });
});
