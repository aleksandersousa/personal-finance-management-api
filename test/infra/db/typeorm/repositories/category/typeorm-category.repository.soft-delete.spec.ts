import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { TypeormCategoryRepository } from '@infra/db/typeorm/repositories/typeorm-category.repository';
import { CategoryEntity } from '@infra/db/typeorm/entities/category.entity';
import { LoggerSpy } from '../../../../mocks/logging/logger.spy';
import { MetricsSpy } from '../../../../mocks/metrics/metrics.spy';

describe('TypeormCategoryRepository - softDelete', () => {
  let repository: TypeormCategoryRepository;
  let testingModule: TestingModule;
  let mockTypeormRepository: jest.Mocked<Repository<CategoryEntity>>;
  let loggerSpy: LoggerSpy;
  let metricsSpy: MetricsSpy;

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

  describe('softDelete', () => {
    it('should soft delete category successfully', async () => {
      // Arrange
      mockTypeormRepository.softDelete.mockResolvedValue({
        affected: 1,
      } as any);

      // Act
      await repository.softDelete('test-id');

      // Assert
      expect(mockTypeormRepository.softDelete).toHaveBeenCalledWith('test-id');

      // Verify logging
      const businessEvents = loggerSpy.getBusinessEvents(
        'category_soft_deleted',
      );
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0]).toMatchObject({
        event: 'category_soft_deleted',
        entityId: 'test-id',
      });

      // Verify metrics
      expect(metricsSpy.hasRecordedMetric('financial_transactions_total')).toBe(
        true,
      );
      const transactionMetrics = metricsSpy.getMetricsByFilter(
        'financial_transactions_total',
      );
      expect(transactionMetrics[0].labels).toMatchObject({
        type: 'category_soft_delete',
        status: 'success',
      });
    });

    it('should throw error when category not found', async () => {
      // Arrange
      mockTypeormRepository.softDelete.mockResolvedValue({
        affected: 0,
      } as any);

      // Act & Assert
      await expect(repository.softDelete('non-existent-id')).rejects.toThrow(
        'Category not found',
      );

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);
      expect(loggerSpy.loggedErrors[0].message).toContain(
        'Failed to soft delete category',
      );

      // Verify error metrics
      expect(metricsSpy.hasRecordedMetric('api_errors_total')).toBe(true);
      const errorMetrics = metricsSpy.getMetricsByFilter('api_errors_total');
      expect(errorMetrics[0].labels.endpoint).toBe(
        'category_repository_soft_delete',
      );
    });

    it('should handle database errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockTypeormRepository.softDelete.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.softDelete('test-id')).rejects.toThrow();

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);
      expect(loggerSpy.loggedErrors[0].message).toContain(
        'Failed to soft delete category',
      );

      // Verify error metrics
      expect(metricsSpy.hasRecordedMetric('api_errors_total')).toBe(true);
    });

    it('should log and rethrow on error', async () => {
      mockTypeormRepository.softDelete.mockRejectedValue('err');
      await expect(repository.softDelete('id')).rejects.toBe('err');
    });
  });
});
