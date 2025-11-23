import { TypeormEntryRepository } from '@infra/db/typeorm/repositories/typeorm-entry.repository';
import { EntryEntity } from '@infra/db/typeorm/entities/entry.entity';
import { Repository } from 'typeorm';
import type { Logger, Metrics } from '@/data/protocols';

// Factory para criar o repositório de entradas
export const makeEntryRepository = (
  repository: Repository<EntryEntity>,
  logger: Logger,
  metrics: Metrics,
): TypeormEntryRepository => {
  return new TypeormEntryRepository(repository, logger, metrics);
};
