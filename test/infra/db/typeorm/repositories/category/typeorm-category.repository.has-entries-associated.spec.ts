import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { TypeormCategoryRepository } from '@infra/db/typeorm/repositories/typeorm-category.repository';
import { CategoryEntity } from '@infra/db/typeorm/entities/category.entity';
import { LoggerSpy } from '../../../../mocks/logging/logger.spy';
import { MetricsSpy } from '../../../../mocks/metrics/metrics.spy';

describe('TypeormCategoryRepository - hasEntriesAssociated', () => {
  let repository: TypeormCategoryRepository;
  let testingModule: TestingModule;
  let mockTypeormRepository: jest.Mocked<Repository<CategoryEntity>>;
  let loggerSpy: LoggerSpy;
  let metricsSpy: MetricsSpy;

  // Mock QueryBuilder
  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawAndEntities: jest.fn(),
    getCount: jest.fn(),
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

  describe('hasEntriesAssociated', () => {
    beforeEach(() => {
      mockTypeormRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
    });

    it('should return false when category has no entries', async () => {
      // Arrange
      mockQueryBuilder.getCount.mockResolvedValue(0);

      // Act
      const result = await repository.hasEntriesAssociated('test-id');

      // Assert
      expect(result).toBe(false);
      expect(mockTypeormRepository.createQueryBuilder).toHaveBeenCalledWith(
        'category',
      );
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'category.entries',
        'entry',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'category.id = :categoryId',
        { categoryId: 'test-id' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.id IS NOT NULL',
      );
      expect(mockQueryBuilder.getCount).toHaveBeenCalled();

      // Verify metrics
      expect(metricsSpy.hasRecordedMetric('financial_transactions_total')).toBe(
        true,
      );
      const transactionMetrics = metricsSpy.getMetricsByFilter(
        'financial_transactions_total',
      );
      expect(transactionMetrics[0].labels).toMatchObject({
        type: 'category_has_entries_associated',
        status: 'success',
      });
    });

    it('should return true when category has entries', async () => {
      // Arrange
      mockQueryBuilder.getCount.mockResolvedValue(5);

      // Act
      const result = await repository.hasEntriesAssociated('test-id');

      // Assert
      expect(result).toBe(true);
      expect(metricsSpy.hasRecordedMetric('financial_transactions_total')).toBe(
        true,
      );
    });

    it('should handle database errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockQueryBuilder.getCount.mockRejectedValue(error);

      // Act & Assert
      await expect(
        repository.hasEntriesAssociated('test-id'),
      ).rejects.toThrow();

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);
      expect(loggerSpy.loggedErrors[0].message).toContain(
        'Failed to check entries association',
      );

      // Verify error metrics
      expect(metricsSpy.hasRecordedMetric('api_errors_total')).toBe(true);
      const errorMetrics = metricsSpy.getMetricsByFilter('api_errors_total');
      expect(errorMetrics[0].labels.endpoint).toBe(
        'category_repository_has_entries_associated',
      );
    });
  });
});
