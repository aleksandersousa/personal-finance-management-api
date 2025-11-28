import {
  GetMonthlySummaryRequest,
  GetMonthlySummaryResponse,
  GetMonthlySummaryUseCase,
} from '@domain/usecases/get-monthly-summary.usecase';
import {
  EntryRepository,
  MonthlySummaryStats,
} from '../protocols/entry-repository';
import { UserRepository } from '../protocols/user-repository';
import { Logger } from '../protocols/logger';
import { Metrics } from '../protocols/metrics';

export class DbGetMonthlySummaryUseCase implements GetMonthlySummaryUseCase {
  constructor(
    private readonly entryRepository: EntryRepository,
    private readonly userRepository: UserRepository,
    private readonly logger: Logger,
    private readonly metrics: Metrics,
  ) {}

  async execute(
    request: GetMonthlySummaryRequest,
  ): Promise<GetMonthlySummaryResponse> {
    const startTime = Date.now();

    try {
      // Validate input
      this.validateRequest(request);

      // Verify user exists
      const user = await this.userRepository.findById(request.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get current month summary stats
      const currentStats = await this.entryRepository.getMonthlySummaryStats(
        request.userId,
        request.year,
        request.month,
      );

      // Get previous month summary stats for comparison
      const previousDate = this.getPreviousMonth(request.year, request.month);
      const previousStats = await this.entryRepository.getMonthlySummaryStats(
        request.userId,
        previousDate.year,
        previousDate.month,
      );

      // Build response
      const response: GetMonthlySummaryResponse = {
        month: `${request.year}-${String(request.month).padStart(2, '0')}`,
        summary: {
          totalIncome: currentStats.totalIncome,
          totalExpenses: currentStats.totalExpenses,
          balance: currentStats.totalIncome - currentStats.totalExpenses,
          fixedIncome: currentStats.fixedIncome,
          dynamicIncome: currentStats.dynamicIncome,
          fixedExpenses: currentStats.fixedExpenses,
          dynamicExpenses: currentStats.dynamicExpenses,
          entriesCount: {
            total: currentStats.totalEntries,
            income: currentStats.incomeEntries,
            expenses: currentStats.expenseEntries,
          },
        },
        comparisonWithPrevious: this.calculateComparison(
          currentStats,
          previousStats,
        ),
      };

      // Add category breakdown if requested
      if (request.includeCategories) {
        const categorySummary =
          await this.entryRepository.getCategorySummaryForMonth(
            request.userId,
            request.year,
            request.month,
          );
        response.categoryBreakdown = {
          items: categorySummary.items,
          incomeTotal: categorySummary.incomeTotal,
          expenseTotal: categorySummary.expenseTotal,
        };
      }

      const duration = Date.now() - startTime;

      // Log business event
      this.logger.logBusinessEvent({
        event: 'monthly_summary_generated',
        userId: request.userId,
        metadata: {
          month: response.month,
          totalIncome: response.summary.totalIncome,
          totalExpenses: response.summary.totalExpenses,
          balance: response.summary.balance,
          includeCategories: request.includeCategories || false,
          duration,
        },
      });

      // Record metrics
      this.metrics.recordTransaction('get_monthly_summary', 'success');

      return response;
    } catch (error) {
      this.logger.error('Failed to generate monthly summary', error.stack);

      // Record error metrics
      this.metrics.recordApiError('get_monthly_summary', error.message);

      throw error;
    }
  }

  private validateRequest(request: GetMonthlySummaryRequest): void {
    if (!request.userId) {
      throw new Error('User ID is required');
    }

    if (!request.year || request.year < 1900 || request.year > 2100) {
      throw new Error('Invalid year');
    }

    if (!request.month || request.month < 1 || request.month > 12) {
      throw new Error('Invalid month');
    }
  }

  private getPreviousMonth(
    year: number,
    month: number,
  ): { year: number; month: number } {
    if (month === 1) {
      return { year: year - 1, month: 12 };
    }
    return { year, month: month - 1 };
  }

  private calculateComparison(
    current: MonthlySummaryStats,
    previous: MonthlySummaryStats,
  ) {
    const incomeChange = current.totalIncome - previous.totalIncome;
    const expenseChange = current.totalExpenses - previous.totalExpenses;
    const currentBalance = current.totalIncome - current.totalExpenses;
    const previousBalance = previous.totalIncome - previous.totalExpenses;
    const balanceChange = currentBalance - previousBalance;

    return {
      incomeChange,
      expenseChange,
      balanceChange,
      percentageChanges: {
        income:
          previous.totalIncome === 0
            ? 0
            : parseFloat(
                ((incomeChange / previous.totalIncome) * 100).toFixed(2),
              ),
        expense:
          previous.totalExpenses === 0
            ? 0
            : parseFloat(
                ((expenseChange / previous.totalExpenses) * 100).toFixed(2),
              ),
        balance:
          previousBalance === 0
            ? 0
            : parseFloat(
                ((balanceChange / Math.abs(previousBalance)) * 100).toFixed(2),
              ),
      },
    };
  }
}
