import { seedRecurrences } from '@infra/db/typeorm/seeds/seed-recurrences';

jest.mock('@infra/db/typeorm/config/data-source', () => ({
  AppDataSource: {
    query: jest.fn(),
  },
}));

describe('seedRecurrences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inserts monthly recurrence with conflict handling', async () => {
    const { AppDataSource } = jest.requireMock(
      '@infra/db/typeorm/config/data-source',
    );
    AppDataSource.query.mockResolvedValue(undefined);

    await seedRecurrences();

    expect(AppDataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT ("type") DO NOTHING'),
      ['MONTHLY'],
    );
  });
});
