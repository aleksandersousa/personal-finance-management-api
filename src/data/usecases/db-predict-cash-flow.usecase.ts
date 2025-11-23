import { Injectable } from '@nestjs/common';
import {
  PredictCashFlowUseCase,
  PredictCashFlowData,
  CashFlowForecast,
  MonthlyProjection,
  ForecastPeriod,
  ForecastSummary,
  ForecastInsights,
} from '@domain/usecases/predict-cash-flow.usecase';
import { EntryRepository } from '@data/protocols/entry-repository';
import { Logger } from '@data/protocols/logger';
import { Metrics } from '@data/protocols/metrics';
import { ForecastCache } from '@data/protocols/cache';

@Injectable()
export class DbPredictCashFlowUseCase implements PredictCashFlowUseCase {
  constructor(
    private readonly entryRepository: EntryRepository,
    private readonly logger: Logger,
    private readonly metrics: Metrics,
    private readonly cacheService?: ForecastCache,
  ) {}

  async execute(data: PredictCashFlowData): Promise<CashFlowForecast> {
    try {
      // 1. Validate input
      this.validateInput(data);

      // Check cache first
      if (this.cacheService) {
        const cacheKey = this.cacheService.generateCacheKey(data);
        const cachedResult = this.cacheService.get(cacheKey);

        if (cachedResult) {
          this.logger.logBusinessEvent({
            event: 'cash_flow_prediction_cache_hit',
            userId: data.userId,
            metadata: { months: data.months },
          });

          this.metrics.recordTransaction(
            'cash_flow_prediction_cached',
            'success',
          );
          return cachedResult;
        }
      }

      // 2. Get fixed entries summary and current balance
      const [fixedSummary, currentBalance] = await Promise.all([
        this.entryRepository.getFixedEntriesSummary(data.userId),
        this.entryRepository.getCurrentBalance(data.userId),
      ]);

      // 3. Generate forecast period
      const forecastPeriod = this.generateForecastPeriod(data.months);

      // 4. Generate monthly projections
      const monthlyProjections = this.generateMonthlyProjections(
        fixedSummary,
        data.months,
        currentBalance,
      );

      // 5. Calculate summary
      const summary = this.calculateSummary(monthlyProjections);

      // 6. Generate insights
      const insights = this.generateInsights(fixedSummary, monthlyProjections);

      const forecast: CashFlowForecast = {
        forecastPeriod,
        currentBalance,
        monthlyProjections,
        summary,
        insights,
      };

      // Cache the result
      if (this.cacheService) {
        const cacheKey = this.cacheService.generateCacheKey(data);
        this.cacheService.set(cacheKey, forecast);

        this.logger.logBusinessEvent({
          event: 'cash_flow_prediction_cached',
          userId: data.userId,
          metadata: { months: data.months },
        });
      }

      // 7. Log business event
      this.logger.logBusinessEvent({
        event: 'cash_flow_prediction_generated',
        userId: data.userId,
        metadata: {
          months: data.months,
          totalNetFlow: summary.totalNetFlow,
          trend: insights.trend,
          riskLevel: insights.riskLevel,
        },
      });

      // 8. Record metrics
      this.metrics.recordTransaction('cash_flow_prediction', 'success');

      return forecast;
    } catch (error) {
      this.metrics.recordTransaction('cash_flow_prediction', 'error');
      this.logger.error('Failed to predict cash flow', error.stack);
      throw error;
    }
  }

  private validateInput(data: PredictCashFlowData): void {
    if (data.months < 1 || data.months > 12) {
      throw new Error('Months must be between 1 and 12');
    }
  }

