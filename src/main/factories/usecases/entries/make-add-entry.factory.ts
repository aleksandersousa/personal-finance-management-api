import type {
  UserRepository,
  EntryRepository,
  IdGenerator,
  CategoryRepository,
} from '@/data/protocols';
import { DbAddEntryUseCase } from '@/data/usecases';

export const makeAddEntryFactory = (
  entryRepository: EntryRepository,
  userRepository: UserRepository,
  categoryRepository: CategoryRepository,
  idGenerator: IdGenerator,
) => {
  return new DbAddEntryUseCase(
    entryRepository,
    userRepository,
    categoryRepository,
    idGenerator,
  );
};
