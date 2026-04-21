import { TypeormEntryRepository } from '@infra/db/typeorm/repositories/typeorm-entry.repository';
import { EntryEntity } from '@infra/db/typeorm/entities/entry.entity';
import { PaymentEntity } from '@infra/db/typeorm/entities/payment.entity';
import { RecurrenceEntity } from '@infra/db/typeorm/entities/recurrence.entity';
import { Repository } from 'typeorm';
import type { Logger, Metrics } from '@/data/protocols';

// Factory para criar o repositório de entradas
export const makeEntryRepository = (
  entryRepository: Repository<EntryEntity>,
  paymentRepository: Repository<PaymentEntity>,
  recurrenceRepository: Repository<RecurrenceEntity>,
  logger: Logger,
  metrics: Metrics,
): TypeormEntryRepository => {
  return new TypeormEntryRepository(
    entryRepository,
    paymentRepository,
    recurrenceRepository,
    logger,
    metrics,
  );
};
