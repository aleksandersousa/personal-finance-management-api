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
});
