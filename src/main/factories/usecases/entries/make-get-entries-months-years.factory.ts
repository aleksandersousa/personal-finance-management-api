import type { UserRepository, EntryRepository } from '@/data/protocols';
import { DbGetEntriesMonthsYearsUseCase } from '@/data/usecases';
import type { ContextAwareLoggerService } from '@/infra/logging/context-aware-logger.service';

export const makeGetEntriesMonthsYearsFactory = (
  entryRepository: EntryRepository,
  userRepository: UserRepository,
  logger: ContextAwareLoggerService,
) => {
  return new DbGetEntriesMonthsYearsUseCase(
    entryRepository,
    userRepository,
    logger,
  );
};
