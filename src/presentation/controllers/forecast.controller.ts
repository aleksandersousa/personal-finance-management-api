import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@presentation/guards';
import { User } from '@presentation/decorators';
import { PredictCashFlowUseCase } from '@domain/usecases/predict-cash-flow.usecase';
import { CashFlowForecastResponseDto } from '@presentation/dtos';

@ApiTags('forecast')
@Controller('forecast')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ForecastController {
  constructor(
    @Inject('PredictCashFlowUseCase')
    private readonly predictCashFlowUseCase: PredictCashFlowUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute for forecast
  @ApiOperation({
    summary: 'Predict cash flow forecast',
    description:
      'Generate cash flow predictions based on fixed entries for future months. Rate limited to 5 requests per minute.',
  })
  @ApiQuery({
    name: 'months',
    required: false,
    type: Number,
    description: 'Number of months to forecast (1-12)',
    example: 6,
  })
  @ApiQuery({
    name: 'includeFixed',
    required: false,
    type: Boolean,
    description: 'Include fixed entries in prediction',
    example: true,
  })
  @ApiQuery({
    name: 'includeRecurring',
    required: false,
    type: Boolean,
    description:
      'Include recurring entries in prediction (not implemented in MVP)',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Cash flow forecast generated successfully',
    type: CashFlowForecastResponseDto,
    schema: {
      example: {
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
            'Sua renda fixa cobre todas as despesas fixas',
            'Considere aumentar a taxa de poupança',
            'Fundo de emergência parece estável',
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid parameters provided',
    schema: {
      example: {
        statusCode: 400,
        message: 'Months must be between 1 and 12',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests - Rate limit exceeded',
    schema: {
      example: {
        statusCode: 429,
        message: 'ThrottlerException: Too Many Requests',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
      },
    },
  })
  async predictCashFlow(
    @User('id') userId: string,
    @Query('months') months?: string,
    @Query('includeFixed') includeFixed?: string,
    @Query('includeRecurring') includeRecurring?: string,
  ): Promise<CashFlowForecastResponseDto> {
    const monthsNumber = months ? parseInt(months, 10) : 3;
    const includeFixedBool = includeFixed !== 'false';
    const includeRecurringBool = includeRecurring === 'true';

    const forecast = await this.predictCashFlowUseCase.execute({
      userId,
      months: monthsNumber,
      includeFixed: includeFixedBool,
      includeRecurring: includeRecurringBool,
    });

    return {
      forecastPeriod: forecast.forecastPeriod,
      currentBalance: forecast.currentBalance,
      monthlyProjections: forecast.monthlyProjections,
      summary: forecast.summary,
      insights: forecast.insights,
    };
  }
}
