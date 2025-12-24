import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TypeormEntryRepository } from '@infra/db/typeorm/repositories/typeorm-entry.repository';
import { EntryEntity } from '@infra/db/typeorm/entities/entry.entity';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { FinancialMetricsService } from '@infra/metrics/financial-metrics.service';
import { FindEntriesByMonthFilters } from '@/data/protocols/repositories/entry-repository';

describe('TypeormEntryRepository - Filtered Search', () => {
  let repository: TypeormEntryRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<EntryEntity>>;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<EntryEntity>>;
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
    categoryId: 'category-1',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as EntryEntity;

  beforeEach(async () => {
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
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
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
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
    const filters: FindEntriesByMonthFilters = {
      userId: 'user-123',
      year: 2024,
      month: 1,
      type: 'INCOME',
      categoryId: 'category-1',
      page: 1,
      limit: 10,
    };

    it('should find entries with all filters applied', async () => {
      const mockEntries = [mockEntryEntity];
      const mockTotalCount = 5;

      mockQueryBuilder.getCount.mockResolvedValue(mockTotalCount);
      mockQueryBuilder.getMany.mockResolvedValue(mockEntries);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '5000.00',
        totalExpenses: '1500.00',
      });

      const result = await repository.findByUserIdAndMonthWithFilters(filters);

      // Verify the query builder was configured with all filters
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('entry');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'entry.userId = :userId',
        { userId: 'user-123' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.type = :type',
        { type: 'INCOME' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.categoryId = :categoryId',
        { categoryId: 'category-1' },
      );

      // Verify pagination
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);

      // Verify result structure
      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({
            id: mockEntryEntity.id,
            amount: Number(mockEntryEntity.amount),
          }),
        ]),
        total: mockTotalCount,
        totalIncome: 5000,
        totalExpenses: 1500,
      });
    });

    it('should handle pagination correctly for multiple pages', async () => {
      const mockEntries = [mockEntryEntity];
      const mockTotalCount = 25;

      mockQueryBuilder.getCount.mockResolvedValue(mockTotalCount);
      mockQueryBuilder.getMany.mockResolvedValue(mockEntries);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '3000.00',
        totalExpenses: '1000.00',
      });

      const filtersWithPagination: FindEntriesByMonthFilters = {
        ...filters,
        page: 3,
        limit: 10,
      };

      const result = await repository.findByUserIdAndMonthWithFilters(
        filtersWithPagination,
      );

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20); // (page - 1) * limit
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);

      expect(result.total).toBe(25);
      expect(result.data).toHaveLength(1);
    });

    it('should work with minimal filters', async () => {
      const minimalFilters: FindEntriesByMonthFilters = {
        userId: 'user-123',
        year: 2024,
        month: 1,
        page: 1,
        limit: 10,
      };

      const mockEntries = [mockEntryEntity];
      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue(mockEntries);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '1000.00',
        totalExpenses: '0.00',
      });

      const result =
        await repository.findByUserIdAndMonthWithFilters(minimalFilters);

      // The method creates two query builders (one for data, one for summary)
      // so where() is called twice (once for each query)
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'entry.userId = :userId',
        { userId: 'user-123' },
      );

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should return empty result when no entries found', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '0.00',
        totalExpenses: '0.00',
      });

      const result = await repository.findByUserIdAndMonthWithFilters(filters);

      expect(result).toEqual({
        data: [],
        total: 0,
        totalIncome: 0,
        totalExpenses: 0,
      });
    });

    it('should apply search filter with ILIKE for case-insensitive description search', async () => {
      const mockEntries = [mockEntryEntity];
      const mockTotalCount = 1;

      mockQueryBuilder.getCount.mockResolvedValue(mockTotalCount);
      mockQueryBuilder.getMany.mockResolvedValue(mockEntries);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '1000.00',
        totalExpenses: '0.00',
      });

      const filtersWithSearch: FindEntriesByMonthFilters = {
        ...filters,
        search: 'test',
      };

      const result =
        await repository.findByUserIdAndMonthWithFilters(filtersWithSearch);

      // Verify search filter was applied with ILIKE
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.description ILIKE :search',
        { search: '%test%' },
      );

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should trim search term and apply wildcards', async () => {
      const mockEntries = [mockEntryEntity];
      const mockTotalCount = 1;

      mockQueryBuilder.getCount.mockResolvedValue(mockTotalCount);
      mockQueryBuilder.getMany.mockResolvedValue(mockEntries);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '1000.00',
        totalExpenses: '0.00',
      });

      const filtersWithSearch: FindEntriesByMonthFilters = {
        ...filters,
        search: '  test entry  ',
      };

      await repository.findByUserIdAndMonthWithFilters(filtersWithSearch);

      // Verify search term was trimmed and wildcards added
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.description ILIKE :search',
        { search: '%test entry%' },
      );
    });

    it('should not apply search filter when search is empty or undefined', async () => {
      const mockEntries = [mockEntryEntity];
      const mockTotalCount = 1;

      mockQueryBuilder.getCount.mockResolvedValue(mockTotalCount);
      mockQueryBuilder.getMany.mockResolvedValue(mockEntries);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '1000.00',
        totalExpenses: '0.00',
      });

      const filtersWithoutSearch: FindEntriesByMonthFilters = {
        ...filters,
        search: undefined,
      };

      await repository.findByUserIdAndMonthWithFilters(filtersWithoutSearch);

      // Verify search filter was not applied
      const searchCalls = (
        mockQueryBuilder.andWhere as jest.Mock
      ).mock.calls.filter(
        call => typeof call[0] === 'string' && call[0]?.includes('ILIKE'),
      );
      expect(searchCalls).toHaveLength(0);
    });
  });
});
