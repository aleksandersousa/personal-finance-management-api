import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { TypeormCategoryRepository } from '@infra/db/typeorm/repositories/typeorm-category.repository';
import { CategoryEntity } from '@infra/db/typeorm/entities/category.entity';
import { LoggerSpy } from '../../../../mocks/logging/logger.spy';
import { MetricsSpy } from '../../../../mocks/metrics/metrics.spy';
import {
  Category,
  CategoryType,
  CategoryCreateData,
} from '@domain/models/category.model';

describe('TypeormCategoryRepository - create', () => {
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

  const mockCategory: Category = {
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

  describe('create', () => {
    it('should create category successfully', async () => {
      // Arrange
      const categoryData: CategoryCreateData = {
        name: 'Test Category',
        description: 'Test Description',
        type: CategoryType.INCOME,
        color: '#4CAF50',
        icon: 'work',
        userId: mockUserId,
      };

      mockTypeormRepository.create.mockReturnValue(mockCategoryEntity as any);
      mockTypeormRepository.save.mockResolvedValue(mockCategoryEntity as any);

      // Act
      const result = await repository.create(categoryData);

      // Assert
      expect(result).toMatchObject(mockCategory);
      expect(mockTypeormRepository.create).toHaveBeenCalledWith({
        name: categoryData.name,
        description: categoryData.description,
        type: categoryData.type,
        color: categoryData.color,
        icon: categoryData.icon,
        userId: categoryData.userId,
        isDefault: false,
      });
      expect(mockTypeormRepository.save).toHaveBeenCalledWith(
        mockCategoryEntity,
      );

      // Verify logging
      const businessEvents = loggerSpy.getBusinessEvents('category_created');
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0]).toMatchObject({
        event: 'category_created',
        entityId: result.id,
        userId: mockUserId,
        metadata: {
          categoryName: 'Test Category',
          categoryType: CategoryType.INCOME,
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
        type: 'category_create',
        status: 'success',
      });
    });

    it('should create category with minimal data', async () => {
      // Arrange
      const categoryData: CategoryCreateData = {
        name: 'Minimal Category',
        type: CategoryType.EXPENSE,
        userId: mockUserId,
      };

      const minimalEntity = {
        ...mockCategoryEntity,
        name: 'Minimal Category',
        type: CategoryType.EXPENSE,
        description: null,
        color: null,
        icon: null,
        userId: mockUserId,
      };

      mockTypeormRepository.create.mockReturnValue(minimalEntity as any);
      mockTypeormRepository.save.mockResolvedValue(minimalEntity as any);

      // Act
      const result = await repository.create(categoryData);

      // Assert
      expect(result.name).toBe(categoryData.name);
      expect(result.description).toBeNull();
      expect(result.type).toBe(categoryData.type);
      expect(result.color).toBeNull();
      expect(result.icon).toBeNull();
      expect(result.userId).toBe(categoryData.userId);
      expect(result.isDefault).toBe(false);
    });

    it('should handle database errors and log them', async () => {
      // Arrange
      const categoryData: CategoryCreateData = {
        name: 'Test Category',
        type: CategoryType.INCOME,
        userId: mockUserId,
      };

      const error = new Error('Database connection error');
      mockTypeormRepository.create.mockReturnValue(mockCategoryEntity as any);
      mockTypeormRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.create(categoryData)).rejects.toThrow();

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);
      const lastError = loggerSpy.loggedErrors[0];
      expect(lastError.message).toContain('Failed to create category');

      // Verify error metrics
      expect(metricsSpy.hasRecordedMetric('api_errors_total')).toBe(true);
      const errorMetrics = metricsSpy.getMetricsByFilter('api_errors_total');
      expect(errorMetrics[0].labels).toMatchObject({
        endpoint: 'category_repository_create',
      });
    });
  });
});
