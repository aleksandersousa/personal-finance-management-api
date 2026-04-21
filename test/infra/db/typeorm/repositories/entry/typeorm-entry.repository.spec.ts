import { Repository } from 'typeorm';
import { TypeormEntryRepository } from '@infra/db/typeorm/repositories/typeorm-entry.repository';
import { EntryEntity } from '@infra/db/typeorm/entities/entry.entity';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { FinancialMetricsService } from '@infra/metrics/financial-metrics.service';

describe('TypeormEntryRepository', () => {
  let repository: TypeormEntryRepository;
  let mockRepository: jest.Mocked<Repository<EntryEntity>>;
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
});
