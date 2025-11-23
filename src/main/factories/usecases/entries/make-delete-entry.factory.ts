import type { EntryRepository } from '@/data/protocols';
import { DbDeleteEntryUseCase } from '@/data/usecases';

export const makeDeleteEntryFactory = (entryRepository: EntryRepository) => {
  return new DbDeleteEntryUseCase(entryRepository);
};
