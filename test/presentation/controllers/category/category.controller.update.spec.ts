import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from '../../../../src/presentation/controllers/category.controller';
import { UpdateCategoryUseCaseMockFactory } from '../../../domain/mocks/usecases/update-category.mock';
import { LoggerSpy } from '../../../infra/mocks/logging/logger.spy';
import { MetricsSpy } from '../../../infra/mocks/metrics/metrics.spy';
import { RequestMockFactory } from '../../mocks/controllers/request.mock';
import { MockCategoryFactory } from '../../../domain/mocks/models/category.mock';
import { UpdateCategoryUseCase } from '@domain/usecases/update-category.usecase';

describe('CategoryController - update', () => {
  let controller: CategoryController;
  let updateCategoryUseCase: jest.Mocked<UpdateCategoryUseCase>;
  let loggerSpy: LoggerSpy;
  let metricsSpy: MetricsSpy;

  beforeEach(async () => {
    updateCategoryUseCase = UpdateCategoryUseCaseMockFactory.createSuccess();
    loggerSpy = new LoggerSpy();
    metricsSpy = new MetricsSpy();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        { provide: 'AddCategoryUseCase', useValue: { execute: jest.fn() } },
        { provide: 'ListCategoriesUseCase', useValue: { execute: jest.fn() } },
        { provide: 'UpdateCategoryUseCase', useValue: updateCategoryUseCase },
        { provide: 'Logger', useValue: loggerSpy },
        { provide: 'Metrics', useValue: metricsSpy },
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
  });

  afterEach(() => {
    loggerSpy.clear();
    metricsSpy.clear();
    jest.clearAllMocks();
  });

  describe('update', () => {
    it('should update category and log business event', async () => {
      // Arrange
      const updateDto = {
        name: 'Updated Category Name',
        description: 'Updated description',
        color: '#FF5722',
        icon: 'updated_icon',
      };
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const expectedCategory = MockCategoryFactory.create({
        id: 'category-456',
        name: 'Updated Category Name',
        description: 'Updated description',
        color: '#FF5722',
        icon: 'updated_icon',
        userId: 'user-123',
      });

      updateCategoryUseCase.execute.mockResolvedValue(expectedCategory);

      // Act
      const result = await controller.update(
        'category-456',
        updateDto,
        mockRequest,
      );

      // Assert
      expect(result).toEqual({
        id: expectedCategory.id,
        name: expectedCategory.name,
        description: expectedCategory.description,
        type: expectedCategory.type,
        color: expectedCategory.color,
        icon: expectedCategory.icon,
        userId: expectedCategory.userId,
        isDefault: expectedCategory.isDefault,
        createdAt: expectedCategory.createdAt,
        updatedAt: expectedCategory.updatedAt,
      });

      expect(updateCategoryUseCase.execute).toHaveBeenCalledWith({
        id: 'category-456',
        userId: 'user-123',
        name: 'Updated Category Name',
        description: 'Updated description',
        color: '#FF5722',
        icon: 'updated_icon',
      });

      // Verify business event logging
      const businessEvents = loggerSpy.getBusinessEvents(
        'category_api_update_success',
      );
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0]).toMatchObject({
        event: 'category_api_update_success',
        entityId: 'category-456',
        userId: 'user-123',
        traceId: 'trace-123',
        metadata: {
          categoryName: 'Updated Category Name',
          updatedFields: ['name', 'description', 'color', 'icon'],
        },
      });

      // Verify metrics
      expect(
        metricsSpy.hasRecordedMetric('http_request_duration_seconds'),
      ).toBe(true);
      const httpMetrics = metricsSpy.getMetricsByFilter(
        'http_request_duration_seconds',
      );
      expect(httpMetrics[0].labels).toMatchObject({
        method: 'PUT',
        route: '/categories/category-456',
      });
    });

    it('should update category with partial data', async () => {
      // Arrange
      const updateDto = {
        name: 'Only Name Updated',
      };
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const expectedCategory = MockCategoryFactory.create({
        id: 'category-456',
        name: 'Only Name Updated',
        userId: 'user-123',
      });

      updateCategoryUseCase.execute.mockResolvedValue(expectedCategory);

      // Act
      const result = await controller.update(
        'category-456',
        updateDto,
        mockRequest,
      );

      // Assert
      expect(result.name).toBe('Only Name Updated');

      expect(updateCategoryUseCase.execute).toHaveBeenCalledWith({
        id: 'category-456',
        userId: 'user-123',
        name: 'Only Name Updated',
      });

      // Verify logging metadata shows only updated field
      const businessEvents = loggerSpy.getBusinessEvents(
        'category_api_update_success',
      );
      expect(businessEvents[0].metadata.updatedFields).toEqual(['name']);
    });

    it('should handle validation errors and log security event', async () => {
      // Arrange
      const updateDto = {
        name: '', // Invalid: empty name
      };
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const error = new Error('Category name cannot be empty');

      updateCategoryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.update('category-456', updateDto, mockRequest),
      ).rejects.toThrow(error);

      // Verify security event logging
      const securityEvents = loggerSpy.getSecurityEvents('medium');
      expect(securityEvents).toHaveLength(1);
      expect(securityEvents[0]).toMatchObject({
        event: 'category_api_update_failed',
        severity: 'medium',
        userId: 'user-123',
        error: 'Category name cannot be empty',
        traceId: 'trace-123',
        message: 'Failed to update category: category-456',
        endpoint: '/categories/category-456',
      });

      // Verify error metrics
      const errorMetrics = metricsSpy.getMetricsByFilter(
        'http_request_duration_seconds',
      );
      expect(errorMetrics.some(m => m.labels?.method === 'PUT')).toBe(true);

      const apiErrorMetrics = metricsSpy.getMetricsByFilter('api_errors_total');
      expect(apiErrorMetrics).toHaveLength(1);
      expect(apiErrorMetrics[0].labels).toMatchObject({
        endpoint: 'categories',
        error_type: 'Category name cannot be empty',
      });
    });

    it('should handle not found errors', async () => {
      // Arrange
      const updateDto = {
        name: 'Updated Name',
      };
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const error = new Error('Category not found');

      updateCategoryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.update('non-existent', updateDto, mockRequest),
      ).rejects.toThrow(error);

      // Verify security event logging
      const securityEvents = loggerSpy.getSecurityEvents('medium');
      expect(securityEvents).toHaveLength(1);
      expect(securityEvents[0]).toMatchObject({
        event: 'category_api_update_failed',
        userId: 'user-123',
        error: 'Category not found',
        message: 'Failed to update category: non-existent',
        endpoint: '/categories/non-existent',
      });
    });

    it('should handle unauthorized access attempts', async () => {
      // Arrange
      const updateDto = {
        name: 'Updated Name',
      };
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const error = new Error('You can only update your own categories');

      updateCategoryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.update('other-user-category', updateDto, mockRequest),
      ).rejects.toThrow(error);

      // Verify security event logging for unauthorized access
      const securityEvents = loggerSpy.getSecurityEvents('medium');
      expect(securityEvents).toHaveLength(1);
      expect(securityEvents[0]).toMatchObject({
        event: 'category_api_update_failed',
        error: 'You can only update your own categories',
        userId: 'user-123',
      });
    });

    it('should handle default category update attempts', async () => {
      // Arrange
      const updateDto = {
        name: 'Updated Default Category',
      };
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const error = new Error('Cannot update default categories');

      updateCategoryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.update('default-category', updateDto, mockRequest),
      ).rejects.toThrow(error);

      // Verify security event logging
      const securityEvents = loggerSpy.getSecurityEvents('medium');
      expect(securityEvents).toHaveLength(1);
      expect(securityEvents[0]).toMatchObject({
        event: 'category_api_update_failed',
        error: 'Cannot update default categories',
        userId: 'user-123',
      });
    });

    it('should handle duplicate name errors', async () => {
      // Arrange
      const updateDto = {
        name: 'Existing Category Name',
      };
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const error = new Error('Category name already exists for this user');

      updateCategoryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.update('category-456', updateDto, mockRequest),
      ).rejects.toThrow(error);

      // Verify security event logging
      const securityEvents = loggerSpy.getSecurityEvents('medium');
      expect(securityEvents).toHaveLength(1);
      expect(securityEvents[0]).toMatchObject({
        event: 'category_api_update_failed',
        error: 'Category name already exists for this user',
        userId: 'user-123',
      });
    });

    it('should record performance metrics correctly', async () => {
      // Arrange
      const updateDto = {
        name: 'Performance Test Category',
      };
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const expectedCategory = MockCategoryFactory.create({
        id: 'category-456',
        name: 'Performance Test Category',
        userId: 'user-123',
      });

      updateCategoryUseCase.execute.mockResolvedValue(expectedCategory);

      // Act
      await controller.update('category-456', updateDto, mockRequest);

      // Assert - verify performance metrics
      expect(
        metricsSpy.hasRecordedMetric('http_request_duration_seconds'),
      ).toBe(true);

      const httpMetrics = metricsSpy.getMetricsByFilter(
        'http_request_duration_seconds',
      );
      expect(httpMetrics).toHaveLength(1);
      expect(httpMetrics[0].labels).toMatchObject({
        method: 'PUT',
        route: '/categories/category-456',
      });
    });

    it('should handle empty update data gracefully', async () => {
      // Arrange
      const updateDto = {}; // Empty update
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const expectedCategory = MockCategoryFactory.create({
        id: 'category-456',
        userId: 'user-123',
      });

      updateCategoryUseCase.execute.mockResolvedValue(expectedCategory);

      // Act
      const result = await controller.update(
        'category-456',
        updateDto,
        mockRequest,
      );

      // Assert
      expect(result).toBeDefined();
      expect(updateCategoryUseCase.execute).toHaveBeenCalledWith({
        id: 'category-456',
        userId: 'user-123',
      });

      // Verify logging shows no updated fields
      const businessEvents = loggerSpy.getBusinessEvents(
        'category_api_update_success',
      );
      expect(businessEvents[0].metadata.updatedFields).toEqual([]);
    });

    it('should handle internal server errors and log appropriately', async () => {
      // Arrange
      const updateDto = {
        name: 'Test Category',
      };
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const error = new Error('Internal server error');

      updateCategoryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.update('category-456', updateDto, mockRequest),
      ).rejects.toThrow(error);

      // Verify security event logging
      const securityEvents = loggerSpy.getSecurityEvents('medium');
      expect(securityEvents).toHaveLength(1);
      expect(securityEvents[0].error).toBe('Internal server error');

      // Verify error metrics
      const errorMetrics = metricsSpy.getMetricsByFilter('api_errors_total');
      expect(errorMetrics).toHaveLength(1);
      expect(errorMetrics[0].labels.error_type).toBe('Internal server error');
    });
  });
});
