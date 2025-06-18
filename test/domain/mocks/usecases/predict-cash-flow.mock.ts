import {
  PredictCashFlowUseCase,
  CashFlowForecast,
} from '@domain/usecases/predict-cash-flow.usecase';

export const mockCashFlowForecast: CashFlowForecast = {
  forecastPeriod: {
    startDate: '2024-02-01',
    endDate: '2024-07-31',
    monthsCount: 6,
  },
  currentBalance: 2600.0,
  monthlyProjections: [
    {
      month: '2024-02',
      projectedIncome: 5000.0,
      projectedExpenses: 2500.0,
      netFlow: 2500.0,
      cumulativeBalance: 5100.0,
      confidence: 'high',
    },
    {
      month: '2024-03',
      projectedIncome: 5000.0,
      projectedExpenses: 2500.0,
      netFlow: 2500.0,
      cumulativeBalance: 7600.0,
      confidence: 'high',
    },
  ],
  summary: {
    totalProjectedIncome: 30000.0,
    totalProjectedExpenses: 15000.0,
    totalNetFlow: 15000.0,
    finalBalance: 17600.0,
    averageMonthlyFlow: 2500.0,
  },
  insights: {
    trend: 'positive',
    riskLevel: 'low',
    recommendations: [
      'Your fixed income covers all fixed expenses',
      'Consider increasing savings rate',
      'Emergency fund looks stable',
    ],
  },
};

export class PredictCashFlowUseCaseMockFactory {
  static createSuccess(
    result: CashFlowForecast = mockCashFlowForecast,
  ): jest.Mocked<PredictCashFlowUseCase> {
    return {
      execute: jest.fn().mockResolvedValue(result),
    };
  }

  static createFailure(error: Error): jest.Mocked<PredictCashFlowUseCase> {
    return {
      execute: jest.fn().mockRejectedValue(error),
    };
  }

  static createValidationFailure(): jest.Mocked<PredictCashFlowUseCase> {
    return {
      execute: jest
        .fn()
        .mockRejectedValue(new Error('Months must be between 1 and 12')),
    };
  }

  static createThrottleFailure(): jest.Mocked<PredictCashFlowUseCase> {
    return {
      execute: jest.fn().mockRejectedValue(new Error('Too Many Requests')),
    };
  }

  static createSpy(): jest.Mocked<PredictCashFlowUseCase> {
    return {
      execute: jest.fn(),
    };
  }
}

export class MockCashFlowForecastFactory {
  static create(overrides: Partial<CashFlowForecast> = {}): CashFlowForecast {
    return { ...mockCashFlowForecast, ...overrides };
  }

  static createWithCustomMonths(months: number): CashFlowForecast {
    const monthlyProjections = Array.from({ length: months }, (_, index) => ({
      month: `2024-${String(index + 2).padStart(2, '0')}`,
      projectedIncome: 5000.0,
      projectedExpenses: 2500.0,
      netFlow: 2500.0,
      cumulativeBalance: 2600.0 + (index + 1) * 2500.0,
      confidence: 'high' as const,
    }));

    return this.create({
      forecastPeriod: {
        startDate: '2024-02-01',
        endDate: `2024-${String(months + 1).padStart(2, '0')}-31`,
        monthsCount: months,
      },
      monthlyProjections,
      summary: {
        totalProjectedIncome: months * 5000.0,
        totalProjectedExpenses: months * 2500.0,
        totalNetFlow: months * 2500.0,
        finalBalance: 2600.0 + months * 2500.0,
        averageMonthlyFlow: 2500.0,
      },
    });
  }

  static createNegativeTrend(): CashFlowForecast {
    return this.create({
      monthlyProjections: [
        {
          month: '2024-02',
          projectedIncome: 2000.0,
          projectedExpenses: 3000.0,
          netFlow: -1000.0,
          cumulativeBalance: 1600.0,
          confidence: 'medium',
        },
      ],
      summary: {
        totalProjectedIncome: 12000.0,
        totalProjectedExpenses: 18000.0,
        totalNetFlow: -6000.0,
        finalBalance: -3400.0,
        averageMonthlyFlow: -1000.0,
      },
      insights: {
        trend: 'negative',
        riskLevel: 'high',
        recommendations: [
          'Consider reducing expenses or increasing income',
          'Emergency fund is at risk',
        ],
      },
    });
  }
}
