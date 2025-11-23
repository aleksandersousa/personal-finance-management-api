import type { UserRepository, EntryRepository } from '@/data/protocols';
import { DbListEntriesByMonthUseCase } from '@/data/usecases';

export const makeListEntriesByMonthFactory = (
  entryRepository: EntryRepository,
  userRepository: UserRepository,
) => {
  return new DbListEntriesByMonthUseCase(entryRepository, userRepository);
};
