import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TypeormEntryRepository } from '@infra/db/typeorm/repositories/typeorm-entry.repository';
import { EntryEntity } from '@infra/db/typeorm/entities/entry.entity';
import { EntryMonthlyPaymentEntity } from '@infra/db/typeorm/entities/entry-monthly-payment.entity';
import { FindEntriesByMonthFilters } from '@/data/protocols/repositories/entry-repository';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { FinancialMetricsService } from '@infra/metrics/financial-metrics.service';

describe('TypeormEntryRepository - Find By User ID And Month With Filters', () => {
  let repository: TypeormEntryRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<EntryEntity>>;
  let mockMonthlyPaymentRepository: jest.Mocked<
    Repository<EntryMonthlyPaymentEntity>
  >;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<EntryEntity>>;
  let mockLogger: jest.Mocked<ContextAwareLoggerService>;
  let mockMetrics: jest.Mocked<FinancialMetricsService>;

  const mockEntries = [
    {
      id: 'entry-1',
      userId: 'user-123',
      description: 'Salary',
      amount: 5000,
      date: new Date('2024-01-15'),
      type: 'INCOME',
      isFixed: true,
      categoryId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'entry-2',
      userId: 'user-123',
      description: 'Rent',
      amount: 1500,
      date: new Date('2024-01-01'),
      type: 'EXPENSE',
      isFixed: true,
      categoryId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ] as EntryEntity[];

  beforeEach(async () => {
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
      getMany: jest.fn(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    } as any;

    mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    mockMonthlyPaymentRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]), // Return empty array by default
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

  describe('findByUserIdAndMonthWithFilters', () => {
    it('should build correct query with basic filters', async () => {
      const filters: FindEntriesByMonthFilters = {
        userId: 'user-123',
        year: 2024,
        month: 1,
      };

      mockQueryBuilder.getCount.mockResolvedValue(2);
      mockQueryBuilder.getMany.mockResolvedValue(mockEntries);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '5000',
        totalExpenses: '1500',
      });

      await repository.findByUserIdAndMonthWithFilters(filters);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('entry');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'entry.userId = :userId',
        { userId: 'user-123' },
      );
      // Date filtering now uses Brackets for complex conditions
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'entry.user',
        'user',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'entry.category',
        'category',
      );
    });

    it('should apply type filter when provided', async () => {
      const filters: FindEntriesByMonthFilters = {
        userId: 'user-123',
        year: 2024,
        month: 1,
        type: 'INCOME',
      };

      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue([mockEntries[0]]);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '5000',
        totalExpenses: '0',
      });

      await repository.findByUserIdAndMonthWithFilters(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.type = :type',
        { type: 'INCOME' },
      );
    });

    it('should apply category filter when provided', async () => {
      const filters: FindEntriesByMonthFilters = {
        userId: 'user-123',
        year: 2024,
        month: 1,
        categoryId: 'category-123',
      };

      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue([mockEntries[0]]);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '5000',
        totalExpenses: '0',
      });

      await repository.findByUserIdAndMonthWithFilters(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.categoryId = :categoryId',
        { categoryId: 'category-123' },
      );
    });

    it('should apply sorting correctly', async () => {
      const filters: FindEntriesByMonthFilters = {
        userId: 'user-123',
        year: 2024,
        month: 1,
        sort: 'amount',
        order: 'asc',
      };

      mockQueryBuilder.getCount.mockResolvedValue(2);
      mockQueryBuilder.getMany.mockResolvedValue(mockEntries);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '5000',
        totalExpenses: '1500',
      });

      await repository.findByUserIdAndMonthWithFilters(filters);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'entry.amount',
        'ASC',
      );
    });

    it('should apply pagination correctly', async () => {
      const filters: FindEntriesByMonthFilters = {
        userId: 'user-123',
        year: 2024,
        month: 1,
        page: 2,
        limit: 10,
      };

      mockQueryBuilder.getCount.mockResolvedValue(25);
      mockQueryBuilder.getMany.mockResolvedValue(mockEntries);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '5000',
        totalExpenses: '1500',
      });

      await repository.findByUserIdAndMonthWithFilters(filters);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10); // (page - 1) * limit
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should return correct result structure', async () => {
      const filters: FindEntriesByMonthFilters = {
        userId: 'user-123',
        year: 2024,
        month: 1,
      };

      mockQueryBuilder.getCount.mockResolvedValue(2);
      mockQueryBuilder.getMany.mockResolvedValue(mockEntries);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '5000',
        totalExpenses: '1500',
      });

      const result = await repository.findByUserIdAndMonthWithFilters(filters);

      expect(result).toEqual({
        data: expect.any(Array),
        total: 2,
        totalIncome: 5000,
        totalExpenses: 1500,
      });
      expect(result.data).toHaveLength(2);
    });

    it('should handle default values correctly', async () => {
      const filters: FindEntriesByMonthFilters = {
        userId: 'user-123',
        year: 2024,
        month: 1,
        // No page, limit, sort, order provided - should use defaults
      };

      mockQueryBuilder.getCount.mockResolvedValue(2);
      mockQueryBuilder.getMany.mockResolvedValue(mockEntries);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '5000',
        totalExpenses: '1500',
      });

      await repository.findByUserIdAndMonthWithFilters(filters);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0); // (1 - 1) * 20
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'entry.date',
        'DESC',
      );
    });

    it("should not apply type filter when type is 'all'", async () => {
      const filters: FindEntriesByMonthFilters = {
        userId: 'user-123',
        year: 2024,
        month: 1,
        type: 'all',
      };

      mockQueryBuilder.getCount.mockResolvedValue(2);
      mockQueryBuilder.getMany.mockResolvedValue(mockEntries);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '5000',
        totalExpenses: '1500',
      });

      await repository.findByUserIdAndMonthWithFilters(filters);

      // Should not call andWhere with type filter
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'entry.type = :type',
        expect.any(Object),
      );
    });

    it("should not apply category filter when categoryId is 'all'", async () => {
      const filters: FindEntriesByMonthFilters = {
        userId: 'user-123',
        year: 2024,
        month: 1,
        categoryId: 'all',
      };

      mockQueryBuilder.getCount.mockResolvedValue(2);
      mockQueryBuilder.getMany.mockResolvedValue(mockEntries);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '5000',
        totalExpenses: '1500',
      });

      await repository.findByUserIdAndMonthWithFilters(filters);

      // Should not call andWhere with categoryId filter
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'entry.categoryId = :categoryId',
        expect.any(Object),
      );
    });

    it('should use default sort field for invalid sort parameter', async () => {
      const filters: FindEntriesByMonthFilters = {
        userId: 'user-123',
        year: 2024,
        month: 1,
        sort: 'invalid-sort-field', // Invalid sort field, should fallback to 'date'
      };

      mockQueryBuilder.getCount.mockResolvedValue(2);
      mockQueryBuilder.getMany.mockResolvedValue(mockEntries);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '5000',
        totalExpenses: '1500',
      });

      await repository.findByUserIdAndMonthWithFilters(filters);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'entry.date', // Should fallback to 'date'
        'DESC',
      );
    });

    it('should handle null summary result', async () => {
      const filters: FindEntriesByMonthFilters = {
        userId: 'user-123',
        year: 2024,
        month: 1,
      };

      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getRawOne.mockResolvedValue(null); // null summary result

      const result = await repository.findByUserIdAndMonthWithFilters(filters);

      expect(result).toEqual({
        data: [],
        total: 0,
        totalIncome: 0, // Should fallback to 0
        totalExpenses: 0, // Should fallback to 0
      });
    });

    it('should handle summary result with null values', async () => {
      const filters: FindEntriesByMonthFilters = {
        userId: 'user-123',
        year: 2024,
        month: 1,
      };

      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue([mockEntries[0]]);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: null, // null income
        totalExpenses: null, // null expenses
      });

      const result = await repository.findByUserIdAndMonthWithFilters(filters);

      expect(result).toEqual({
        data: expect.any(Array),
        total: 1,
        totalIncome: 0, // Should convert null to 0
        totalExpenses: 0, // Should convert null to 0
      });
    });
  });
});