  private generateForecastPeriod(months: number): ForecastPeriod {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() + 1); // Next month
    startDate.setDate(1); // First day of next month

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months - 1);
    endDate.setDate(this.getLastDayOfMonth(endDate)); // Last day of end month

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      monthsCount: months,
    };
  }

  private generateMonthlyProjections(
    fixedSummary: any,
    months: number,
    currentBalance: number,
  ): MonthlyProjection[] {
    const projections: MonthlyProjection[] = [];
    let cumulativeBalance = currentBalance;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() + 1); // Next month
    startDate.setDate(1); // First day of month

    for (let i = 0; i < months; i++) {
      const projectionDate = new Date(startDate);
      projectionDate.setMonth(projectionDate.getMonth() + i);

      const projectedIncome = fixedSummary.fixedIncome || 0;
      const projectedExpenses = fixedSummary.fixedExpenses || 0;
      const netFlow = projectedIncome - projectedExpenses;
      cumulativeBalance += netFlow;

      const confidence = this.calculateConfidence(fixedSummary);

      projections.push({
        month: this.formatMonth(projectionDate),
        projectedIncome,
        projectedExpenses,
        netFlow,
        cumulativeBalance: Math.round(cumulativeBalance * 100) / 100,
        confidence,
      });
    }

    return projections;
  }

  private calculateSummary(projections: MonthlyProjection[]): ForecastSummary {
    const totalProjectedIncome = projections.reduce(
      (sum, p) => sum + p.projectedIncome,
      0,
    );
    const totalProjectedExpenses = projections.reduce(
      (sum, p) => sum + p.projectedExpenses,
      0,
    );
    const totalNetFlow = totalProjectedIncome - totalProjectedExpenses;
    const finalBalance =
      projections.length > 0
        ? projections[projections.length - 1].cumulativeBalance
        : 0;
    const averageMonthlyFlow =
      projections.length > 0 ? totalNetFlow / projections.length : 0;

    return {
      totalProjectedIncome: Math.round(totalProjectedIncome * 100) / 100,
      totalProjectedExpenses: Math.round(totalProjectedExpenses * 100) / 100,
      totalNetFlow: Math.round(totalNetFlow * 100) / 100,
      finalBalance: Math.round(finalBalance * 100) / 100,
      averageMonthlyFlow: Math.round(averageMonthlyFlow * 100) / 100,
    };
  }

  private generateInsights(
    fixedSummary: any,
    projections: MonthlyProjection[],
  ): ForecastInsights {
    const netFlow = fixedSummary.fixedNetFlow || 0;
    const trend = this.determineTrend(netFlow);
    const riskLevel = this.assessRiskLevel(fixedSummary, projections);
    const recommendations = this.generateRecommendations(
      fixedSummary,
      trend,
      riskLevel,
    );

    return {
      trend,
      riskLevel,
      recommendations,
    };
  }

  private calculateConfidence(fixedSummary: any): 'high' | 'medium' | 'low' {
    const entriesCount = fixedSummary.entriesCount || 0;
    const hasIncome = (fixedSummary.fixedIncome || 0) > 0;
    const hasExpenses = (fixedSummary.fixedExpenses || 0) > 0;

    if (entriesCount >= 5 && hasIncome && hasExpenses) {
      return 'high';
    } else if (entriesCount >= 2 && (hasIncome || hasExpenses)) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private determineTrend(netFlow: number): 'positive' | 'negative' | 'stable' {
    if (netFlow > 100) {
      return 'positive';
    } else if (netFlow < -100) {
      return 'negative';
    } else {
      return 'stable';
    }
  }

  private assessRiskLevel(
    fixedSummary: any,
    projections: MonthlyProjection[],
  ): 'low' | 'medium' | 'high' {
    const netFlow = fixedSummary.fixedNetFlow || 0;
    const finalBalance =
      projections.length > 0
        ? projections[projections.length - 1].cumulativeBalance
        : 0;

    if (netFlow > 0 && finalBalance > 5000) {
      return 'low';
    } else if (netFlow >= 0 || finalBalance > 0) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  private generateRecommendations(
    fixedSummary: any,
    trend: string,
    riskLevel: string,
  ): string[] {
    const recommendations: string[] = [];
    const netFlow = fixedSummary.fixedNetFlow || 0;
    const hasIncome = (fixedSummary.fixedIncome || 0) > 0;
    const hasExpenses = (fixedSummary.fixedExpenses || 0) > 0;

    if (hasIncome && hasExpenses && netFlow > 0) {
      recommendations.push('Sua renda fixa cobre todas as despesas fixas');
    }

    if (trend === 'positive') {
      recommendations.push('Considere aumentar a taxa de poupança');
    }

    if (riskLevel === 'low') {
      recommendations.push('Fundo de emergência parece estável');
    } else if (riskLevel === 'high') {
      recommendations.push('Considere reduzir despesas ou aumentar a renda');
    }

    if (!hasIncome) {
      recommendations.push(
        'Adicione fontes de renda fixa para melhor previsão',
      );
    }

    if (!hasExpenses) {
      recommendations.push(
        'Adicione despesas fixas para previsão mais precisa',
      );
    }

    return recommendations;
  }

  private formatMonth(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private getLastDayOfMonth(date: Date): number {
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return nextMonth.getDate();
  }
}
