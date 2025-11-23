import { DbPredictCashFlowUseCase } from '@data/usecases';
import { TypeormEntryRepository } from '@infra/db/typeorm/repositories/typeorm-entry.repository';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { FinancialMetricsService } from '@infra/metrics/financial-metrics.service';
import { ForecastCacheService } from '@infra/cache/forecast-cache.service';

export const makePredictCashFlowFactory = (
  entryRepository: TypeormEntryRepository,
  logger: ContextAwareLoggerService,
  metrics: FinancialMetricsService,
  cacheService: ForecastCacheService,
): DbPredictCashFlowUseCase => {
  return new DbPredictCashFlowUseCase(
    entryRepository,
    logger,
    metrics,
    cacheService,
  );
};
