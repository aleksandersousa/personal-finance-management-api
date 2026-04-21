import { Repository } from 'typeorm';
import { TypeormEntryRepository } from '@infra/db/typeorm/repositories/typeorm-entry.repository';
import { EntryEntity } from '@infra/db/typeorm/entities/entry.entity';
import { PaymentEntity } from '@infra/db/typeorm/entities/payment.entity';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { FinancialMetricsService } from '@infra/metrics/financial-metrics.service';
import { RecurrenceEntity } from '@infra/db/typeorm/entities/recurrence.entity';

describe('TypeormEntryRepository', () => {
  let repository: TypeormEntryRepository;
  let mockRepository: jest.Mocked<Repository<EntryEntity>>;
  let mockPaymentRepository: jest.Mocked<Repository<PaymentEntity>>;
  let mockRecurrenceRepository: jest.Mocked<Repository<RecurrenceEntity>>;
  let mockLogger: jest.Mocked<ContextAwareLoggerService>;
  let mockMetrics: jest.Mocked<FinancialMetricsService>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
      count: jest.fn(),
    } as any;

    mockPaymentRepository = {
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockRecurrenceRepository = {
      findOne: jest.fn(),
    } as any;

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      logBusinessEvent: jest.fn(),
    } as any;

    mockMetrics = {
      recordHttpRequest: jest.fn(),
      recordAuthEvent: jest.fn(),
      recordTransaction: jest.fn(),
      recordApiError: jest.fn(),
      recordDbQuery: jest.fn(),
      updateActiveUsers: jest.fn(),
      getMetrics: jest.fn(),
    } as any;

    repository = new TypeormEntryRepository(
      mockRepository,
      mockPaymentRepository,
      mockRecurrenceRepository,
      mockLogger,
      mockMetrics,
    );
  });

  const makeEntryEntity = (overrides: Partial<EntryEntity> = {}): EntryEntity =>
    ({
      id: 'entry-1',
      userId: 'user-1',
      categoryId: 'category-1',
      recurrenceId: null,
      description: 'Entry',
      amount: 100,
      issueDate: new Date('2026-01-10T00:00:00.000Z'),
      dueDate: new Date('2026-01-11T00:00:00.000Z'),
      category: {
        id: 'category-1',
        name: 'Salary',
        description: 'Salary',
        icon: 'icon',
        color: '#fff',
        type: 'INCOME',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      } as any,
      recurrence: null,
      payment: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    }) as EntryEntity;

  it('creates entry using data-model fields', async () => {
    const createData = {
      userId: 'user-1',
      categoryId: 'category-1',
      recurrenceId: null,
      description: 'Test',
      amount: 1500,
      issueDate: new Date('2026-01-10'),
      dueDate: new Date('2026-01-10'),
    };

    const entity = {
      id: 'entry-1',
      ...createData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as EntryEntity;

    mockRepository.create.mockReturnValue(entity);
    mockRepository.save.mockResolvedValue(entity);

    const result = await repository.create(createData);

    expect(mockRepository.create).toHaveBeenCalledWith(createData);
    expect(result.issueDate).toEqual(createData.issueDate);
    expect(result.dueDate).toEqual(createData.dueDate);
    expect(result.recurrenceId).toBeNull();
  });

  it('deletes existing entry', async () => {
    mockRepository.delete.mockResolvedValue({ affected: 1 } as any);
    await expect(repository.delete('entry-1')).resolves.toBeUndefined();
    expect(mockRepository.delete).toHaveBeenCalledWith('entry-1');
  });

  it('finds monthly recurring entries in a date range', async () => {
    const startDate = new Date(2026, 0, 1, 0, 0, 0);
    const endDate = new Date(2026, 0, 31, 23, 59, 59);
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };
    const entity = {
      id: 'entry-1',
      userId: 'user-1',
      categoryId: 'category-1',
      recurrenceId: 'recurrence-1',
      description: 'Rent',
      amount: 1000,
      issueDate: new Date('2026-01-10'),
      dueDate: new Date('2026-01-10'),
      recurrence: {
        id: 'recurrence-1',
        type: 'MONTHLY',
        createdAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as EntryEntity;

    queryBuilder.getMany.mockResolvedValue([entity]);
    mockRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

    const result = await repository.findMonthlyRecurringEntriesInRange({
      startDate,
      endDate,
    });

    expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('entry');
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'recurrence.type = :type',
      { type: 'MONTHLY' },
    );
    expect(result).toHaveLength(1);
    expect(result[0].recurrenceId).toBe('recurrence-1');
  });

  it('checks if monthly mirrored entry already exists', async () => {
    mockRepository.count.mockResolvedValue(1);

    const exists = await repository.existsMonthlyMirroredEntry({
      userId: 'user-1',
      recurrenceId: 'recurrence-1',
      issueDate: new Date('2026-02-10'),
      amount: 1000,
      description: 'Rent',
    });

    expect(mockRepository.count).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        recurrenceId: 'recurrence-1',
        issueDate: new Date('2026-02-10'),
        amount: 1000,
        description: 'Rent',
      },
    });
    expect(exists).toBe(true);
  });

  it('finds recurrence id by type and returns null when missing', async () => {
    mockRecurrenceRepository.findOne.mockResolvedValueOnce({
      id: 'rec-1',
    } as any);
    mockRecurrenceRepository.findOne.mockResolvedValueOnce(null);

    await expect(repository.findRecurrenceIdByType('MONTHLY')).resolves.toBe(
      'rec-1',
    );
    await expect(
      repository.findRecurrenceIdByType('WEEKLY'),
    ).resolves.toBeNull();
  });

  it('finds entry by id and maps nested fields', async () => {
    const entity = makeEntryEntity({
      recurrenceId: 'rec-1',
      recurrence: {
        id: 'rec-1',
        type: 'MONTHLY',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      } as any,
      payment: {
        id: 'payment-1',
        entryId: 'entry-1',
        amount: 100,
        createdAt: new Date('2026-01-12T00:00:00.000Z'),
      } as any,
    });
    mockRepository.findOne.mockResolvedValueOnce(entity);
    mockRepository.findOne.mockResolvedValueOnce(null);

    const found = await repository.findById('entry-1');
    const missing = await repository.findById('missing');

    expect(found?.id).toBe('entry-1');
    expect(found?.payment?.id).toBe('payment-1');
    expect(found?.recurrence?.id).toBe('rec-1');
    expect(missing).toBeNull();
  });

  it('finds entries by user id ordered by due date', async () => {
    mockRepository.find.mockResolvedValue([
      makeEntryEntity({ id: 'entry-1' }),
      makeEntryEntity({ id: 'entry-2', amount: 250 }),
    ]);

    const entries = await repository.findByUserId('user-1');

    expect(mockRepository.find).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      relations: ['category', 'recurrence', 'payment'],
      order: { dueDate: 'DESC' },
    });
    expect(entries).toHaveLength(2);
    expect(entries[1].amount).toBe(250);
  });

  it('finds entries by month via query builder', async () => {
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([makeEntryEntity()]),
    };
    mockRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

    const result = await repository.findByUserIdAndMonth('user-1', 2026, 2);

    expect(queryBuilder.where).toHaveBeenCalledWith('entry.userId = :userId', {
      userId: 'user-1',
    });
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('entry.dueDate', 'DESC');
    expect(result).toHaveLength(1);
  });

  it('applies filters, sorting and totals on month query', async () => {
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([
        [
          makeEntryEntity({
            amount: 1000,
            category: { type: 'INCOME', name: 'Salary' } as any,
          }),
          makeEntryEntity({
            id: 'expense-paid',
            amount: 300,
            category: { type: 'EXPENSE', name: 'Food' } as any,
            payment: {
              id: 'p1',
              entryId: 'expense-paid',
              amount: 300,
              createdAt: new Date(),
            } as any,
          }),
          makeEntryEntity({
            id: 'expense-unpaid',
            amount: 120,
            category: { type: 'EXPENSE', name: 'Bills' } as any,
          }),
        ],
        3,
      ]),
    };
    mockRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

    const result = await repository.findByUserIdAndMonthWithFilters({
      userId: 'user-1',
      year: 2026,
      month: 2,
      page: 2,
      limit: 10,
      sort: 'amount',
      order: 'asc',
      categoryId: 'category-1',
      entryType: 'EXPENSE',
      search: ' bill ',
    });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'entry.categoryId = :categoryId',
      { categoryId: 'category-1' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'category.type = :entryType',
      { entryType: 'EXPENSE' },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('entry.amount', 'ASC');
    expect(queryBuilder.skip).toHaveBeenCalledWith(10);
    expect(queryBuilder.take).toHaveBeenCalledWith(10);
    expect(result.total).toBe(3);
    expect(result.totalIncome).toBe(1000);
    expect(result.totalExpenses).toBe(300);
    expect(mockMetrics.recordDbQuery).toHaveBeenCalled();
  });

  it('falls back to dueDate sort when sort is invalid', async () => {
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    mockRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

    await repository.findByUserIdAndMonthWithFilters({
      userId: 'user-1',
      year: 2026,
      month: 2,
      sort: 'invalid' as any,
    });

    expect(queryBuilder.orderBy).toHaveBeenCalledWith('entry.dueDate', 'DESC');
  });

  it('computes monthly summary stats for fixed and dynamic entries', async () => {
    const entries = [
      {
        ...makeEntryEntity({ amount: 1500, recurrenceId: 'r1' }),
        category: { type: 'INCOME' },
      },
      {
        ...makeEntryEntity({ id: 'i2', amount: 500, recurrenceId: null }),
        category: { type: 'INCOME' },
      },
      {
        ...makeEntryEntity({ id: 'e1', amount: 200, recurrenceId: 'r2' }),
        category: { type: 'EXPENSE' },
        payment: {
          id: 'p1',
          entryId: 'e1',
          amount: 200,
          createdAt: new Date(),
        },
      },
      {
        ...makeEntryEntity({ id: 'e2', amount: 90, recurrenceId: null }),
        category: { type: 'EXPENSE' },
        payment: { id: 'p2', entryId: 'e2', amount: 90, createdAt: new Date() },
      },
      {
        ...makeEntryEntity({ id: 'e3', amount: 70, recurrenceId: 'r3' }),
        category: { type: 'EXPENSE' },
      },
      {
        ...makeEntryEntity({ id: 'e4', amount: 30, recurrenceId: null }),
        category: { type: 'EXPENSE' },
      },
    ] as any;
    jest.spyOn(repository, 'findByUserIdAndMonth').mockResolvedValue(entries);

    const result = await repository.getMonthlySummaryStats('user-1', 2026, 2);

    expect(result.totalIncome).toBe(2000);
    expect(result.totalPaidExpenses).toBe(290);
    expect(result.fixedIncome).toBe(1500);
    expect(result.dynamicIncome).toBe(500);
    expect(result.fixedPaidExpenses).toBe(200);
    expect(result.dynamicPaidExpenses).toBe(90);
    expect(result.fixedUnpaidExpenses).toBe(70);
    expect(result.dynamicUnpaidExpenses).toBe(30);
    expect(result.incomeEntries).toBe(2);
    expect(result.expenseEntries).toBe(4);
  });

  it('builds category summary with unpaid amount and limits top items', async () => {
    const entries = [
      {
        ...makeEntryEntity({ id: '1', amount: 100, categoryId: 'c-income' }),
        category: { id: 'c-income', name: 'Salary', type: 'INCOME' },
      },
      {
        ...makeEntryEntity({ id: '2', amount: 80, categoryId: 'c1' }),
        category: { id: 'c1', name: 'Food', type: 'EXPENSE' },
        payment: { id: 'p1', entryId: '2', amount: 80, createdAt: new Date() },
      },
      {
        ...makeEntryEntity({ id: '3', amount: 50, categoryId: 'c1' }),
        category: { id: 'c1', name: 'Food', type: 'EXPENSE' },
      },
      {
        ...makeEntryEntity({ id: '4', amount: 40, categoryId: 'c2' }),
        category: { id: 'c2', name: 'Transport', type: 'EXPENSE' },
        payment: { id: 'p2', entryId: '4', amount: 40, createdAt: new Date() },
      },
      {
        ...makeEntryEntity({
          id: '5',
          amount: 20,
          categoryId: null as any,
          category: null as any,
        }),
      },
    ] as any;
    jest.spyOn(repository, 'findByUserIdAndMonth').mockResolvedValue(entries);

    const result = await repository.getCategorySummaryForMonth(
      'user-1',
      2026,
      2,
    );

    expect(result.allItems).toHaveLength(3);
    expect(result.items.length).toBeLessThanOrEqual(3);
    expect(result.incomeTotal).toBe(1);
    expect(result.expenseTotal).toBe(2);
    const food = result.allItems.find(item => item.categoryId === 'c1');
    expect(food?.total).toBe(80);
    expect(food?.unpaidAmount).toBe(50);
  });

  it('returns fixed entries summary and current balance', async () => {
    jest.spyOn(repository, 'findByUserId').mockResolvedValue([
      {
        ...makeEntryEntity({ amount: 1000, recurrenceId: 'r1' }),
        category: { type: 'INCOME' },
      },
      {
        ...makeEntryEntity({ id: 'e1', amount: 400, recurrenceId: 'r2' }),
        category: { type: 'EXPENSE' },
        payment: {
          id: 'p1',
          entryId: 'e1',
          amount: 400,
          createdAt: new Date(),
        },
      },
      {
        ...makeEntryEntity({ id: 'e2', amount: 250, recurrenceId: 'r3' }),
        category: { type: 'EXPENSE' },
      },
      {
        ...makeEntryEntity({ id: 'e3', amount: 500, recurrenceId: null }),
        category: { type: 'INCOME' },
      },
      {
        ...makeEntryEntity({ id: 'e4', amount: 120, recurrenceId: null }),
        category: { type: 'EXPENSE' },
        payment: {
          id: 'p2',
          entryId: 'e4',
          amount: 120,
          createdAt: new Date(),
        },
      },
    ] as any);

    const fixedSummary = await repository.getFixedEntriesSummary('user-1');
    const currentBalance = await repository.getCurrentBalance('user-1');

    expect(fixedSummary).toEqual({
      fixedIncome: 1000,
      fixedExpenses: 400,
      fixedNetFlow: 600,
      entriesCount: 3,
    });
    expect(currentBalance).toBe(980);
  });

  it('returns distinct month/year values from raw query rows', async () => {
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        { year: '2026', month: '2' },
        { year: '2025', month: '12' },
      ]),
    };
    mockRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

    const result = await repository.getDistinctMonthsYears('user-1');

    expect(result).toEqual([
      { year: 2026, month: 2 },
      { year: 2025, month: 12 },
    ]);
  });

  it('computes accumulated stats including previous unpaid expenses', async () => {
    jest.spyOn(repository, 'findByUserId').mockResolvedValue([
      {
        ...makeEntryEntity({
          id: 'income-1',
          amount: 1000,
          dueDate: new Date('2026-02-05'),
        }),
        category: { type: 'INCOME' },
      },
      {
        ...makeEntryEntity({
          id: 'expense-paid',
          amount: 250,
          dueDate: new Date('2026-02-10'),
        }),
        category: { type: 'EXPENSE' },
        payment: {
          id: 'p1',
          entryId: 'expense-paid',
          amount: 250,
          createdAt: new Date(),
        },
      },
      {
        ...makeEntryEntity({
          id: 'expense-old-unpaid',
          amount: 70,
          dueDate: new Date('2026-01-20'),
        }),
        category: { type: 'EXPENSE' },
      },
      {
        ...makeEntryEntity({
          id: 'income-future',
          amount: 500,
          dueDate: new Date('2026-03-15T12:00:00.000Z'),
        }),
        category: { type: 'INCOME' },
      },
    ] as any);

    const result = await repository.getAccumulatedStats('user-1', 2026, 2);

    expect(result.totalAccumulatedIncome).toBe(1000);
    expect(result.totalAccumulatedPaidExpenses).toBe(250);
    expect(result.previousMonthsUnpaidExpenses).toBe(70);
    expect(result.accumulatedBalance).toBe(750);
  });

  it('updates entry and throws when updated record does not exist', async () => {
    const updatedEntity = makeEntryEntity({
      id: 'entry-1',
      description: 'Updated',
    });
    mockRepository.update.mockResolvedValue({} as any);
    mockRepository.findOne
      .mockResolvedValueOnce(updatedEntity)
      .mockResolvedValueOnce(null);

    const updated = await repository.update('entry-1', {
      description: 'Updated',
    });
    await expect(
      repository.update('entry-1', { description: 'Missing' }),
    ).rejects.toThrow('Entry not found');

    expect(updated.description).toBe('Updated');
  });

  it('toggles payment status for all paths', async () => {
    const createdAt = new Date('2026-02-20T00:00:00.000Z');
    mockRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(makeEntryEntity({ userId: 'other-user' }))
      .mockResolvedValueOnce(
        makeEntryEntity({
          payment: {
            id: 'p1',
            entryId: 'entry-1',
            amount: 100,
            createdAt,
          } as any,
        }),
      )
      .mockResolvedValueOnce(makeEntryEntity({ payment: null }))
      .mockResolvedValueOnce(
        makeEntryEntity({
          payment: {
            id: 'p2',
            entryId: 'entry-1',
            amount: 100,
            createdAt,
          } as any,
        }),
      )
      .mockResolvedValueOnce(makeEntryEntity({ payment: null }));
    mockPaymentRepository.create.mockReturnValue({
      entryId: 'entry-1',
      amount: 100,
    } as any);
    mockPaymentRepository.save.mockResolvedValue({ createdAt } as any);

    await expect(
      repository.togglePaymentStatus('user-1', 'entry-1', true),
    ).rejects.toThrow('Entry not found');
    await expect(
      repository.togglePaymentStatus('user-1', 'entry-1', true),
    ).rejects.toThrow('Unauthorized');
    await expect(
      repository.togglePaymentStatus('user-1', 'entry-1', true),
    ).resolves.toEqual({ entryId: 'entry-1', isPaid: true, paidAt: createdAt });
    await expect(
      repository.togglePaymentStatus('user-1', 'entry-1', true),
    ).resolves.toEqual({ entryId: 'entry-1', isPaid: true, paidAt: createdAt });
    await expect(
      repository.togglePaymentStatus('user-1', 'entry-1', false),
    ).resolves.toEqual({ entryId: 'entry-1', isPaid: false, paidAt: null });
    await expect(
      repository.togglePaymentStatus('user-1', 'entry-1', false),
    ).resolves.toEqual({ entryId: 'entry-1', isPaid: false, paidAt: null });

    expect(mockPaymentRepository.delete).toHaveBeenCalledWith({
      entryId: 'entry-1',
    });
    expect(mockPaymentRepository.create).toHaveBeenCalledWith({
      entryId: 'entry-1',
      amount: 100,
    });
  });

  it('throws when deleting missing entry and soft deletes when existing', async () => {
    mockRepository.delete.mockResolvedValueOnce({ affected: 0 } as any);
    await expect(repository.delete('missing')).rejects.toThrow(
      'Entry not found',
    );

    mockRepository.delete.mockResolvedValueOnce({ affected: 1 } as any);
    const deletedAt = await repository.softDelete('entry-1');

    expect(deletedAt).toBeInstanceOf(Date);
    expect(mockLogger.logBusinessEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'entry_deleted', entityId: 'entry-1' }),
    );
    expect(mockMetrics.recordTransaction).toHaveBeenCalledWith(
      'delete',
      'success',
    );
  });
});
