import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { TypeormCategoryRepository } from '@infra/db/typeorm/repositories/typeorm-category.repository';
import { CategoryEntity } from '@infra/db/typeorm/entities/category.entity';
import { LoggerSpy } from '../../../../mocks/logging/logger.spy';
import { MetricsSpy } from '../../../../mocks/metrics/metrics.spy';
import { CategoryType } from '@domain/models/category.model';

describe('TypeormCategoryRepository - findByUserId', () => {
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

  describe('findByUserId', () => {
    it('should find categories by user id successfully', async () => {
      // Arrange
      const categories = [
        { ...mockCategoryEntity, name: 'Category 1' },
        {
          ...mockCategoryEntity,
          name: 'Category 2',
          type: CategoryType.EXPENSE,
        },
      ];
      mockTypeormRepository.find.mockResolvedValue(categories as any);

      // Act
      const result = await repository.findByUserId(mockUserId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every(cat => cat.userId === mockUserId)).toBe(true);
      expect(mockTypeormRepository.find).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        order: { name: 'ASC' },
      });

      // Verify metrics
      expect(metricsSpy.hasRecordedMetric('financial_transactions_total')).toBe(
        true,
      );
      const transactionMetrics = metricsSpy.getMetricsByFilter(
        'financial_transactions_total',
      );
      expect(transactionMetrics[0].labels).toMatchObject({
        type: 'category_find_by_user_id',
        status: 'success',
      });
    });

    it('should return empty array when no categories found', async () => {
      // Arrange
      mockTypeormRepository.find.mockResolvedValue([]);

      // Act
      const result = await repository.findByUserId('non-existent-user');

      // Assert
      expect(result).toEqual([]);
      expect(metricsSpy.hasRecordedMetric('financial_transactions_total')).toBe(
        true,
      );
    });

    it('should handle database errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockTypeormRepository.find.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.findByUserId(mockUserId)).rejects.toThrow();

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);
      expect(loggerSpy.loggedErrors[0].message).toContain(
        'Failed to find categories by userId',
      );

      // Verify error metrics
      expect(metricsSpy.hasRecordedMetric('api_errors_total')).toBe(true);
      const errorMetrics = metricsSpy.getMetricsByFilter('api_errors_total');
      expect(errorMetrics[0].labels.endpoint).toBe(
        'category_repository_find_by_user_id',
      );
    });

    it('should log and rethrow on error', async () => {
      mockTypeormRepository.find.mockRejectedValue('err');
      await expect(repository.findByUserId('u')).rejects.toBe('err');
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);
      expect(metricsSpy.hasRecordedMetric('api_errors_total')).toBe(true);
    });

    it('findByUserId without metrics should return mapped categories', async () => {
      const baseEntity = {
        id: 'id1',
        name: 'Name',
        description: 'Desc',
        type: CategoryType.EXPENSE,
        color: '#000',
        icon: 'i',
        userId: 'user-1',
        isDefault: false,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        deletedAt: null as any,
        entries: [],
      } as any;

      // Create repository without metrics
      const repositoryWithoutMetrics = new TypeormCategoryRepository(
        mockTypeormRepository,
        loggerSpy,
        undefined as any,
      );

      mockTypeormRepository.find.mockResolvedValue([baseEntity] as any);
      const result = await repositoryWithoutMetrics.findByUserId('user-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'id1', userId: 'user-1' });
    });
  });
});
