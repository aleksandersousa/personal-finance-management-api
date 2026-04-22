import type { UserRepository, EntryRepository } from '@/data/protocols';
import { DbToggleEntryPaymentStatusUseCase } from '@/data/usecases';

export const makeToggleEntryPaymentStatusFactory = (
  entryRepository: EntryRepository,
  userRepository: UserRepository,
) => {
  return new DbToggleEntryPaymentStatusUseCase(entryRepository, userRepository);
};
