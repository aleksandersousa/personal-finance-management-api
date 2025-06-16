import { TypeormEntryRepository } from '@infra/db/typeorm/repositories/typeorm-entry.repository';
import { EntryEntity } from '@infra/db/typeorm/entities/entry.entity';
import { Repository } from 'typeorm';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { FinancialMetricsService } from '@infra/metrics/financial-metrics.service';

// Factory para criar o repositório de entradas
export const makeEntryRepository = (
  repository: Repository<EntryEntity>,
  logger: ContextAwareLoggerService,
  metrics: FinancialMetricsService,
): TypeormEntryRepository => {
  return new TypeormEntryRepository(repository, logger, metrics);
};
