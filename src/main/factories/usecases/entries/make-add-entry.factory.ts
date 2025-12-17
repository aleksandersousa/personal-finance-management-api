import type {
  UserRepository,
  EntryRepository,
  CategoryRepository,
} from '@/data/protocols';
import { DbAddEntryUseCase } from '@/data/usecases';
import type { CreateNotificationUseCase } from '@domain/usecases/create-notification.usecase';

export const makeAddEntryFactory = (
  entryRepository: EntryRepository,
  userRepository: UserRepository,
  categoryRepository: CategoryRepository,
  createNotificationUseCase?: CreateNotificationUseCase,
) => {
  return new DbAddEntryUseCase(
    entryRepository,
    userRepository,
    categoryRepository,
    createNotificationUseCase,
  );
};
