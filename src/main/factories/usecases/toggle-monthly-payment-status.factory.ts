import { DbToggleMonthlyPaymentStatusUseCase } from '@/data/usecases/db-toggle-monthly-payment-status.usecase';
import { EntryRepository } from '@/data/protocols/repositories/entry-repository';

export const makeToggleMonthlyPaymentStatusFactory = (
  entryRepository: EntryRepository,
): DbToggleMonthlyPaymentStatusUseCase => {
  return new DbToggleMonthlyPaymentStatusUseCase(entryRepository);
};
