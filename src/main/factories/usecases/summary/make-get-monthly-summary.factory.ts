import { DbGetMonthlySummaryUseCase } from '@data/usecases/db-get-monthly-summary.usecase';
import { TypeormEntryRepository } from '@infra/db/typeorm/repositories/typeorm-entry.repository';
import { TypeormUserRepository } from '@infra/db/typeorm/repositories/typeorm-user.repository';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { FinancialMetricsService } from '@infra/metrics/financial-metrics.service';

export const makeGetMonthlySummaryFactory = (
  entryRepository: TypeormEntryRepository,
  userRepository: TypeormUserRepository,
  logger: ContextAwareLoggerService,
  metrics: FinancialMetricsService,
): DbGetMonthlySummaryUseCase => {
  return new DbGetMonthlySummaryUseCase(
    entryRepository,
    userRepository,
    logger,
    metrics,
  );
};
