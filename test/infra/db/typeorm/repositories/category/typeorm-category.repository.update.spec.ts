import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { TypeormCategoryRepository } from '@infra/db/typeorm/repositories/typeorm-category.repository';
import { CategoryEntity } from '@infra/db/typeorm/entities/category.entity';
import { LoggerSpy } from '../../../../mocks/logging/logger.spy';
import { MetricsSpy } from '../../../../mocks/metrics/metrics.spy';
import {
  CategoryType,
  CategoryUpdateData,
} from '@domain/models/category.model';

describe('TypeormCategoryRepository - update', () => {
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

  describe('update', () => {
    it('should update category successfully', async () => {
      // Arrange
      const updateData: CategoryUpdateData = {
        name: 'Updated Category',
        description: 'Updated Description',
        color: '#FF5722',
        icon: 'updated',
      };

      const updatedEntity = {
        ...mockCategoryEntity,
        ...updateData,
        updatedAt: new Date('2023-01-02'),
      };

      mockTypeormRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockTypeormRepository.findOne.mockResolvedValue(updatedEntity as any);

      // Act
      const result = await repository.update('test-id', updateData);

      // Assert
      expect(result.name).toBe(updateData.name);
      expect(result.description).toBe(updateData.description);
      expect(result.color).toBe(updateData.color);
      expect(result.icon).toBe(updateData.icon);
      expect(mockTypeormRepository.update).toHaveBeenCalledWith('test-id', {
        name: updateData.name,
        description: updateData.description,
        color: updateData.color,
        icon: updateData.icon,
      });

      // Verify logging
      const businessEvents = loggerSpy.getBusinessEvents('category_updated');
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0]).toMatchObject({
        event: 'category_updated',
        entityId: 'test-id',
        userId: mockUserId,
        metadata: {
          updatedFields: ['name', 'description', 'color', 'icon'],
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
        type: 'category_update',
        status: 'success',
      });
    });

    it('should update only provided fields', async () => {
      // Arrange
      const updateData: CategoryUpdateData = {
        name: 'Only Name Updated',
      };

      const updatedEntity = {
        ...mockCategoryEntity,
        name: 'Only Name Updated',
      };

      mockTypeormRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockTypeormRepository.findOne.mockResolvedValue(updatedEntity as any);

      // Act
      const result = await repository.update('test-id', updateData);

      // Assert
      expect(result.name).toBe(updateData.name);
      expect(mockTypeormRepository.update).toHaveBeenCalledWith('test-id', {
        name: 'Only Name Updated',
      });

      // Verify logging metadata
      const businessEvents = loggerSpy.getBusinessEvents('category_updated');
      expect(businessEvents[0].metadata.updatedFields).toEqual(['name']);
    });

    it('should handle undefined values in update data', async () => {
      // Arrange
      const updateData: CategoryUpdateData = {
        name: 'Updated Name',
        description: undefined,
        color: undefined,
        icon: undefined,
      };

      const updatedEntity = {
        ...mockCategoryEntity,
        name: 'Updated Name',
      };

      mockTypeormRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockTypeormRepository.findOne.mockResolvedValue(updatedEntity as any);

      // Act
      const result = await repository.update('test-id', updateData);

      // Assert
      expect(result.name).toBe(updateData.name);
      expect(mockTypeormRepository.update).toHaveBeenCalledWith(
        'test-id',
        { name: 'Updated Name' }, // undefined values should be filtered out
      );
    });

    it('should throw error when category not found', async () => {
      // Arrange
      const updateData: CategoryUpdateData = {
        name: 'Updated Category',
      };

      mockTypeormRepository.update.mockResolvedValue({ affected: 0 } as any);

      // Act & Assert
      await expect(
        repository.update('non-existent-id', updateData),
      ).rejects.toThrow('Category not found');

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);
      expect(loggerSpy.loggedErrors[0].message).toContain(
        'Failed to update category',
      );

      // Verify error metrics
      expect(metricsSpy.hasRecordedMetric('api_errors_total')).toBe(true);
      const errorMetrics = metricsSpy.getMetricsByFilter('api_errors_total');
      expect(errorMetrics[0].labels.endpoint).toBe(
        'category_repository_update',
      );
    });

    it('should handle scenario where category is not found after update', async () => {
      // Arrange
      const updateData: CategoryUpdateData = {
        name: 'Updated Category',
      };

      mockTypeormRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockTypeormRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(repository.update('test-id', updateData)).rejects.toThrow(
        'Category not found after update',
      );

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);
      expect(loggerSpy.loggedErrors[0].message).toContain(
        'Failed to update category',
      );

      // Verify error metrics
      expect(metricsSpy.hasRecordedMetric('api_errors_total')).toBe(true);
    });

    it('should handle database errors', async () => {
      // Arrange
      const updateData: CategoryUpdateData = {
        name: 'Updated Category',
      };
      const error = new Error('Database error');
      mockTypeormRepository.update.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.update('test-id', updateData)).rejects.toThrow();

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);
      expect(loggerSpy.loggedErrors[0].message).toContain(
        'Failed to update category',
      );

      // Verify error metrics
      expect(metricsSpy.hasRecordedMetric('api_errors_total')).toBe(true);
    });

    it('should handle non-Error rejection from update call', async () => {
      (mockTypeormRepository.update as any).mockRejectedValue('boom');
      await expect(repository.update('id', { name: 'n' })).rejects.toBe('boom');
    });

    it('update catch path when findOne throws after update', async () => {
      mockTypeormRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockTypeormRepository.findOne.mockRejectedValue(new Error('db err'));
      await expect(repository.update('id', { name: 'n' })).rejects.toThrow(
        'db err',
      );
    });
  });
});
