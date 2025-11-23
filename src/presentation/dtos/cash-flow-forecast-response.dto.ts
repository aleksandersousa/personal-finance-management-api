import { ApiProperty } from '@nestjs/swagger';

export class ForecastPeriod {
  @ApiProperty({
    description: 'Start date of forecast period',
    example: '2024-02-01',
  })
  startDate: string;

  @ApiProperty({
    description: 'End date of forecast period',
    example: '2024-07-31',
  })
  endDate: string;

  @ApiProperty({
    description: 'Number of months in forecast',
    example: 6,
  })
  monthsCount: number;
}

export class MonthlyProjection {
  @ApiProperty({
    description: 'Month in YYYY-MM format',
    example: '2024-02',
  })
  month: string;

  @ApiProperty({
    description: 'Projected income for the month',
    example: 5000.0,
  })
  projectedIncome: number;

  @ApiProperty({
    description: 'Projected expenses for the month',
    example: 2500.0,
  })
  projectedExpenses: number;

  @ApiProperty({
    description: 'Net flow (income - expenses)',
    example: 2500.0,
  })
  netFlow: number;

  @ApiProperty({
    description: 'Cumulative balance at end of month',
    example: 5100.0,
  })
  cumulativeBalance: number;

  @ApiProperty({
    description: 'Confidence level of projection',
    enum: ['high', 'medium', 'low'],
    example: 'high',
  })
  confidence: 'high' | 'medium' | 'low';
}

export class ForecastSummary {
  @ApiProperty({
    description: 'Total projected income across all months',
    example: 30000.0,
  })
  totalProjectedIncome: number;

  @ApiProperty({
    description: 'Total projected expenses across all months',
    example: 15000.0,
  })
  totalProjectedExpenses: number;

  @ApiProperty({
    description: 'Total net flow across all months',
    example: 15000.0,
  })
  totalNetFlow: number;

  @ApiProperty({
    description: 'Final balance at end of forecast period',
    example: 17600.0,
  })
  finalBalance: number;

  @ApiProperty({
    description: 'Average monthly net flow',
    example: 2500.0,
  })
  averageMonthlyFlow: number;
}

export class ForecastInsights {
  @ApiProperty({
    description: 'Overall trend of cash flow',
    enum: ['positive', 'negative', 'stable'],
    example: 'positive',
  })
  trend: 'positive' | 'negative' | 'stable';

  @ApiProperty({
    description: 'Risk level assessment',
    enum: ['low', 'medium', 'high'],
    example: 'low',
  })
  riskLevel: 'low' | 'medium' | 'high';

  @ApiProperty({
    description: 'AI-generated financial recommendations',
    type: [String],
    example: [
      'Sua renda fixa cobre todas as despesas fixas',
      'Considere aumentar a taxa de poupança',
      'Fundo de emergência parece estável',
    ],
  })
  recommendations: string[];
}

export class CashFlowForecastResponseDto {
  @ApiProperty({
    description: 'Forecast period information',
    type: ForecastPeriod,
  })
  forecastPeriod: ForecastPeriod;

  @ApiProperty({
    description: 'Current account balance',
    example: 2600.0,
  })
  currentBalance: number;

  @ApiProperty({
    description: 'Monthly projections array',
    type: [MonthlyProjection],
  })
  monthlyProjections: MonthlyProjection[];

  @ApiProperty({
    description: 'Summary of entire forecast period',
    type: ForecastSummary,
  })
  summary: ForecastSummary;

  @ApiProperty({
    description: 'AI insights and recommendations',
    type: ForecastInsights,
  })
  insights: ForecastInsights;
}
