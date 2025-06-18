export interface PredictCashFlowUseCase {
  execute(data: PredictCashFlowData): Promise<CashFlowForecast>;
}

export interface PredictCashFlowData {
  userId: string;
  months: number;
  includeFixed: boolean;
  includeRecurring: boolean;
}

export interface CashFlowForecast {
  forecastPeriod: ForecastPeriod;
  currentBalance: number;
  monthlyProjections: MonthlyProjection[];
  summary: ForecastSummary;
  insights: ForecastInsights;
}

export interface ForecastPeriod {
  startDate: string;
  endDate: string;
  monthsCount: number;
}

export interface MonthlyProjection {
  month: string;
  projectedIncome: number;
  projectedExpenses: number;
  netFlow: number;
  cumulativeBalance: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface ForecastSummary {
  totalProjectedIncome: number;
  totalProjectedExpenses: number;
  totalNetFlow: number;
  finalBalance: number;
  averageMonthlyFlow: number;
}

export interface ForecastInsights {
  trend: 'positive' | 'negative' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}
