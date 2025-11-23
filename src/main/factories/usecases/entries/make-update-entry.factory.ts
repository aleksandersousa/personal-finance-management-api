import type {
  UserRepository,
  EntryRepository,
  CategoryRepository,
} from '@/data/protocols';
import { DbUpdateEntryUseCase } from '@/data/usecases';

export const makeUpdateEntryFactory = (
  entryRepository: EntryRepository,
  userRepository: UserRepository,
  categoryRepository: CategoryRepository,
) => {
  return new DbUpdateEntryUseCase(
    entryRepository,
    userRepository,
    categoryRepository,
  );
};
