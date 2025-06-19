import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { TypeormCategoryRepository } from '@infra/db/typeorm/repositories/typeorm-category.repository';
import { CategoryEntity } from '@infra/db/typeorm/entities/category.entity';
import { LoggerSpy } from '../../../../mocks/logging/logger.spy';
import { MetricsSpy } from '../../../../mocks/metrics/metrics.spy';
import { CategoryType } from '@domain/models/category.model';

describe('TypeormCategoryRepository - delete', () => {
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

  describe('delete', () => {
    it('should delete category successfully', async () => {
      // Arrange
      mockTypeormRepository.findOne.mockResolvedValue(
        mockCategoryEntity as any,
      );
      mockTypeormRepository.delete.mockResolvedValue({ affected: 1 } as any);

      // Act
      await repository.delete('test-id');

      // Assert
      expect(mockTypeormRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
      expect(mockTypeormRepository.delete).toHaveBeenCalledWith('test-id');

      // Verify logging
      const businessEvents = loggerSpy.getBusinessEvents('category_deleted');
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0]).toMatchObject({
        event: 'category_deleted',
        entityId: 'test-id',
        userId: mockUserId,
        metadata: {
          categoryName: 'Test Category',
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
        type: 'category_delete',
        status: 'success',
      });
    });

    it('should throw error when category not found', async () => {
      // Arrange
      mockTypeormRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(repository.delete('non-existent-id')).rejects.toThrow(
        'Category not found',
      );

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);
      expect(loggerSpy.loggedErrors[0].message).toContain(
        'Failed to delete category',
      );

      // Verify error metrics
      expect(metricsSpy.hasRecordedMetric('api_errors_total')).toBe(true);
      const errorMetrics = metricsSpy.getMetricsByFilter('api_errors_total');
      expect(errorMetrics[0].labels.endpoint).toBe(
        'category_repository_delete',
      );
    });

    it('should throw error when delete operation affects no rows', async () => {
      // Arrange - Category exists but delete operation fails to affect any rows
      mockTypeormRepository.findOne.mockResolvedValue(
        mockCategoryEntity as any,
      );
      mockTypeormRepository.delete.mockResolvedValue({ affected: 0 } as any);

      // Act & Assert
      await expect(repository.delete('test-id')).rejects.toThrow(
        'Category not found',
      );

      // Verify that findOne was called first
      expect(mockTypeormRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });

      // Verify that delete was attempted
      expect(mockTypeormRepository.delete).toHaveBeenCalledWith('test-id');

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);
      expect(loggerSpy.loggedErrors[0].message).toContain(
        'Failed to delete category',
      );

      // Verify error metrics
      expect(metricsSpy.hasRecordedMetric('api_errors_total')).toBe(true);
      const errorMetrics = metricsSpy.getMetricsByFilter('api_errors_total');
      expect(errorMetrics[0].labels.endpoint).toBe(
        'category_repository_delete',
      );
    });

    it('should handle database errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockTypeormRepository.findOne.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.delete('test-id')).rejects.toThrow();

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);
      expect(loggerSpy.loggedErrors[0].message).toContain(
        'Failed to delete category',
      );

      // Verify error metrics
      expect(metricsSpy.hasRecordedMetric('api_errors_total')).toBe(true);
    });
  });
});
