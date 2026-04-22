import { Test, TestingModule } from '@nestjs/testing';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TypeormCategoryRepository } from '@infra/db/typeorm/repositories/typeorm-category.repository';
import { CategoryEntity } from '@infra/db/typeorm/entities/category.entity';
import { LoggerSpy } from '@test/infra/mocks/logging/logger.spy';
import { MetricsSpy } from '@test/infra/mocks/metrics/metrics.spy';
import {
  CategoryType,
  CategoryListFilters,
} from '@domain/models/category.model';

describe('TypeormCategoryRepository - findWithFilters', () => {
  let repository: TypeormCategoryRepository;
  let testingModule: TestingModule;
  let mockTypeormRepository: jest.Mocked<Repository<CategoryEntity>>;
  let loggerSpy: LoggerSpy;
  let metricsSpy: MetricsSpy;

  const mockUserId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  const mockCategoryEntity = {
    id: 'test-id',
    name: 'Test Category',
    description: 'Test Description',
    type: CategoryType.INCOME,
    color: '#4CAF50',
    icon: 'work',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    deletedAt: null,
    entries: [],
  };

  const mockQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getRawAndEntities: jest.fn(),
  };

  const mockCountQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
  };

  beforeEach(async () => {
    loggerSpy = new LoggerSpy();
    metricsSpy = new MetricsSpy();

    mockTypeormRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
      count: jest.fn(),
    } as any;

    let qbCall = 0;
    mockTypeormRepository.createQueryBuilder.mockImplementation(() => {
      qbCall += 1;
      return (
        qbCall % 2 === 1 ? mockQueryBuilder : mockCountQueryBuilder
      ) as any;
    });

    testingModule = await Test.createTestingModule({
      providers: [
        {
          provide: TypeormCategoryRepository,
          useFactory: () => {
            return new TypeormCategoryRepository(
              mockTypeormRepository,
              loggerSpy,
              metricsSpy,
            );
          },
        },
      ],
    }).compile();

    repository = testingModule.get<TypeormCategoryRepository>(
      TypeormCategoryRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    loggerSpy.clear();
    metricsSpy.clear();
  });

  afterAll(async () => {
    await testingModule.close();
  });

  describe('findWithFilters', () => {
    it('should find all categories for user without filters', async () => {
      const filters: CategoryListFilters = {
        userId: mockUserId,
      };

      const mockResults = {
        entities: [
          { ...mockCategoryEntity, name: 'Category 1' },
          { ...mockCategoryEntity, name: 'Category 2' },
        ],
        raw: [
          { entriesCount: '0', totalAmount: '0', lastUsed: null },
          { entriesCount: '0', totalAmount: '0', lastUsed: null },
        ],
      };

      mockQueryBuilder.getRawAndEntities.mockResolvedValue(mockResults);
      mockCountQueryBuilder.getCount.mockResolvedValue(2);

      const result = await repository.findWithFilters(filters);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockTypeormRepository.createQueryBuilder).toHaveBeenCalledWith(
        'category',
      );
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'category.users',
        'user',
        'user.id = :userId',
        { userId: mockUserId },
      );

      const businessEvents = loggerSpy.getBusinessEvents(
        'categories_found_with_filters',
      );
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0]).toMatchObject({
        event: 'categories_found_with_filters',
        userId: mockUserId,
        metadata: {
          type: undefined,
          includeStats: undefined,
          resultCount: 2,
        },
      });

      expect(metricsSpy.hasRecordedMetric('financial_transactions_total')).toBe(
        true,
      );
      const transactionMetrics = metricsSpy.getMetricsByFilter(
        'financial_transactions_total',
      );
      expect(transactionMetrics[0].labels).toMatchObject({
        type: 'category_find_with_filters',
        status: 'success',
      });
    });

    it('should filter categories by type', async () => {
      const filters: CategoryListFilters = {
        userId: mockUserId,
        type: CategoryType.INCOME,
      };

      const mockResults = {
        entities: [{ ...mockCategoryEntity, type: CategoryType.INCOME }],
        raw: [{ entriesCount: '0', totalAmount: '0', lastUsed: null }],
      };

      mockQueryBuilder.getRawAndEntities.mockResolvedValue(mockResults);
      mockCountQueryBuilder.getCount.mockResolvedValue(1);

      const result = await repository.findWithFilters(filters);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'category.type = :type',
        { type: CategoryType.INCOME },
      );
    });

    it('should not filter when type is "all"', async () => {
      const filters: CategoryListFilters = {
        userId: mockUserId,
        type: 'all' as any,
      };

      const mockResults = {
        entities: [mockCategoryEntity],
        raw: [{ entriesCount: '0', totalAmount: '0', lastUsed: null }],
      };

      mockQueryBuilder.getRawAndEntities.mockResolvedValue(mockResults);
      mockCountQueryBuilder.getCount.mockResolvedValue(1);

      const result = await repository.findWithFilters(filters);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        expect.stringContaining('type'),
        expect.anything(),
      );
    });

    it('should include stats when requested', async () => {
      const filters: CategoryListFilters = {
        userId: mockUserId,
        includeStats: true,
      };

      const mockResults = {
        entities: [mockCategoryEntity],
        raw: [
          { entriesCount: '5', totalAmount: '100.50', lastUsed: '2023-12-01' },
        ],
      };

      mockTypeormRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder as any)
        .mockReturnValueOnce(mockCountQueryBuilder as any);

      mockQueryBuilder.getRawAndEntities.mockResolvedValue(mockResults);
      mockCountQueryBuilder.getCount.mockResolvedValue(1);

      const result = await repository.findWithFilters(filters);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'category.entries',
        'entry',
        'entry.userId = :userId',
        { userId: mockUserId },
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledTimes(3);
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        'COUNT(entry.id)',
        'entriesCount',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        'COALESCE(SUM(entry.amount), 0)',
        'totalAmount',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        'MAX(entry.dueDate)',
        'lastUsed',
      );
      expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('category.id');
      expect((result.data[0] as any).entriesCount).toBe(5);
      expect((result.data[0] as any).totalAmount).toBe(100.5);
      expect((result.data[0] as any).lastUsed).toEqual(new Date('2023-12-01'));
    });

    it('should not include stats when not requested', async () => {
      const filters: CategoryListFilters = {
        userId: mockUserId,
        includeStats: false,
      };

      const mockResults = {
        entities: [mockCategoryEntity],
        raw: [{}],
      };

      mockQueryBuilder.getRawAndEntities.mockResolvedValue(mockResults);
      mockCountQueryBuilder.getCount.mockResolvedValue(1);

      const result = await repository.findWithFilters(filters);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockQueryBuilder.leftJoin).not.toHaveBeenCalled();
      expect(result.data[0]).not.toHaveProperty('entriesCount');
      expect(result.data[0]).not.toHaveProperty('totalAmount');
      expect(result.data[0]).not.toHaveProperty('lastUsed');
    });

    it('should handle edge cases in stats parsing', async () => {
      const filters: CategoryListFilters = {
        userId: mockUserId,
        includeStats: true,
      };

      const mockResults = {
        entities: [mockCategoryEntity],
        raw: [{ entriesCount: null, totalAmount: undefined, lastUsed: null }],
      };

      mockTypeormRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder as any)
        .mockReturnValueOnce(mockCountQueryBuilder as any);

      mockQueryBuilder.getRawAndEntities.mockResolvedValue(mockResults);
      mockCountQueryBuilder.getCount.mockResolvedValue(1);

      const result = await repository.findWithFilters(filters);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect((result.data[0] as any).entriesCount).toBe(0);
      expect((result.data[0] as any).totalAmount).toBe(0);
      expect((result.data[0] as any).lastUsed).toBeNull();
      expect(typeof (result.data[0] as any).entriesCount).toBe('number');
      expect(typeof (result.data[0] as any).totalAmount).toBe('number');
    });

    it('should handle database errors', async () => {
      const filters: CategoryListFilters = {
        userId: mockUserId,
      };
      const error = new Error('Database error');
      mockCountQueryBuilder.getCount.mockRejectedValue(error);

      await expect(repository.findWithFilters(filters)).rejects.toThrow();

      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);
      expect(loggerSpy.loggedErrors[0].message).toContain(
        'Failed to find categories with filters',
      );

      expect(metricsSpy.hasRecordedMetric('api_errors_total')).toBe(true);
      const errorMetrics = metricsSpy.getMetricsByFilter('api_errors_total');
      expect(errorMetrics[0].labels.endpoint).toBe(
        'category_repository_find_with_filters',
      );
    });

    it('should log and rethrow on error', async () => {
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn(),
        getCount: jest.fn().mockRejectedValue('err'),
      } as unknown as jest.Mocked<SelectQueryBuilder<CategoryEntity>>;
      (mockTypeormRepository.createQueryBuilder as any).mockReturnValue(qb);

      await expect(
        repository.findWithFilters({
          userId: 'u',
          type: 'all' as any,
          includeStats: false,
        }),
      ).rejects.toBe('err');
    });

    it('findWithFilters without metrics should work for includeStats=false', async () => {
      const baseEntity = {
        id: 'id1',
        name: 'Name',
        description: 'Desc',
        type: CategoryType.EXPENSE,
        color: '#000',
        icon: 'i',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        deletedAt: null as any,
        entries: [],
      } as any;

      const repositoryWithoutMetrics = new TypeormCategoryRepository(
        mockTypeormRepository,
        loggerSpy,
        undefined as any,
      );

      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawAndEntities: jest
          .fn()
          .mockResolvedValue({ raw: [], entities: [baseEntity] }),
        getCount: jest.fn().mockResolvedValue(1),
      } as unknown as jest.Mocked<SelectQueryBuilder<CategoryEntity>>;

      let call = 0;
      (mockTypeormRepository.createQueryBuilder as any).mockImplementation(
        () => {
          call += 1;
          return qb as any;
        },
      );

      const result = await repositoryWithoutMetrics.findWithFilters({
        userId: 'user-1',
        type: 'all' as any,
        includeStats: false,
      });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0]).toMatchObject({ id: 'id1' });
    });
  });
});
