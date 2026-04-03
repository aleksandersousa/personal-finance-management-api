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
      'Sua renda fixa cobre todas as despesas fixas',
      'Considere aumentar a taxa de poupança',
      'Fundo de emergência parece estável',
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
    return this.create({
      forecastPeriod: {
        startDate: '2024-02-01',
        endDate: `2024-${String(months + 1).padStart(2, '0')}-31`,
        monthsCount: months,
      },
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
          'Considere reduzir despesas ou aumentar a renda',
          'Fundo de emergência está em risco',
        ],
      },
    });
  }
}
