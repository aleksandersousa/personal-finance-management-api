import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from '../../../../src/presentation/controllers/category.controller';
import { DeleteCategoryUseCaseMockFactory } from '../../../domain/mocks/usecases/delete-category.mock';
import { LoggerSpy } from '../../../infra/mocks/logging/logger.spy';
import { MetricsSpy } from '../../../infra/mocks/metrics/metrics.spy';
import { RequestMockFactory } from '../../../presentation/mocks/controllers/request.mock';
import { DeleteCategoryUseCase } from '../../../../src/domain/usecases/delete-category.usecase';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('CategoryController - delete', () => {
  let controller: CategoryController;
  let deleteCategoryUseCase: jest.Mocked<DeleteCategoryUseCase>;
  let loggerSpy: LoggerSpy;
  let metricsSpy: MetricsSpy;

  beforeEach(async () => {
    deleteCategoryUseCase = DeleteCategoryUseCaseMockFactory.createSuccess();
    loggerSpy = new LoggerSpy();
    metricsSpy = new MetricsSpy();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        { provide: 'AddCategoryUseCase', useValue: {} },
        { provide: 'ListCategoriesUseCase', useValue: {} },
        { provide: 'UpdateCategoryUseCase', useValue: {} },
        { provide: 'DeleteCategoryUseCase', useValue: deleteCategoryUseCase },
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

  describe('delete', () => {
    it('should delete category and log business event', async () => {
      // Arrange
      const categoryId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const expectedResponse = { deletedAt: new Date('2025-06-01T15:30:00Z') };

      deleteCategoryUseCase.execute.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.delete(
        categoryId,
        mockRequest.user,
        mockRequest,
      );

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(deleteCategoryUseCase.execute).toHaveBeenCalledWith({
        id: categoryId,
        userId: 'user-123',
      });

      // Verify business event logging
      const businessEvents = loggerSpy.getBusinessEvents(
        'category_api_delete_success',
      );
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0]).toMatchObject({
        entityId: categoryId,
        userId: 'user-123',
        traceId: 'trace-123',
        deletedAt: expectedResponse.deletedAt.toISOString(),
      });

      // Verify metrics
      expect(
        metricsSpy.hasRecordedMetric('http_request_duration_seconds'),
      ).toBe(true);
      const httpMetrics = metricsSpy.getMetricsByFilter(
        'http_request_duration_seconds',
      );
      expect(httpMetrics[0].labels).toMatchObject({
        method: 'DELETE',
        route: `/categories/${categoryId}`,
      });

      // Verify HTTP request counter with status code
      expect(
        metricsSpy.hasRecordedHttpRequest(
          'DELETE',
          `/categories/${categoryId}`,
          200,
        ),
      ).toBe(true);
    });

    it('should throw NotFoundException when category not found', async () => {
      // Arrange
      const categoryId = 'non-existent-id';
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const notFoundUseCase =
        DeleteCategoryUseCaseMockFactory.createNotFoundFailure();

      const module: TestingModule = await Test.createTestingModule({
        controllers: [CategoryController],
        providers: [
          { provide: 'AddCategoryUseCase', useValue: {} },
          { provide: 'ListCategoriesUseCase', useValue: {} },
          { provide: 'UpdateCategoryUseCase', useValue: {} },
          { provide: 'DeleteCategoryUseCase', useValue: notFoundUseCase },
          { provide: 'Logger', useValue: loggerSpy },
          { provide: 'Metrics', useValue: metricsSpy },
        ],
      }).compile();

      const testController = module.get<CategoryController>(CategoryController);

      // Act & Assert
      await expect(
        testController.delete(categoryId, mockRequest.user, mockRequest),
      ).rejects.toThrow(NotFoundException);

      // Verify security event logging
      const securityEvents = loggerSpy.getSecurityEvents('medium');
      expect(securityEvents).toHaveLength(1);
      expect(securityEvents[0]).toMatchObject({
        event: 'category_api_delete_failed',
        userId: 'user-123',
        error: 'Category not found',
      });

      // Verify error metrics
      const errorMetrics = metricsSpy.getMetricsByFilter('http_requests_total');
      expect(errorMetrics.some(m => m.labels.status_code === '404')).toBe(true);
    });

    it('should throw ForbiddenException when trying to delete default category', async () => {
      // Arrange
      const categoryId = 'default-category-id';
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const defaultCategoryUseCase =
        DeleteCategoryUseCaseMockFactory.createDefaultCategoryFailure();

      const module: TestingModule = await Test.createTestingModule({
        controllers: [CategoryController],
        providers: [
          { provide: 'AddCategoryUseCase', useValue: {} },
          { provide: 'ListCategoriesUseCase', useValue: {} },
          { provide: 'UpdateCategoryUseCase', useValue: {} },
          {
            provide: 'DeleteCategoryUseCase',
            useValue: defaultCategoryUseCase,
          },
          { provide: 'Logger', useValue: loggerSpy },
          { provide: 'Metrics', useValue: metricsSpy },
        ],
      }).compile();

      const testController = module.get<CategoryController>(CategoryController);

      // Act & Assert
      await expect(
        testController.delete(categoryId, mockRequest.user, mockRequest),
      ).rejects.toThrow(ForbiddenException);

      // Verify security event logging
      const securityEvents = loggerSpy.getSecurityEvents('medium');
      expect(securityEvents).toHaveLength(1);
      expect(securityEvents[0]).toMatchObject({
        event: 'category_api_delete_failed',
        userId: 'user-123',
        error: 'Cannot delete default categories',
      });

      // Verify error metrics
      const errorMetrics = metricsSpy.getMetricsByFilter('http_requests_total');
      expect(errorMetrics.some(m => m.labels.status_code === '403')).toBe(true);
    });

    it('should throw ForbiddenException when trying to delete category with entries', async () => {
      // Arrange
      const categoryId = 'category-with-entries';
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const hasEntriesUseCase =
        DeleteCategoryUseCaseMockFactory.createHasEntriesFailure();

      const module: TestingModule = await Test.createTestingModule({
        controllers: [CategoryController],
        providers: [
          { provide: 'AddCategoryUseCase', useValue: {} },
          { provide: 'ListCategoriesUseCase', useValue: {} },
          { provide: 'UpdateCategoryUseCase', useValue: {} },
          { provide: 'DeleteCategoryUseCase', useValue: hasEntriesUseCase },
          { provide: 'Logger', useValue: loggerSpy },
          { provide: 'Metrics', useValue: metricsSpy },
        ],
      }).compile();

      const testController = module.get<CategoryController>(CategoryController);

      // Act & Assert
      await expect(
        testController.delete(categoryId, mockRequest.user, mockRequest),
      ).rejects.toThrow(ForbiddenException);

      // Verify security event logging
      const securityEvents = loggerSpy.getSecurityEvents('medium');
      expect(securityEvents).toHaveLength(1);
      expect(securityEvents[0]).toMatchObject({
        event: 'category_api_delete_failed',
        userId: 'user-123',
        error: 'Cannot delete category with existing entries',
      });
    });

    it('should throw ForbiddenException when trying to delete another user category', async () => {
      // Arrange
      const categoryId = 'other-user-category';
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const unauthorizedUseCase =
        DeleteCategoryUseCaseMockFactory.createUnauthorizedFailure();

      const module: TestingModule = await Test.createTestingModule({
        controllers: [CategoryController],
        providers: [
          { provide: 'AddCategoryUseCase', useValue: {} },
          { provide: 'ListCategoriesUseCase', useValue: {} },
          { provide: 'UpdateCategoryUseCase', useValue: {} },
          { provide: 'DeleteCategoryUseCase', useValue: unauthorizedUseCase },
          { provide: 'Logger', useValue: loggerSpy },
          { provide: 'Metrics', useValue: metricsSpy },
        ],
      }).compile();

      const testController = module.get<CategoryController>(CategoryController);

      // Act & Assert
      await expect(
        testController.delete(categoryId, mockRequest.user, mockRequest),
      ).rejects.toThrow(ForbiddenException);

      // Verify security event logging
      const securityEvents = loggerSpy.getSecurityEvents('medium');
      expect(securityEvents).toHaveLength(1);
      expect(securityEvents[0]).toMatchObject({
        event: 'category_api_delete_failed',
        userId: 'user-123',
        error: 'You can only delete your own categories',
      });
    });

    it('should throw BadRequestException for validation errors', async () => {
      // Arrange
      const categoryId = '';
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const validationUseCase =
        DeleteCategoryUseCaseMockFactory.createValidationFailure();

      const module: TestingModule = await Test.createTestingModule({
        controllers: [CategoryController],
        providers: [
          { provide: 'AddCategoryUseCase', useValue: {} },
          { provide: 'ListCategoriesUseCase', useValue: {} },
          { provide: 'UpdateCategoryUseCase', useValue: {} },
          { provide: 'DeleteCategoryUseCase', useValue: validationUseCase },
          { provide: 'Logger', useValue: loggerSpy },
          { provide: 'Metrics', useValue: metricsSpy },
        ],
      }).compile();

      const testController = module.get<CategoryController>(CategoryController);

      // Act & Assert
      await expect(
        testController.delete(categoryId, mockRequest.user, mockRequest),
      ).rejects.toThrow(BadRequestException);

      // Verify security event logging
      const securityEvents = loggerSpy.getSecurityEvents('medium');
      expect(securityEvents).toHaveLength(1);
      expect(securityEvents[0]).toMatchObject({
        event: 'category_api_delete_failed',
        userId: 'user-123',
        error: 'Category ID is required',
      });
    });

    it('should record performance metrics correctly', async () => {
      // Arrange
      const categoryId = 'performance-test-category';
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const expectedResponse = { deletedAt: new Date('2025-06-01T15:30:00Z') };

      deleteCategoryUseCase.execute.mockResolvedValue(expectedResponse);

      // Act
      await controller.delete(categoryId, mockRequest.user, mockRequest);

      // Assert
      // Verify HTTP request metrics
      expect(
        metricsSpy.hasRecordedMetric('http_request_duration_seconds'),
      ).toBe(true);
      const httpMetrics = metricsSpy.getMetricsByFilter(
        'http_request_duration_seconds',
      );
      expect(httpMetrics.length).toBeGreaterThan(0);
      expect(httpMetrics[0].labels).toMatchObject({
        method: 'DELETE',
        route: `/categories/${categoryId}`,
      });

      // Verify business event was logged with timing information
      const businessEvents = loggerSpy.getBusinessEvents(
        'category_api_delete_success',
      );
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0]).toHaveProperty('duration');
      expect(typeof businessEvents[0].duration).toBe('number');
    });
  });
});
