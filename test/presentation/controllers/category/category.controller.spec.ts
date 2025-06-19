import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from '../../../../src/presentation/controllers/category.controller';
import { AddCategoryUseCaseMockFactory } from '../../../domain/mocks/usecases/add-category.mock';
import { ListCategoriesUseCaseMockFactory } from '../../../domain/mocks/usecases/list-categories.mock';
import { LoggerSpy } from '../../../infra/mocks/logging/logger.spy';
import { MetricsSpy } from '../../../infra/mocks/metrics/metrics.spy';
import { RequestMockFactory } from '../../../presentation/mocks/controllers/request.mock';
import { CategoryRequestMockFactory } from '../../../presentation/mocks/controllers/category-request.mock';
import { MockCategoryFactory } from '../../../domain/mocks/models/category.mock';
import { AddCategoryUseCase } from '../../../../src/domain/usecases/add-category.usecase';
import { ListCategoriesUseCase } from '../../../../src/domain/usecases/list-categories.usecase';

describe('CategoryController', () => {
  let controller: CategoryController;
  let addCategoryUseCase: jest.Mocked<AddCategoryUseCase>;
  let listCategoriesUseCase: jest.Mocked<ListCategoriesUseCase>;
  let loggerSpy: LoggerSpy;
  let metricsSpy: MetricsSpy;

  beforeEach(async () => {
    addCategoryUseCase = AddCategoryUseCaseMockFactory.createSuccess();
    listCategoriesUseCase = ListCategoriesUseCaseMockFactory.createSuccess();
    loggerSpy = new LoggerSpy();
    metricsSpy = new MetricsSpy();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        { provide: 'AddCategoryUseCase', useValue: addCategoryUseCase },
        { provide: 'ListCategoriesUseCase', useValue: listCategoriesUseCase },
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

  describe('create', () => {
    it('should create category and log business event', async () => {
      // Arrange
      const createCategoryDto = CategoryRequestMockFactory.createValid();
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const expectedCategory = MockCategoryFactory.create();

      addCategoryUseCase.execute.mockResolvedValue(expectedCategory);

      // Act
      const result = await controller.create(createCategoryDto, mockRequest);

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

      expect(addCategoryUseCase.execute).toHaveBeenCalledWith({
        ...createCategoryDto,
        userId: 'user-123',
      });

      // Verify business event logging
      const businessEvents = loggerSpy.getBusinessEvents(
        'category_api_create_success',
      );
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0]).toMatchObject({
        event: 'category_api_create_success',
        entityId: expectedCategory.id,
        userId: 'user-123',
        traceId: 'trace-123',
        metadata: {
          categoryName: expectedCategory.name,
          categoryType: expectedCategory.type,
        },
      });

      // Verify metrics
      expect(metricsSpy.hasRecordedMetric('http_requests_total')).toBe(true);
    });

    it('should create expense category successfully', async () => {
      // Arrange
      const createCategoryDto = CategoryRequestMockFactory.createExpense();
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const expectedCategory = MockCategoryFactory.createExpenseCategory();

      addCategoryUseCase.execute.mockResolvedValue(expectedCategory);

      // Act
      const result = await controller.create(createCategoryDto, mockRequest);

      // Assert
      expect(result.type).toBe('EXPENSE');
      expect(result.name).toBe('Housing');
      expect(result.color).toBe('#F44336');
      expect(result.icon).toBe('home');

      expect(addCategoryUseCase.execute).toHaveBeenCalledWith({
        ...createCategoryDto,
        userId: 'user-123',
      });
    });

    it('should create minimal category without optional fields', async () => {
      // Arrange
      const createCategoryDto = CategoryRequestMockFactory.createMinimal();
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const expectedCategory = MockCategoryFactory.create({
        name: 'Simple Category',
        description: undefined,
        color: undefined,
        icon: undefined,
      });

      addCategoryUseCase.execute.mockResolvedValue(expectedCategory);

      // Act
      const result = await controller.create(createCategoryDto, mockRequest);

      // Assert
      expect(result.name).toBe('Simple Category');
      expect(result.description).toBeUndefined();
      expect(result.color).toBeUndefined();
      expect(result.icon).toBeUndefined();
    });

    it('should handle use case validation errors and log security event', async () => {
      // Arrange
      const createCategoryDto = CategoryRequestMockFactory.createValid();
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const error = new Error('Category name already exists for this user');

      addCategoryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.create(createCategoryDto, mockRequest),
      ).rejects.toThrow(error);

      // Verify security event logging
      const securityEvents = loggerSpy.getSecurityEvents('medium');
      expect(securityEvents).toHaveLength(1);
      expect(securityEvents[0]).toMatchObject({
        event: 'category_api_create_failed',
        severity: 'medium',
        userId: 'user-123',
        error: 'Category name already exists for this user',
        message: 'Failed to create category: Freelance Work',
        endpoint: '/categories',
        traceId: 'trace-123',
      });

      // Verify error metrics
      expect(metricsSpy.hasRecordedMetric('http_requests_total')).toBe(true);
      expect(metricsSpy.hasRecordedMetric('api_errors_total')).toBe(true);
    });

    it('should handle use case errors for duplicate name', async () => {
      // Arrange
      const createCategoryDto = CategoryRequestMockFactory.createValid();
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const error = new Error('Category name already exists for this user');

      addCategoryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.create(createCategoryDto, mockRequest),
      ).rejects.toThrow('Category name already exists for this user');

      expect(addCategoryUseCase.execute).toHaveBeenCalledWith({
        ...createCategoryDto,
        userId: 'user-123',
      });
    });

    it('should handle use case errors for validation failures', async () => {
      // Arrange
      const createCategoryDto = CategoryRequestMockFactory.createValid();
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const error = new Error('Category name is required');

      addCategoryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.create(createCategoryDto, mockRequest),
      ).rejects.toThrow('Category name is required');
    });

    it('should handle database connection errors', async () => {
      // Arrange
      const createCategoryDto = CategoryRequestMockFactory.createValid();
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const error = new Error('Database connection failed');

      addCategoryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.create(createCategoryDto, mockRequest),
      ).rejects.toThrow('Database connection failed');

      // Verify error logging
      const securityEvents = loggerSpy.getSecurityEvents();
      expect(securityEvents).toHaveLength(1);
      expect(securityEvents[0].error).toBe('Database connection failed');
    });

    it('should record performance metrics correctly', async () => {
      // Arrange
      const createCategoryDto = CategoryRequestMockFactory.createValid();
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const expectedCategory = MockCategoryFactory.create();

      addCategoryUseCase.execute.mockResolvedValue(expectedCategory);

      // Act
      await controller.create(createCategoryDto, mockRequest);

      // Assert
      // Verify HTTP request metrics
      expect(metricsSpy.hasRecordedMetric('http_requests_total')).toBe(true);

      const httpMetrics = metricsSpy.getMetricsByFilter('http_requests_total');
      expect(httpMetrics.length).toBeGreaterThan(0);

      // Verify the metric was recorded with correct labels
      const httpMetric = httpMetrics[0];
      expect(httpMetric.labels).toMatchObject({
        method: 'POST',
        route: '/categories',
        status_code: '201',
      });
    });

    it('should include duration in business event logging', async () => {
      // Arrange
      const createCategoryDto = CategoryRequestMockFactory.createValid();
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const expectedCategory = MockCategoryFactory.create();

      addCategoryUseCase.execute.mockResolvedValue(expectedCategory);

      // Act
      await controller.create(createCategoryDto, mockRequest);

      // Assert
      const businessEvents = loggerSpy.getBusinessEvents(
        'category_api_create_success',
      );
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0]).toHaveProperty('duration');
      expect(typeof businessEvents[0].duration).toBe('number');
      expect(businessEvents[0].duration).toBeGreaterThanOrEqual(0);
    });
  });
});
