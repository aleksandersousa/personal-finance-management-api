import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { TypeormCategoryRepository } from '@infra/db/typeorm/repositories/typeorm-category.repository';
import { CategoryEntity } from '@infra/db/typeorm/entities/category.entity';
import { LoggerSpy } from '../../../mocks/logging/logger.spy';
import { MetricsSpy } from '../../../mocks/metrics/metrics.spy';
import {
  Category,
  CategoryType,
  CategoryCreateData,
  CategoryUpdateData,
  CategoryListFilters,
} from '@domain/models/category.model';

describe('TypeormCategoryRepository', () => {
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

  describe('findById', () => {
    it('should find category by id successfully', async () => {
      // Arrange
      mockTypeormRepository.findOne.mockResolvedValue(
        mockCategoryEntity as any,
      );

      // Act
      const result = await repository.findById('test-id');

      // Assert
      expect(result).toMatchObject(mockCategory);
      expect(mockTypeormRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });

      // Verify metrics
      expect(metricsSpy.hasRecordedMetric('financial_transactions_total')).toBe(
        true,
      );
      const transactionMetrics = metricsSpy.getMetricsByFilter(
        'financial_transactions_total',
      );
      expect(transactionMetrics[0].labels).toMatchObject({
        type: 'category_find_by_id',
        status: 'success',
      });
    });

    it('should return null when category not found', async () => {
      // Arrange
      mockTypeormRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findById('non-existent-id');

      // Assert
      expect(result).toBeNull();
      expect(metricsSpy.hasRecordedMetric('financial_transactions_total')).toBe(
        true,
      );
    });

    it('should handle database errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockTypeormRepository.findOne.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.findById('any-id')).rejects.toThrow();

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);
      expect(loggerSpy.loggedErrors[0].message).toContain(
        'Failed to find category by id',
      );

      // Verify error metrics
      expect(metricsSpy.hasRecordedMetric('api_errors_total')).toBe(true);
      const errorMetrics = metricsSpy.getMetricsByFilter('api_errors_total');
      expect(errorMetrics[0].labels.endpoint).toBe(
        'category_repository_find_by_id',
      );
    });
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
  });

  describe('findByUserIdAndType', () => {
    it('should find categories by user id and type successfully', async () => {
      // Arrange
      const categories = [
        {
          ...mockCategoryEntity,
          name: 'Income Category',
          type: CategoryType.INCOME,
        },
      ];
      mockTypeormRepository.find.mockResolvedValue(categories as any);

      // Act
      const result = await repository.findByUserIdAndType(
        mockUserId,
        CategoryType.INCOME,
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(CategoryType.INCOME);
      expect(mockTypeormRepository.find).toHaveBeenCalledWith({
        where: { userId: mockUserId, type: CategoryType.INCOME },
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
        type: 'category_find_by_user_id_and_type',
        status: 'success',
      });
    });

    it('should return empty array when no matching categories found', async () => {
      // Arrange
      mockTypeormRepository.find.mockResolvedValue([]);

      // Act
      const result = await repository.findByUserIdAndType(
        'non-existent-user',
        CategoryType.INCOME,
      );

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockTypeormRepository.find.mockRejectedValue(error);

      // Act & Assert
      await expect(
        repository.findByUserIdAndType(mockUserId, CategoryType.INCOME),
      ).rejects.toThrow();

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);
      expect(loggerSpy.loggedErrors[0].message).toContain(
        'Failed to find categories by userId and type',
      );

      // Verify error metrics
      expect(metricsSpy.hasRecordedMetric('api_errors_total')).toBe(true);
      const errorMetrics = metricsSpy.getMetricsByFilter('api_errors_total');
      expect(errorMetrics[0].labels.endpoint).toBe(
        'category_repository_find_by_user_id_and_type',
      );
    });
  });

  describe('findByUserIdAndName', () => {
    it('should find category by user id and name successfully', async () => {
      // Arrange
      mockTypeormRepository.findOne.mockResolvedValue(
        mockCategoryEntity as any,
      );

      // Act
      const result = await repository.findByUserIdAndName(
        mockUserId,
        'Test Category',
      );

      // Assert
      expect(result).toMatchObject(mockCategory);
      expect(mockTypeormRepository.findOne).toHaveBeenCalledWith({
        where: { userId: mockUserId, name: 'Test Category' },
      });

      // Verify metrics
      expect(metricsSpy.hasRecordedMetric('financial_transactions_total')).toBe(
        true,
      );
      const transactionMetrics = metricsSpy.getMetricsByFilter(
        'financial_transactions_total',
      );
      expect(transactionMetrics[0].labels).toMatchObject({
        type: 'category_find_by_user_id_and_name',
        status: 'success',
      });
    });

    it('should return null when category not found', async () => {
      // Arrange
      mockTypeormRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findByUserIdAndName(
        mockUserId,
        'Non-existent Category',
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockTypeormRepository.findOne.mockRejectedValue(error);

      // Act & Assert
      await expect(
        repository.findByUserIdAndName(mockUserId, 'Any Category'),
      ).rejects.toThrow();

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);
      expect(loggerSpy.loggedErrors[0].message).toContain(
        'Failed to find category by userId and name',
      );

      // Verify error metrics
      expect(metricsSpy.hasRecordedMetric('api_errors_total')).toBe(true);
      const errorMetrics = metricsSpy.getMetricsByFilter('api_errors_total');
      expect(errorMetrics[0].labels.endpoint).toBe(
        'category_repository_find_by_user_id_and_name',
      );
    });
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

      // Act
      const result = await repository.findWithFilters(filters);

      // Assert
      expect(result).toHaveLength(2);
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

      // Act
      const result = await repository.findWithFilters(filters);

      // Assert
      expect(result).toHaveLength(1);
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

      // Act
      const result = await repository.findWithFilters(filters);

      // Assert
      expect(result).toHaveLength(1);
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

      mockQueryBuilder.getRawAndEntities.mockResolvedValue(mockResults);

      // Act
      const result = await repository.findWithFilters(filters);

      // Assert
      expect(result).toHaveLength(1);
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
      expect((result[0] as any).entriesCount).toBe(5);
      expect((result[0] as any).totalAmount).toBe(100.5);
      expect((result[0] as any).lastUsed).toEqual(new Date('2023-12-01'));
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

      // Act
      const result = await repository.findWithFilters(filters);

      // Assert
      expect(result).toHaveLength(1);
      expect(mockQueryBuilder.leftJoin).not.toHaveBeenCalled();
      expect(result[0]).not.toHaveProperty('entriesCount');
      expect(result[0]).not.toHaveProperty('totalAmount');
      expect(result[0]).not.toHaveProperty('lastUsed');
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

      mockQueryBuilder.getRawAndEntities.mockResolvedValue(mockResults);

      // Act
      const result = await repository.findWithFilters(filters);

      // Assert
      expect(result).toHaveLength(1);
      expect((result[0] as any).entriesCount).toBe(0);
      expect((result[0] as any).totalAmount).toBe(0);
      expect((result[0] as any).lastUsed).toBeNull();
      expect(typeof (result[0] as any).entriesCount).toBe('number');
      expect(typeof (result[0] as any).totalAmount).toBe('number');
    });

    it('should handle database errors', async () => {
      // Arrange
      const filters: CategoryListFilters = {
        userId: mockUserId,
      };
      const error = new Error('Database error');
      mockQueryBuilder.getRawAndEntities.mockRejectedValue(error);

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

  describe('mapToModel (private method coverage)', () => {
    it('should map entity to model correctly through public methods', async () => {
      // Arrange
      const categoryData: CategoryCreateData = {
        name: 'Test Mapping',
        description: 'Test Description',
        type: CategoryType.INCOME,
        color: '#4CAF50',
        icon: 'work',
        userId: mockUserId,
      };

      const entityWithAllFields = {
        ...mockCategoryEntity,
        ...categoryData,
      };

      mockTypeormRepository.create.mockReturnValue(entityWithAllFields as any);
      mockTypeormRepository.save.mockResolvedValue(entityWithAllFields as any);

      // Act
      const result = await repository.create(categoryData);

      // Assert - This tests the private mapToModel method indirectly
      expect(result).toMatchObject({
        id: expect.any(String),
        name: 'Test Mapping',
        description: 'Test Description',
        type: CategoryType.INCOME,
        color: '#4CAF50',
        icon: 'work',
        userId: mockUserId,
        isDefault: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });
});
