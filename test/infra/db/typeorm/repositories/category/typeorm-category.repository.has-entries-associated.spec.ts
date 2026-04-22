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

  const mockUserId = 'user-1';
  const mockCategoryId = 'cat-1';

  const mockQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
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
      mockQueryBuilder.getCount.mockResolvedValue(0);

      const result = await repository.hasEntriesAssociated(
        mockUserId,
        mockCategoryId,
      );

      expect(result).toBe(false);
      expect(mockTypeormRepository.createQueryBuilder).toHaveBeenCalledWith(
        'category',
      );
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'category.entries',
        'entry',
        'entry.userId = :userId',
        { userId: mockUserId },
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'category.id = :categoryId',
        { categoryId: mockCategoryId },
      );
      expect(mockQueryBuilder.getCount).toHaveBeenCalled();

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
      mockQueryBuilder.getCount.mockResolvedValue(5);

      const result = await repository.hasEntriesAssociated(
        mockUserId,
        mockCategoryId,
      );

      expect(result).toBe(true);
      expect(metricsSpy.hasRecordedMetric('financial_transactions_total')).toBe(
        true,
      );
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockQueryBuilder.getCount.mockRejectedValue(error);

      await expect(
        repository.hasEntriesAssociated(mockUserId, mockCategoryId),
      ).rejects.toThrow();

      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);
      expect(loggerSpy.loggedErrors[0].message).toContain(
        'Failed to check entries association',
      );

      expect(metricsSpy.hasRecordedMetric('api_errors_total')).toBe(true);
      const errorMetrics = metricsSpy.getMetricsByFilter('api_errors_total');
      expect(errorMetrics[0].labels.endpoint).toBe(
        'category_repository_has_entries_associated',
      );
    });

    it('should log and rethrow on error', async () => {
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockRejectedValue('err'),
      } as any;
      (mockTypeormRepository.createQueryBuilder as any).mockReturnValue(qb);
      await expect(
        repository.hasEntriesAssociated(mockUserId, mockCategoryId),
      ).rejects.toBe('err');
    });
  });
});
