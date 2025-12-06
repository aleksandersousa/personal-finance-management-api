import type { EntryRepository } from '@/data/protocols';
import { DbDeleteEntryUseCase } from '@/data/usecases';
import type { CancelNotificationUseCase } from '@domain/usecases/cancel-notification.usecase';

export const makeDeleteEntryFactory = (
  entryRepository: EntryRepository,
  cancelNotificationUseCase?: CancelNotificationUseCase,
) => {
  return new DbDeleteEntryUseCase(entryRepository, cancelNotificationUseCase);
};
