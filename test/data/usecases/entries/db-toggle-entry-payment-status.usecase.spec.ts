import { DbToggleEntryPaymentStatusUseCase } from '@data/usecases/db-toggle-entry-payment-status.usecase';
import { EntryRepository } from '@data/protocols/repositories/entry-repository';
import { UserRepository } from '@data/protocols/repositories/user-repository';

describe('DbToggleEntryPaymentStatusUseCase', () => {
  let sut: DbToggleEntryPaymentStatusUseCase;
  let entryRepository: jest.Mocked<EntryRepository>;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    entryRepository = {
      findRecurrenceIdByType: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByUserIdAndMonth: jest.fn(),
      findByUserIdAndMonthWithFilters: jest.fn(),
      findMonthlyRecurringEntriesInRange: jest.fn(),
      existsMonthlyMirroredEntry: jest.fn(),
      getMonthlySummaryStats: jest.fn(),
      getCategorySummaryForMonth: jest.fn(),
      getFixedEntriesSummary: jest.fn(),
      getCurrentBalance: jest.fn(),
      getDistinctMonthsYears: jest.fn(),
      getAccumulatedStats: jest.fn(),
      update: jest.fn(),
      togglePaymentStatus: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
    };

    userRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
    };

    sut = new DbToggleEntryPaymentStatusUseCase(entryRepository, userRepository);
  });

  it('throws when userId is missing', async () => {
    await expect(
      sut.execute({ userId: '', entryId: 'entry-1', isPaid: true }),
    ).rejects.toThrow('User ID is required');
  });

  it('throws when entryId is missing', async () => {
    await expect(
      sut.execute({ userId: 'user-1', entryId: '', isPaid: true }),
    ).rejects.toThrow('Entry ID is required');
  });

  it('throws when user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      sut.execute({ userId: 'user-1', entryId: 'entry-1', isPaid: true }),
    ).rejects.toThrow('User not found');
  });

  it('toggles status through repository when request is valid', async () => {
    userRepository.findById.mockResolvedValue({ id: 'user-1' } as any);
    entryRepository.togglePaymentStatus.mockResolvedValue({
      entryId: 'entry-1',
      isPaid: true,
      paidAt: new Date('2026-01-10T00:00:00.000Z'),
    });

    const result = await sut.execute({
      userId: 'user-1',
      entryId: 'entry-1',
      isPaid: true,
    });

    expect(userRepository.findById).toHaveBeenCalledWith('user-1');
    expect(entryRepository.togglePaymentStatus).toHaveBeenCalledWith(
      'user-1',
      'entry-1',
      true,
    );
    expect(result.isPaid).toBe(true);
  });
});
