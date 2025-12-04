import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from '../../../../src/presentation/controllers/category.controller';
import { ListCategoriesUseCaseMockFactory } from '../../../domain/mocks/usecases/list-categories.mock';
import { LoggerSpy } from '../../../infra/mocks/logging/logger.spy';
import { MetricsSpy } from '../../../infra/mocks/metrics/metrics.spy';
import { RequestMockFactory } from '../../mocks/controllers/request.mock';
import { MockCategoryFactory } from '../../../domain/mocks/models/category.mock';
import { CategoryType } from '@domain/models/category.model';
import { ListCategoriesUseCase } from '@domain/usecases/list-categories.usecase';

describe('CategoryController - List', () => {
  let controller: CategoryController;
  let listCategoriesUseCase: jest.Mocked<ListCategoriesUseCase>;
  let loggerSpy: LoggerSpy;
  let metricsSpy: MetricsSpy;

  beforeEach(async () => {
    listCategoriesUseCase = ListCategoriesUseCaseMockFactory.createSuccess();
    loggerSpy = new LoggerSpy();
    metricsSpy = new MetricsSpy();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        { provide: 'AddCategoryUseCase', useValue: jest.fn() },
        { provide: 'ListCategoriesUseCase', useValue: listCategoriesUseCase },
        { provide: 'UpdateCategoryUseCase', useValue: jest.fn() },
        { provide: 'DeleteCategoryUseCase', useValue: { execute: jest.fn() } },
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

  describe('list', () => {
    it('should list categories and log business event', async () => {
      // Arrange
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const expectedCategories = [MockCategoryFactory.createWithStats()];
      const expectedResult = {
        data: expectedCategories,
        summary: {
          total: 1,
          income: 1,
          expense: 0,
          custom: 1,
          default: 0,
        },
      };

      listCategoriesUseCase.execute.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.list(
        'all',
        'false',
        '1',
        '20',
        '',
        mockRequest.user,
        mockRequest,
      );

      // Assert
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('summary');
      expect(result.data).toHaveLength(1);
      expect(result.summary.total).toBe(1);

      expect(listCategoriesUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        type: undefined,
        includeStats: false,
        page: 1,
        limit: 20,
        search: undefined,
      });

      // Verify business event logging
      const businessEvents = loggerSpy.getBusinessEvents(
        'category_api_list_success',
      );
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0]).toMatchObject({
        userId: 'user-123',
        traceId: 'trace-123',
      });

      // Verify metrics
      expect(metricsSpy.hasRecordedHttpRequest('GET', '/categories', 200)).toBe(
        true,
      );
    });

    it('should list categories with type filter', async () => {
      // Arrange
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const expectedResult = {
        data: [MockCategoryFactory.create({ type: CategoryType.INCOME })],
        summary: { total: 1, income: 1, expense: 0, custom: 1, default: 0 },
      };

      listCategoriesUseCase.execute.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.list(
        CategoryType.INCOME,
        'false',
        '1',
        '20',
        '',
        mockRequest.user,
        mockRequest,
      );

      // Assert
      expect(listCategoriesUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        type: CategoryType.INCOME,
        includeStats: false,
        page: 1,
        limit: 20,
        search: undefined,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe(CategoryType.INCOME);
    });

    it('should list categories with stats included', async () => {
      // Arrange
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const categoryWithStats = MockCategoryFactory.createWithStats();
      const expectedResult = {
        data: [categoryWithStats],
        summary: { total: 1, income: 1, expense: 0, custom: 1, default: 0 },
      };

      listCategoriesUseCase.execute.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.list(
        'all',
        'true',
        '1',
        '20',
        '',
        mockRequest.user,
        mockRequest,
      );

      // Assert
      expect(listCategoriesUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        type: undefined,
        includeStats: true,
        page: 1,
        limit: 20,
        search: undefined,
      });

      expect(result.data[0]).toHaveProperty('entriesCount');
      expect(result.data[0]).toHaveProperty('totalAmount');
      expect(result.data[0]).toHaveProperty('lastUsed');
    });

    it('should handle use case errors and log security event', async () => {
      // Arrange
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const error = new Error('Database connection failed');
      listCategoriesUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.list(
          'all',
          'false',
          '1',
          '20',
          '',
          mockRequest.user,
          mockRequest,
        ),
      ).rejects.toThrow(error);

      // Verify security event logging
      const securityEvents = loggerSpy.getSecurityEvents('medium');
      expect(securityEvents).toHaveLength(1);
      expect(securityEvents[0]).toMatchObject({
        event: 'category_api_list_failed',
        userId: 'user-123',
        error: 'Database connection failed',
      });

      // Verify error metrics
      expect(metricsSpy.hasRecordedHttpRequest('GET', '/categories', 400)).toBe(
        true,
      );
      expect(
        metricsSpy.hasRecordedApiError(
          'categories',
          'Database connection failed',
        ),
      ).toBe(true);
    });

    it('should handle boolean string conversion correctly', async () => {
      // Arrange
      const mockRequest = RequestMockFactory.createWithUser('user-123');

      // Act
      await controller.list(
        'all',
        'true',
        '1',
        '20',
        '',
        mockRequest.user,
        mockRequest,
      );

      // Assert
      expect(listCategoriesUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        type: undefined,
        includeStats: true,
        page: 1,
        limit: 20,
        search: undefined,
      });
    });

    it('should handle invalid boolean string as false', async () => {
      // Arrange
      const mockRequest = RequestMockFactory.createWithUser('user-123');

      // Act
      await controller.list(
        'all',
        'invalid',
        '1',
        '20',
        '',
        mockRequest.user,
        mockRequest,
      );

      // Assert
      expect(listCategoriesUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        type: undefined,
        includeStats: false,
        page: 1,
        limit: 20,
        search: undefined,
      });
    });

    it('should use default values when parameters are undefined', async () => {
      // Arrange
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const expectedResult = {
        data: [MockCategoryFactory.createWithStats()],
        summary: { total: 1, income: 1, expense: 0, custom: 1, default: 0 },
      };

      listCategoriesUseCase.execute.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.list(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        mockRequest.user,
        mockRequest,
      );

      // Assert
      expect(listCategoriesUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        type: undefined,
        includeStats: false,
        page: 1,
        limit: 20,
        search: undefined,
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('summary');
    });

    it('should use default type when type parameter is undefined', async () => {
      // Arrange
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const expectedResult = {
        data: [MockCategoryFactory.createWithStats()],
        summary: { total: 1, income: 1, expense: 0, custom: 1, default: 0 },
      };

      listCategoriesUseCase.execute.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.list(
        undefined,
        'true',
        undefined,
        undefined,
        undefined,
        mockRequest.user,
        mockRequest,
      );

      // Assert
      expect(listCategoriesUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        type: undefined,
        includeStats: true,
        page: 1,
        limit: 20,
        search: undefined,
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('summary');
    });

    it('should use default includeStats when includeStats parameter is undefined', async () => {
      // Arrange
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const expectedResult = {
        data: [MockCategoryFactory.create({ type: CategoryType.EXPENSE })],
        summary: { total: 1, income: 0, expense: 1, custom: 1, default: 0 },
      };

      listCategoriesUseCase.execute.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.list(
        CategoryType.EXPENSE,
        undefined,
        undefined,
        undefined,
        undefined,
        mockRequest.user,
        mockRequest,
      );

      // Assert
      expect(listCategoriesUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        type: CategoryType.EXPENSE,
        includeStats: false,
        page: 1,
        limit: 20,
        search: undefined,
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('summary');
    });

    it('should handle invalid page values and default to 1', async () => {
      // Arrange
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const expectedResult = {
        data: [MockCategoryFactory.createWithStats()],
        summary: { total: 1, income: 1, expense: 0, custom: 1, default: 0 },
      };

      listCategoriesUseCase.execute.mockResolvedValue(expectedResult);

      // Act - Test with invalid page values (NaN, 0, negative)
      await controller.list(
        'all',
        'false',
        'invalid',
        '20',
        '',
        mockRequest.user,
        mockRequest,
      );

      // Assert - Should default to page 1
      expect(listCategoriesUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        type: undefined,
        includeStats: false,
        page: 1,
        limit: 20,
        search: undefined,
      });
    });

    it('should handle zero page value and default to 1', async () => {
      // Arrange
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const expectedResult = {
        data: [MockCategoryFactory.createWithStats()],
        summary: { total: 1, income: 1, expense: 0, custom: 1, default: 0 },
      };

      listCategoriesUseCase.execute.mockResolvedValue(expectedResult);

      // Act
      await controller.list(
        'all',
        'false',
        '0',
        '20',
        '',
        mockRequest.user,
        mockRequest,
      );

      // Assert - Should default to page 1 (Math.max(1, 0) = 1)
      expect(listCategoriesUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        type: undefined,
        includeStats: false,
        page: 1,
        limit: 20,
        search: undefined,
      });
    });

    it('should handle negative page value and default to 1', async () => {
      // Arrange
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const expectedResult = {
        data: [MockCategoryFactory.createWithStats()],
        summary: { total: 1, income: 1, expense: 0, custom: 1, default: 0 },
      };

      listCategoriesUseCase.execute.mockResolvedValue(expectedResult);

      // Act
      await controller.list(
        'all',
        'false',
        '-5',
        '20',
        '',
        mockRequest.user,
        mockRequest,
      );

      // Assert - Should default to page 1 (Math.max(1, -5) = 1)
      expect(listCategoriesUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        type: undefined,
        includeStats: false,
        page: 1,
        limit: 20,
        search: undefined,
      });
    });

    it('should handle invalid limit values and default appropriately', async () => {
      // Arrange
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const expectedResult = {
        data: [MockCategoryFactory.createWithStats()],
        summary: { total: 1, income: 1, expense: 0, custom: 1, default: 0 },
      };

      listCategoriesUseCase.execute.mockResolvedValue(expectedResult);

      // Act - Test with invalid limit (NaN)
      await controller.list(
        'all',
        'false',
        '1',
        'invalid',
        '',
        mockRequest.user,
        mockRequest,
      );

      // Assert - Should default to 20
      expect(listCategoriesUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        type: undefined,
        includeStats: false,
        page: 1,
        limit: 20,
        search: undefined,
      });
    });

    it('should handle zero limit value and default to 20', async () => {
      // Arrange
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const expectedResult = {
        data: [MockCategoryFactory.createWithStats()],
        summary: { total: 1, income: 1, expense: 0, custom: 1, default: 0 },
      };

      listCategoriesUseCase.execute.mockResolvedValue(expectedResult);

      // Act
      await controller.list(
        'all',
        'false',
        '1',
        '0',
        '',
        mockRequest.user,
        mockRequest,
      );

      // Assert - parseInt('0', 10) returns 0, which is falsy, so || 20 evaluates to 20
      // Then Math.max(1, 20) = 20, Math.min(100, 20) = 20
      expect(listCategoriesUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        type: undefined,
        includeStats: false,
        page: 1,
        limit: 20,
        search: undefined,
      });
    });

    it('should handle negative limit value and default to 1', async () => {
      // Arrange
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const expectedResult = {
        data: [MockCategoryFactory.createWithStats()],
        summary: { total: 1, income: 1, expense: 0, custom: 1, default: 0 },
      };

      listCategoriesUseCase.execute.mockResolvedValue(expectedResult);

      // Act
      await controller.list(
        'all',
        'false',
        '1',
        '-10',
        '',
        mockRequest.user,
        mockRequest,
      );

      // Assert - Should default to 1 (Math.max(1, -10) = 1)
      expect(listCategoriesUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        type: undefined,
        includeStats: false,
        page: 1,
        limit: 1,
        search: undefined,
      });
    });

    it('should cap limit value at 100', async () => {
      // Arrange
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const expectedResult = {
        data: [MockCategoryFactory.createWithStats()],
        summary: { total: 1, income: 1, expense: 0, custom: 1, default: 0 },
      };

      listCategoriesUseCase.execute.mockResolvedValue(expectedResult);

      // Act - Test with limit > 100
      await controller.list(
        'all',
        'false',
        '1',
        '150',
        '',
        mockRequest.user,
        mockRequest,
      );

      // Assert - Should cap at 100 (Math.min(100, 150) = 100)
      expect(listCategoriesUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        type: undefined,
        includeStats: false,
        page: 1,
        limit: 100,
        search: undefined,
      });
    });

    it('should trim search parameter and include in metadata', async () => {
      // Arrange
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const expectedResult = {
        data: [MockCategoryFactory.createWithStats()],
        summary: { total: 1, income: 1, expense: 0, custom: 1, default: 0 },
      };

      listCategoriesUseCase.execute.mockResolvedValue(expectedResult);

      // Act - Test with search parameter that has whitespace
      await controller.list(
        'all',
        'false',
        '1',
        '20',
        '  groceries  ',
        mockRequest.user,
        mockRequest,
      );

      // Assert - Search should be trimmed
      expect(listCategoriesUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        type: undefined,
        includeStats: false,
        page: 1,
        limit: 20,
        search: 'groceries',
      });

      // Verify search is included in business event metadata
      const businessEvents = loggerSpy.getBusinessEvents(
        'category_api_list_success',
      );
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0].metadata.search).toBe('groceries');
    });

    it('should handle empty search parameter after trimming', async () => {
      // Arrange
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const expectedResult = {
        data: [MockCategoryFactory.createWithStats()],
        summary: { total: 1, income: 1, expense: 0, custom: 1, default: 0 },
      };

      listCategoriesUseCase.execute.mockResolvedValue(expectedResult);

      // Act - Test with search parameter that is only whitespace
      await controller.list(
        'all',
        'false',
        '1',
        '20',
        '   ',
        mockRequest.user,
        mockRequest,
      );

      // Assert - Search should be undefined after trimming empty string
      expect(listCategoriesUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        type: undefined,
        includeStats: false,
        page: 1,
        limit: 20,
        search: undefined,
      });

      // Verify search is undefined in business event metadata
      const businessEvents = loggerSpy.getBusinessEvents(
        'category_api_list_success',
      );
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0].metadata.search).toBeUndefined();
    });
  });
});
