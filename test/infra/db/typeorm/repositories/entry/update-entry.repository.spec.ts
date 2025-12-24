import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeormEntryRepository } from '@infra/db/typeorm/repositories/typeorm-entry.repository';
import { EntryEntity } from '@infra/db/typeorm/entities/entry.entity';
import { EntryMonthlyPaymentEntity } from '@infra/db/typeorm/entities/entry-monthly-payment.entity';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { FinancialMetricsService } from '@infra/metrics/financial-metrics.service';

describe('TypeormEntryRepository - Update Entry', () => {
  let repository: TypeormEntryRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<EntryEntity>>;
  let mockMonthlyPaymentRepository: jest.Mocked<
    Repository<EntryMonthlyPaymentEntity>
  >;
  let mockLogger: jest.Mocked<ContextAwareLoggerService>;
  let mockMetrics: jest.Mocked<FinancialMetricsService>;

  const mockEntryEntity: EntryEntity = {
    id: 'entry-1',
    userId: 'user-123',
    description: 'Test Entry',
    amount: 1000,
    date: new Date('2024-01-15'),
    type: 'INCOME',
    isFixed: false,
    categoryId: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as EntryEntity;

  beforeEach(async () => {
    mockRepository = {
      update: jest.fn(),
      findOne: jest.fn(),
    } as any;

    mockMonthlyPaymentRepository = {
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
      updateActiveUsers: jest.fn(),
      getMetrics: jest.fn(),
    } as any;

    testingModule = await Test.createTestingModule({
      providers: [
        TypeormEntryRepository,
        {
          provide: getRepositoryToken(EntryEntity),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(EntryMonthlyPaymentEntity),
          useValue: mockMonthlyPaymentRepository,
        },
        {
          provide: 'Logger',
          useValue: mockLogger,
        },
        {
          provide: 'Metrics',
          useValue: mockMetrics,
        },
      ],
    }).compile();

    repository = testingModule.get<TypeormEntryRepository>(
      TypeormEntryRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('update', () => {
    it('should update an entry', async () => {
      const updateData = {
        description: 'Updated Entry',
        amount: 2000,
      };

      mockRepository.update.mockResolvedValue({
        affected: 1,
        generatedMaps: [],
        raw: {},
      });
      mockRepository.findOne.mockResolvedValue({
        ...mockEntryEntity,
        ...updateData,
      });

      const result = await repository.update('entry-1', updateData);

      expect(mockRepository.update).toHaveBeenCalledWith('entry-1', updateData);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        relations: ['user', 'category'],
      });
      expect(result.description).toBe(updateData.description);
      expect(result.amount).toBe(updateData.amount);
    });

    it('should throw error when entry not found after update', async () => {
      mockRepository.update.mockResolvedValue({
        affected: 1,
        generatedMaps: [],
        raw: {},
      });
      mockRepository.findOne.mockResolvedValue(null);

      await expect(repository.update('non-existent', {})).rejects.toThrow(
        'Entry not found',
      );
    });

    it('should handle partial updates with all fields', async () => {
      const updateData = {
        userId: 'user-456',
        description: 'New Description',
        amount: 1500,
        date: new Date('2024-02-01'),
        type: 'EXPENSE' as const,
        isFixed: true,
        categoryId: 'category-123',
      };

      mockRepository.update.mockResolvedValue({
        affected: 1,
        generatedMaps: [],
        raw: {},
      });
      mockRepository.findOne.mockResolvedValue({
        ...mockEntryEntity,
        ...updateData,
      });

      const result = await repository.update('entry-1', updateData);

      expect(mockRepository.update).toHaveBeenCalledWith('entry-1', updateData);
      expect(result.userId).toBe(updateData.userId);
      expect(result.type).toBe(updateData.type);
    });
  });
});
