import type {
  UserRepository,
  EntryRepository,
  CategoryRepository,
} from '@/data/protocols';
import { DbUpdateEntryUseCase } from '@/data/usecases';
import type { CreateNotificationUseCase } from '@domain/usecases/create-notification.usecase';
import type { CancelNotificationUseCase } from '@domain/usecases/cancel-notification.usecase';

export const makeUpdateEntryFactory = (
  entryRepository: EntryRepository,
  userRepository: UserRepository,
  categoryRepository: CategoryRepository,
  createNotificationUseCase?: CreateNotificationUseCase,
  cancelNotificationUseCase?: CancelNotificationUseCase,
) => {
  return new DbUpdateEntryUseCase(
    entryRepository,
    userRepository,
    categoryRepository,
    createNotificationUseCase,
    cancelNotificationUseCase,
  );
};
