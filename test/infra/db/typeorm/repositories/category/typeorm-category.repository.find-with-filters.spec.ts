import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { TypeormCategoryRepository } from '@infra/db/typeorm/repositories/typeorm-category.repository';
import { CategoryEntity } from '@infra/db/typeorm/entities/category.entity';
import { LoggerSpy } from '../../../../mocks/logging/logger.spy';
import { MetricsSpy } from '../../../../mocks/metrics/metrics.spy';
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

  // Mock data for testing
  const mockCategoryEntity = {
    id: 'test-id',
    name: 'Test Category',
    description: 'Test Description',
    type: CategoryType.INCOME,
    color: '#4CAF50',
    icon: 'work',
    userId: mockUserId,
    isDefault: false,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    deletedAt: null,
    entries: [],
  };

  // Mock QueryBuilder
  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getRawAndEntities: jest.fn(),
    getCount: jest.fn().mockResolvedValue(0),
  };

  beforeEach(async () => {
    loggerSpy = new LoggerSpy();
    metricsSpy = new MetricsSpy();

    // Create mock repository
    mockTypeormRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn(),
      count: jest.fn(),
    } as any;

    // Setup query builder mock
    mockTypeormRepository.createQueryBuilder.mockReturnValue(
      mockQueryBuilder as any,
    );

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
    beforeEach(() => {
      mockTypeormRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
    });

    it('should find all categories for user without filters', async () => {
      // Arrange
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
      mockQueryBuilder.getCount.mockResolvedValue(2);

      // Act
      const result = await repository.findWithFilters(filters);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockTypeormRepository.createQueryBuilder).toHaveBeenCalledWith(
        'category',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'category.userId = :userId',
        { userId: mockUserId },
      );

      // Verify logging
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

      // Verify metrics
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
      // Arrange
      const filters: CategoryListFilters = {
        userId: mockUserId,
        type: CategoryType.INCOME,
      };

      const mockResults = {
        entities: [{ ...mockCategoryEntity, type: CategoryType.INCOME }],
        raw: [{ entriesCount: '0', totalAmount: '0', lastUsed: null }],
      };

      mockQueryBuilder.getRawAndEntities.mockResolvedValue(mockResults);
      mockQueryBuilder.getCount.mockResolvedValue(1);

      // Act
      const result = await repository.findWithFilters(filters);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'category.type = :type',
        { type: CategoryType.INCOME },
      );
    });

    it('should not filter when type is "all"', async () => {
      // Arrange
      const filters: CategoryListFilters = {
        userId: mockUserId,
        type: 'all' as any,
      };

      const mockResults = {
        entities: [mockCategoryEntity],
        raw: [{ entriesCount: '0', totalAmount: '0', lastUsed: null }],
      };

      mockQueryBuilder.getRawAndEntities.mockResolvedValue(mockResults);
      mockQueryBuilder.getCount.mockResolvedValue(1);

      // Act
      const result = await repository.findWithFilters(filters);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        expect.stringContaining('type'),
        expect.anything(),
      );
    });

    it('should include stats when requested', async () => {
      // Arrange
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

      // Create a separate mock for the count query builder
      const mockCountQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      };

      // Make createQueryBuilder return different builders for main query and count query
      mockTypeormRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder as any)
        .mockReturnValueOnce(mockCountQueryBuilder as any);

      mockQueryBuilder.getRawAndEntities.mockResolvedValue(mockResults);

      // Act
      const result = await repository.findWithFilters(filters);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'category.entries',
        'entry',
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
        'MAX(entry.date)',
        'lastUsed',
      );
      expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('category.id');
      expect((result.data[0] as any).entriesCount).toBe(5);
      expect((result.data[0] as any).totalAmount).toBe(100.5);
      expect((result.data[0] as any).lastUsed).toEqual(new Date('2023-12-01'));
    });

    it('should not include stats when not requested', async () => {
      // Arrange
      const filters: CategoryListFilters = {
        userId: mockUserId,
        includeStats: false,
      };

      const mockResults = {
        entities: [mockCategoryEntity],
        raw: [{}],
      };

      mockQueryBuilder.getRawAndEntities.mockResolvedValue(mockResults);
      mockQueryBuilder.getCount.mockResolvedValue(1);

      // Act
      const result = await repository.findWithFilters(filters);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockQueryBuilder.leftJoin).not.toHaveBeenCalled();
      expect(result.data[0]).not.toHaveProperty('entriesCount');
      expect(result.data[0]).not.toHaveProperty('totalAmount');
      expect(result.data[0]).not.toHaveProperty('lastUsed');
    });

    it('should handle edge cases in stats parsing', async () => {
      // Arrange
      const filters: CategoryListFilters = {
        userId: mockUserId,
        includeStats: true,
      };

      const mockResults = {
        entities: [mockCategoryEntity],
        raw: [{ entriesCount: null, totalAmount: undefined, lastUsed: null }],
      };

      // Create a separate mock for the count query builder
      const mockCountQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      };

      // Make createQueryBuilder return different builders for main query and count query
      mockTypeormRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder as any)
        .mockReturnValueOnce(mockCountQueryBuilder as any);

      mockQueryBuilder.getRawAndEntities.mockResolvedValue(mockResults);

      // Act
      const result = await repository.findWithFilters(filters);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect((result.data[0] as any).entriesCount).toBe(0);
      expect((result.data[0] as any).totalAmount).toBe(0);
      expect((result.data[0] as any).lastUsed).toBeNull();
      expect(typeof (result.data[0] as any).entriesCount).toBe('number');
      expect(typeof (result.data[0] as any).totalAmount).toBe('number');
    });

    it('should handle database errors', async () => {
      // Arrange
      const filters: CategoryListFilters = {
        userId: mockUserId,
      };
      const error = new Error('Database error');
      mockQueryBuilder.getCount.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.findWithFilters(filters)).rejects.toThrow();

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);
      expect(loggerSpy.loggedErrors[0].message).toContain(
        'Failed to find categories with filters',
      );

      // Verify error metrics
      expect(metricsSpy.hasRecordedMetric('api_errors_total')).toBe(true);
      const errorMetrics = metricsSpy.getMetricsByFilter('api_errors_total');
      expect(errorMetrics[0].labels.endpoint).toBe(
        'category_repository_find_with_filters',
      );
    });
  });
});
