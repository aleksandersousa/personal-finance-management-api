import { TypeormEntryRepository } from '@infra/db/typeorm/repositories/typeorm-entry.repository';
import { EntryEntity } from '@infra/db/typeorm/entities/entry.entity';
import { Repository } from 'typeorm';

// Factory para criar o repositório de entradas
export const makeEntryRepository = (
  repository: Repository<EntryEntity>,
): TypeormEntryRepository => {
  return new TypeormEntryRepository(repository);
};
