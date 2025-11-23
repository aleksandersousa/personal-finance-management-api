import { Test, TestingModule } from '@nestjs/testing';
import { ForecastController } from '../../../../src/presentation/controllers/forecast.controller';
import { PredictCashFlowUseCase } from '../../../../src/domain/usecases/predict-cash-flow.usecase';
import {
  PredictCashFlowUseCaseMockFactory,
  MockCashFlowForecastFactory,
  mockCashFlowForecast,
} from '../../../domain/mocks/usecases/predict-cash-flow.mock';
import { ForecastRequestMockFactory } from '../../mocks/controllers/forecast-request.mock';

describe('ForecastController', () => {
  let controller: ForecastController;
  let predictCashFlowUseCase: jest.Mocked<PredictCashFlowUseCase>;

  beforeEach(async () => {
    predictCashFlowUseCase = PredictCashFlowUseCaseMockFactory.createSuccess();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ForecastController],
      providers: [
        {
          provide: 'PredictCashFlowUseCase',
          useValue: predictCashFlowUseCase,
        },
      ],
    }).compile();

    controller = module.get<ForecastController>(ForecastController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('predictCashFlow', () => {
    describe('Default Parameters', () => {
      it('should predict cash flow with default parameters', async () => {
        // Arrange
        const mockRequest =
          ForecastRequestMockFactory.createWithDefaultParams();
        const expectedForecast =
          MockCashFlowForecastFactory.createWithCustomMonths(3);

        predictCashFlowUseCase.execute.mockResolvedValue(expectedForecast);

        // Act
        const result = await controller.predictCashFlow(
          mockRequest.user.id,
          undefined, // months
          undefined, // includeFixed
          undefined, // includeRecurring
        );

        // Assert
        expect(result).toEqual({
          forecastPeriod: expectedForecast.forecastPeriod,
          currentBalance: expectedForecast.currentBalance,
          monthlyProjections: expectedForecast.monthlyProjections,
          summary: expectedForecast.summary,
          insights: expectedForecast.insights,
        });

        expect(predictCashFlowUseCase.execute).toHaveBeenCalledWith({
          userId: mockRequest.user.id,
          months: 3, // default
          includeFixed: true, // default
          includeRecurring: false, // default
        });
      });
    });

    describe('Custom Parameters', () => {
      it('should predict cash flow with custom months parameter', async () => {
        // Arrange
        const mockRequest =
          ForecastRequestMockFactory.createWithCustomMonths('6');
        const expectedForecast =
          MockCashFlowForecastFactory.createWithCustomMonths(6);

        predictCashFlowUseCase.execute.mockResolvedValue(expectedForecast);

        // Act
        const result = await controller.predictCashFlow(
          mockRequest.user.id,
          '6',
          'true',
          'false',
        );

        // Assert
        expect(result).toEqual({
          forecastPeriod: expectedForecast.forecastPeriod,
          currentBalance: expectedForecast.currentBalance,
          monthlyProjections: expectedForecast.monthlyProjections,
          summary: expectedForecast.summary,
          insights: expectedForecast.insights,
        });

        expect(predictCashFlowUseCase.execute).toHaveBeenCalledWith({
          userId: mockRequest.user.id,
          months: 6,
          includeFixed: true,
          includeRecurring: false,
        });
      });

      it('should predict cash flow with includeFixed=false', async () => {
        // Arrange
        const mockRequest = ForecastRequestMockFactory.createWithBooleanParams(
          'false',
          'false',
        );
        const expectedForecast = mockCashFlowForecast;

        predictCashFlowUseCase.execute.mockResolvedValue(expectedForecast);

        // Act
        const result = await controller.predictCashFlow(
          mockRequest.user.id,
          '3',
          'false',
          'false',
        );

        // Assert
        expect(result).toEqual({
          forecastPeriod: expectedForecast.forecastPeriod,
          currentBalance: expectedForecast.currentBalance,
          monthlyProjections: expectedForecast.monthlyProjections,
          summary: expectedForecast.summary,
          insights: expectedForecast.insights,
        });

        expect(predictCashFlowUseCase.execute).toHaveBeenCalledWith({
          userId: mockRequest.user.id,
          months: 3,
          includeFixed: false,
          includeRecurring: false,
        });
      });

      it('should predict cash flow with includeRecurring=true', async () => {
        // Arrange
        const mockRequest = ForecastRequestMockFactory.createWithBooleanParams(
          'true',
          'true',
        );
        const expectedForecast = mockCashFlowForecast;

        predictCashFlowUseCase.execute.mockResolvedValue(expectedForecast);

        // Act
        const result = await controller.predictCashFlow(
          mockRequest.user.id,
          '12',
          'true',
          'true',
        );

        // Assert
        expect(result).toEqual({
          forecastPeriod: expectedForecast.forecastPeriod,
          currentBalance: expectedForecast.currentBalance,
          monthlyProjections: expectedForecast.monthlyProjections,
          summary: expectedForecast.summary,
          insights: expectedForecast.insights,
        });

        expect(predictCashFlowUseCase.execute).toHaveBeenCalledWith({
          userId: mockRequest.user.id,
          months: 12,
          includeFixed: true,
          includeRecurring: true,
        });
      });

      it('should handle maximum months parameter (12)', async () => {
        // Arrange
        const mockRequest =
          ForecastRequestMockFactory.createWithCustomMonths('12');
        const expectedForecast =
          MockCashFlowForecastFactory.createWithCustomMonths(12);

        predictCashFlowUseCase.execute.mockResolvedValue(expectedForecast);

        // Act
        const result = await controller.predictCashFlow(
          mockRequest.user.id,
          '12',
          'true',
          'false',
        );

        // Assert
        expect(result).toEqual({
          forecastPeriod: expectedForecast.forecastPeriod,
          currentBalance: expectedForecast.currentBalance,
          monthlyProjections: expectedForecast.monthlyProjections,
          summary: expectedForecast.summary,
          insights: expectedForecast.insights,
        });

        expect(predictCashFlowUseCase.execute).toHaveBeenCalledWith({
          userId: mockRequest.user.id,
          months: 12,
          includeFixed: true,
          includeRecurring: false,
        });
      });

      it('should handle minimum months parameter (1)', async () => {
        // Arrange
        const mockRequest =
          ForecastRequestMockFactory.createWithCustomMonths('1');
        const expectedForecast =
          MockCashFlowForecastFactory.createWithCustomMonths(1);

        predictCashFlowUseCase.execute.mockResolvedValue(expectedForecast);

        // Act
        const result = await controller.predictCashFlow(
          mockRequest.user.id,
          '1',
          'true',
          'false',
        );

        // Assert
        expect(result).toEqual({
          forecastPeriod: expectedForecast.forecastPeriod,
          currentBalance: expectedForecast.currentBalance,
          monthlyProjections: expectedForecast.monthlyProjections,
          summary: expectedForecast.summary,
          insights: expectedForecast.insights,
        });

        expect(predictCashFlowUseCase.execute).toHaveBeenCalledWith({
          userId: mockRequest.user.id,
          months: 1,
          includeFixed: true,
          includeRecurring: false,
        });
      });
    });

    describe('Parameter Parsing', () => {
      it('should parse string parameters correctly', async () => {
        // Arrange
        const expectedForecast = mockCashFlowForecast;

        predictCashFlowUseCase.execute.mockResolvedValue(expectedForecast);

        // Act
        await controller.predictCashFlow('user-123', '6', 'true', 'false');

        // Assert
        expect(predictCashFlowUseCase.execute).toHaveBeenCalledWith({
          userId: 'user-123',
          months: 6,
          includeFixed: true,
          includeRecurring: false,
        });
      });

      it('should handle non-numeric months parameter', async () => {
        // Arrange
        const expectedForecast = mockCashFlowForecast;

        predictCashFlowUseCase.execute.mockResolvedValue(expectedForecast);

        // Act
        await controller.predictCashFlow(
          'user-123',
          'invalid',
          'true',
          'false',
        );

        // Assert
        expect(predictCashFlowUseCase.execute).toHaveBeenCalledWith({
          userId: 'user-123',
          months: NaN, // parseInt('invalid') returns NaN
          includeFixed: true,
          includeRecurring: false,
        });
      });

      it('should handle boolean string parameters correctly', async () => {
        // Arrange
        const expectedForecast = mockCashFlowForecast;

        predictCashFlowUseCase.execute.mockResolvedValue(expectedForecast);

        // Act
        await controller.predictCashFlow(
          'user-123',
          '3',
          'false', // should be parsed as false
          'true', // should be parsed as true
        );

        // Assert
        expect(predictCashFlowUseCase.execute).toHaveBeenCalledWith({
          userId: 'user-123',
          months: 3,
          includeFixed: false,
          includeRecurring: true,
        });
      });
    });

    describe('Error Handling', () => {
      it('should propagate validation errors from use case', async () => {
        // Arrange
        const validationError = new Error('Months must be between 1 and 12');

        predictCashFlowUseCase.execute.mockRejectedValue(validationError);

        // Act & Assert
        await expect(
          controller.predictCashFlow(
            'user-123',
            '15', // invalid months
            'true',
            'false',
          ),
        ).rejects.toThrow('Months must be between 1 and 12');

        expect(predictCashFlowUseCase.execute).toHaveBeenCalledWith({
          userId: 'user-123',
          months: 15,
          includeFixed: true,
          includeRecurring: false,
        });
      });

      it('should propagate database errors from use case', async () => {
        // Arrange
        const dbError = new Error('Database connection failed');

        predictCashFlowUseCase.execute.mockRejectedValue(dbError);

        // Act & Assert
        await expect(
          controller.predictCashFlow('user-123', '6', 'true', 'false'),
        ).rejects.toThrow('Database connection failed');

        expect(predictCashFlowUseCase.execute).toHaveBeenCalledWith({
          userId: 'user-123',
          months: 6,
          includeFixed: true,
          includeRecurring: false,
        });
      });

      it('should propagate generic errors from use case', async () => {
        // Arrange
        const genericError = new Error('Internal server error');

        predictCashFlowUseCase.execute.mockRejectedValue(genericError);

        // Act & Assert
        await expect(
          controller.predictCashFlow('user-123', '6', 'true', 'false'),
        ).rejects.toThrow('Internal server error');

        expect(predictCashFlowUseCase.execute).toHaveBeenCalledWith({
          userId: 'user-123',
          months: 6,
          includeFixed: true,
          includeRecurring: false,
        });
      });
    });

    describe('Response Mapping', () => {
      it('should map domain forecast to response DTO correctly', async () => {
        // Arrange
        const domainForecast =
          MockCashFlowForecastFactory.createNegativeTrend();

        predictCashFlowUseCase.execute.mockResolvedValue(domainForecast);

        // Act
        const result = await controller.predictCashFlow(
          'user-123',
          '3',
          'true',
          'false',
        );

        // Assert
        expect(result).toEqual({
          forecastPeriod: domainForecast.forecastPeriod,
          currentBalance: domainForecast.currentBalance,
          monthlyProjections: domainForecast.monthlyProjections,
          summary: domainForecast.summary,
          insights: domainForecast.insights,
        });

        // Verify all properties are present
        expect(result.forecastPeriod).toBeDefined();
        expect(result.currentBalance).toBeDefined();
        expect(result.monthlyProjections).toBeDefined();
        expect(result.summary).toBeDefined();
        expect(result.insights).toBeDefined();

        // Verify structure matches expected DTO
        expect(result.forecastPeriod).toHaveProperty('startDate');
        expect(result.forecastPeriod).toHaveProperty('endDate');
        expect(result.forecastPeriod).toHaveProperty('monthsCount');

        expect(result.monthlyProjections[0]).toHaveProperty('month');
        expect(result.monthlyProjections[0]).toHaveProperty('projectedIncome');
        expect(result.monthlyProjections[0]).toHaveProperty(
          'projectedExpenses',
        );
        expect(result.monthlyProjections[0]).toHaveProperty('netFlow');
        expect(result.monthlyProjections[0]).toHaveProperty(
          'cumulativeBalance',
        );
        expect(result.monthlyProjections[0]).toHaveProperty('confidence');

        expect(result.summary).toHaveProperty('totalProjectedIncome');
        expect(result.summary).toHaveProperty('totalProjectedExpenses');
        expect(result.summary).toHaveProperty('totalNetFlow');
        expect(result.summary).toHaveProperty('finalBalance');
        expect(result.summary).toHaveProperty('averageMonthlyFlow');

        expect(result.insights).toHaveProperty('trend');
        expect(result.insights).toHaveProperty('riskLevel');
        expect(result.insights).toHaveProperty('recommendations');
      });

      it('should preserve all numeric precision in response', async () => {
        // Arrange
        const forecastWithPrecision = MockCashFlowForecastFactory.create({
          currentBalance: 1234.56,
          monthlyProjections: [
            {
              month: '2024-02',
              projectedIncome: 5000.99,
              projectedExpenses: 2500.33,
              netFlow: 2500.66,
              cumulativeBalance: 3735.22,
              confidence: 'high',
            },
          ],
          summary: {
            totalProjectedIncome: 30000.99,
            totalProjectedExpenses: 15000.33,
            totalNetFlow: 15000.66,
            finalBalance: 16235.22,
            averageMonthlyFlow: 2500.11,
          },
        });

        predictCashFlowUseCase.execute.mockResolvedValue(forecastWithPrecision);

        // Act
        const result = await controller.predictCashFlow(
          'user-123',
          '6',
          'true',
          'false',
        );

        // Assert
        expect(result.currentBalance).toBe(1234.56);
        expect(result.monthlyProjections[0].projectedIncome).toBe(5000.99);
        expect(result.monthlyProjections[0].projectedExpenses).toBe(2500.33);
        expect(result.monthlyProjections[0].netFlow).toBe(2500.66);
        expect(result.monthlyProjections[0].cumulativeBalance).toBe(3735.22);
        expect(result.summary.totalProjectedIncome).toBe(30000.99);
        expect(result.summary.totalProjectedExpenses).toBe(15000.33);
        expect(result.summary.totalNetFlow).toBe(15000.66);
        expect(result.summary.finalBalance).toBe(16235.22);
        expect(result.summary.averageMonthlyFlow).toBe(2500.11);
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty monthly projections', async () => {
        // Arrange
        const emptyForecast = MockCashFlowForecastFactory.create({
          monthlyProjections: [],
          summary: {
            totalProjectedIncome: 0,
            totalProjectedExpenses: 0,
            totalNetFlow: 0,
            finalBalance: 0,
            averageMonthlyFlow: 0,
          },
        });

        predictCashFlowUseCase.execute.mockResolvedValue(emptyForecast);

        // Act
        const result = await controller.predictCashFlow(
          'user-123',
          '0',
          'true',
          'false',
        );

        // Assert
        expect(result.monthlyProjections).toEqual([]);
        expect(result.summary.totalProjectedIncome).toBe(0);
        expect(result.summary.totalProjectedExpenses).toBe(0);
        expect(result.summary.totalNetFlow).toBe(0);
        expect(result.summary.finalBalance).toBe(0);
        expect(result.summary.averageMonthlyFlow).toBe(0);
      });

      it('should handle zero current balance', async () => {
        // Arrange
        const zeroBalanceForecast = MockCashFlowForecastFactory.create({
          currentBalance: 0,
        });

        predictCashFlowUseCase.execute.mockResolvedValue(zeroBalanceForecast);

        // Act
        const result = await controller.predictCashFlow(
          'user-123',
          '3',
          'true',
          'false',
        );

        // Assert
        expect(result.currentBalance).toBe(0);
      });

      it('should handle negative balances', async () => {
        // Arrange
        const negativeForecast = MockCashFlowForecastFactory.create({
          currentBalance: -1000.0,
          monthlyProjections: [
            {
              month: '2024-02',
              projectedIncome: 1000.0,
              projectedExpenses: 2000.0,
              netFlow: -1000.0,
              cumulativeBalance: -2000.0,
              confidence: 'low',
            },
          ],
          summary: {
            totalProjectedIncome: 6000.0,
            totalProjectedExpenses: 12000.0,
            totalNetFlow: -6000.0,
            finalBalance: -7000.0,
            averageMonthlyFlow: -1000.0,
          },
        });

        predictCashFlowUseCase.execute.mockResolvedValue(negativeForecast);

        // Act
        const result = await controller.predictCashFlow(
          'user-123',
          '6',
          'true',
          'false',
        );

        // Assert
        expect(result.currentBalance).toBe(-1000.0);
        expect(result.monthlyProjections[0].netFlow).toBe(-1000.0);
        expect(result.monthlyProjections[0].cumulativeBalance).toBe(-2000.0);
        expect(result.summary.totalNetFlow).toBe(-6000.0);
        expect(result.summary.finalBalance).toBe(-7000.0);
        expect(result.summary.averageMonthlyFlow).toBe(-1000.0);
      });
    });
  });
});
