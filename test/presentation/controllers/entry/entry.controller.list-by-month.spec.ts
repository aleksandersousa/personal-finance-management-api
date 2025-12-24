import { Test, TestingModule } from '@nestjs/testing';
import { EntryController } from '@presentation/controllers/entry.controller';
import { ListEntriesByMonthUseCase } from '@domain/usecases/list-entries-by-month.usecase';
import { MockEntryFactory } from '../../../domain/mocks/models/entry.mock';
import { LoggerSpy } from '../../../infra/mocks/logging/logger.spy';
import { MetricsSpy } from '../../../infra/mocks/metrics/metrics.spy';

describe('EntryController - LIST_BY_MONTH', () => {
  let controller: EntryController;
  let listEntriesByMonthUseCase: jest.Mocked<ListEntriesByMonthUseCase>;
  let loggerSpy: LoggerSpy;
  let metricsSpy: MetricsSpy;

  beforeEach(async () => {
    listEntriesByMonthUseCase = {
      execute: jest.fn(),
    };
    loggerSpy = new LoggerSpy();
    metricsSpy = new MetricsSpy();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntryController],
      providers: [
        { provide: 'AddEntryUseCase', useValue: {} },
        {
          provide: 'ListEntriesByMonthUseCase',
          useValue: listEntriesByMonthUseCase,
        },
        { provide: 'DeleteEntryUseCase', useValue: {} },
        { provide: 'UpdateEntryUseCase', useValue: {} },
        { provide: 'GetEntriesMonthsYearsUseCase', useValue: {} },
        { provide: 'ToggleMonthlyPaymentStatusUseCase', useValue: {} },
        { provide: 'Logger', useValue: loggerSpy },
        { provide: 'Metrics', useValue: metricsSpy },
      ],
    }).compile();

    controller = module.get<EntryController>(EntryController);
  });

  afterEach(() => {
    loggerSpy.clear();
    metricsSpy.clear();
    jest.clearAllMocks();
  });

  describe('listByMonth', () => {
    it('should return entries for a specific month with pagination and log business event', async () => {
      // Arrange
      const month = '2024-01';
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const mockEntries = [
        MockEntryFactory.create({
          id: 'entry-1',
          amount: 1000.0,
          description: 'Salary',
          type: 'INCOME',
          isFixed: true,
          categoryId: 'category-1',
          userId: 'user-123',
          date: new Date('2024-01-15'),
        }),
      ];

      const mockUseCaseResponse = {
        data: mockEntries,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
        summary: {
          totalIncome: 1000.0,
          totalExpenses: 0,
          balance: 1000.0,
          entriesCount: 1,
        },
      };

      listEntriesByMonthUseCase.execute.mockResolvedValue(mockUseCaseResponse);

      // Act
      const result = await controller.listByMonth(
        month,
        '1',
        '20',
        'date',
        'desc',
        'all',
        'all',
        '',
        'all',
        mockUser,
      );

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });

      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        year: 2024,
        month: 1,
        page: 1,
        limit: 20,
        sort: 'date',
        order: 'desc',
        type: 'all',
        categoryId: undefined,
        search: undefined,
        isPaid: 'all',
      });

      // Verify business event logging
      const businessEvents = loggerSpy.getBusinessEvents(
        'entry_api_list_success',
      );
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0]).toMatchObject({
        userId: 'user-123',
        metadata: {
          month: '2024-01',
          page: 1,
          limit: 20,
          totalResults: 1,
        },
      });

      // Verify metrics
      expect(metricsSpy.hasRecordedHttpRequest('GET', '/entries', 200)).toBe(
        true,
      );
    });

    it('should use default values when parameters are not provided', async () => {
      // Arrange
      const month = '2024-01';
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const mockUseCaseResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        summary: {
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          entriesCount: 0,
        },
      };

      listEntriesByMonthUseCase.execute.mockResolvedValue(mockUseCaseResponse);

      // Act
      await controller.listByMonth(
        month,
        undefined, // page - should use default
        undefined, // limit - should use default
        undefined, // sort - should use default
        undefined, // order - should use default
        undefined, // type - should use default
        undefined, // category - should use default
        undefined, // search - should use default
        undefined, // isPaid - should use default
        mockUser,
      );

      // Assert
      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        year: 2024,
        month: 1,
        page: 1,
        limit: 20,
        sort: 'date',
        order: 'desc',
        type: 'all',
        categoryId: undefined,
        search: undefined,
        isPaid: 'all',
      });
    });

    it('should handle invalid page parameter and use default', async () => {
      // Arrange
      const month = '2024-01';
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const mockUseCaseResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        summary: {
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          entriesCount: 0,
        },
      };

      listEntriesByMonthUseCase.execute.mockResolvedValue(mockUseCaseResponse);

      // Act
      await controller.listByMonth(
        month,
        'invalid-page', // This will trigger parseInt fallback
        '20',
        'date',
        'desc',
        'all',
        'all',
        '',
        'all',
        mockUser,
      );

      // Assert
      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1, // Should fallback to 1
        }),
      );
    });

    it('should enforce minimum page value of 1', async () => {
      // Arrange
      const month = '2024-01';
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const mockUseCaseResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        summary: {
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          entriesCount: 0,
        },
      };

      listEntriesByMonthUseCase.execute.mockResolvedValue(mockUseCaseResponse);

      // Act
      await controller.listByMonth(
        month,
        '0', // Should be forced to 1
        '20',
        'date',
        'desc',
        'all',
        'all',
        '',
        'all',
        mockUser,
      );

      // Assert
      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1, // Should be enforced to minimum 1
        }),
      );
    });

    it('should enforce maximum limit value of 100', async () => {
      // Arrange
      const month = '2024-01';
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const mockUseCaseResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 100,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        summary: {
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          entriesCount: 0,
        },
      };

      listEntriesByMonthUseCase.execute.mockResolvedValue(mockUseCaseResponse);

      // Act
      await controller.listByMonth(
        month,
        '1',
        '150', // Should be capped at 100
        'date',
        'desc',
        'all',
        'all',
        '',
        'all',
        mockUser,
      );

      // Assert
      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100, // Should be capped at maximum 100
        }),
      );
    });

    it('should enforce minimum limit value of 1', async () => {
      // Arrange
      const month = '2024-01';
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const mockUseCaseResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 1,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        summary: {
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          entriesCount: 0,
        },
      };

      listEntriesByMonthUseCase.execute.mockResolvedValue(mockUseCaseResponse);

      // Act
      await controller.listByMonth(
        month,
        '1',
        '-5', // Should be forced to 1
        'date',
        'desc',
        'all',
        'all',
        '',
        'all',
        mockUser,
      );

      // Assert
      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 1, // Should be enforced to minimum 1
        }),
      );
    });

    it('should validate invalid sort parameter', async () => {
      // Arrange
      const month = '2024-01';
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      // Act & Assert
      await expect(
        controller.listByMonth(
          month,
          '1',
          '20',
          'invalid-sort', // Invalid sort field
          'desc',
          'all',
          'all',
          '',
          'all',
          mockUser,
        ),
      ).rejects.toThrow(
        'Invalid sort field. Must be one of: date, amount, description',
      );
    });

    it('should validate invalid order parameter', async () => {
      // Arrange
      const month = '2024-01';
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      // Act & Assert
      await expect(
        controller.listByMonth(
          month,
          '1',
          '20',
          'date',
          'invalid-order', // Invalid order
          'all',
          'all',
          '',
          'all',
          mockUser,
        ),
      ).rejects.toThrow('Invalid order. Must be one of: asc, desc');
    });

    it('should validate invalid type parameter', async () => {
      // Arrange
      const month = '2024-01';
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      // Act & Assert
      await expect(
        controller.listByMonth(
          month,
          '1',
          '20',
          'date',
          'desc',
          'INVALID_TYPE', // Invalid type
          'all',
          '',
          'all',
          mockUser,
        ),
      ).rejects.toThrow('Invalid type. Must be one of: INCOME, EXPENSE, all');
    });

    it('should validate invalid month format', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      // Act & Assert
      await expect(
        controller.listByMonth(
          'invalid-month', // Invalid format
          '1',
          '20',
          'date',
          'desc',
          'all',
          'all',
          '',
          'all',
          mockUser,
        ),
      ).rejects.toThrow('Month must be in YYYY-MM format');
    });

    it('should validate missing month parameter', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      // Act & Assert
      await expect(
        controller.listByMonth(
          null as any, // Missing month
          '1',
          '20',
          'date',
          'desc',
          'all',
          'all',
          '',
          'all',
          mockUser,
        ),
      ).rejects.toThrow('Month must be in YYYY-MM format');
    });

    it('should validate year and month values', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      // Act & Assert
      // Test invalid year
      await expect(
        controller.listByMonth(
          '1800-01', // Year too low
          '1',
          '20',
          'date',
          'desc',
          'all',
          'all',
          '',
          'all',
          mockUser,
        ),
      ).rejects.toThrow('Invalid year or month value');

      // Test invalid month
      await expect(
        controller.listByMonth(
          '2024-13', // Month too high
          '1',
          '20',
          'date',
          'desc',
          'all',
          'all',
          '',
          'all',
          mockUser,
        ),
      ).rejects.toThrow('Invalid year or month value');
    });

    it('should handle pagination parameters correctly', async () => {
      // Arrange
      const month = '2024-01';
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const mockUseCaseResponse = {
        data: [],
        pagination: {
          page: 2,
          limit: 10,
          total: 25,
          totalPages: 3,
          hasNext: true,
          hasPrev: true,
        },
        summary: {
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          entriesCount: 0,
        },
      };

      listEntriesByMonthUseCase.execute.mockResolvedValue(mockUseCaseResponse);

      // Act
      await controller.listByMonth(
        month,
        '2',
        '10',
        'amount',
        'asc',
        'INCOME',
        'category-123',
        '',
        'all',
        mockUser,
      );

      // Assert
      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        year: 2024,
        month: 1,
        page: 2,
        limit: 10,
        sort: 'amount',
        order: 'asc',
        type: 'INCOME',
        categoryId: 'category-123',
        search: undefined,
        isPaid: 'all',
      });
    });

    it('should handle generic errors appropriately', async () => {
      // Arrange
      const month = '2024-01';
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const error = new Error('Database connection failed');
      listEntriesByMonthUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.listByMonth(
          month,
          '1',
          '20',
          'date',
          'desc',
          'all',
          'all',
          '',
          'all',
          mockUser,
        ),
      ).rejects.toThrow('Failed to retrieve entries');

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);

      // Verify error metrics
      expect(metricsSpy.hasRecordedApiError('entry_list')).toBe(true);
    });

    it('should handle client errors in listByMonth', async () => {
      // Arrange
      const month = '2024-01';
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const clientError = new Error('Invalid parameters provided');
      listEntriesByMonthUseCase.execute.mockRejectedValue(clientError);

      // Act & Assert
      await expect(
        controller.listByMonth(
          month,
          '1',
          '20',
          'date',
          'desc',
          'all',
          'all',
          '',
          'all',
          mockUser,
        ),
      ).rejects.toThrow('Invalid parameters provided');

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);
    });

    it('should measure request duration in logs', async () => {
      // Arrange
      const month = '2024-01';
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const mockUseCaseResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        summary: {
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          entriesCount: 0,
        },
      };

      listEntriesByMonthUseCase.execute.mockResolvedValue(mockUseCaseResponse);

      // Act
      await controller.listByMonth(
        month,
        '1',
        '20',
        'date',
        'desc',
        'all',
        'all',
        '',
        'all',
        mockUser,
      );

      // Assert
      const businessEvents = loggerSpy.getBusinessEvents(
        'entry_api_list_success',
      );
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0]).toHaveProperty('duration');
      expect(typeof businessEvents[0].duration).toBe('number');
      expect(businessEvents[0].duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle edge case month values correctly', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const mockUseCaseResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        summary: {
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          entriesCount: 0,
        },
      };

      listEntriesByMonthUseCase.execute.mockResolvedValue(mockUseCaseResponse);

      // Act & Assert - Test valid edge case months
      await controller.listByMonth(
        '2024-01',
        '1',
        '20',
        'date',
        'desc',
        'all',
        'all',
        '',
        'all',
        mockUser,
      );
      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ year: 2024, month: 1 }),
      );

      await controller.listByMonth(
        '2024-12',
        '1',
        '20',
        'date',
        'desc',
        'all',
        'all',
        '',
        'all',
        mockUser,
      );
      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ year: 2024, month: 12 }),
      );

      // Test boundary year values
      await controller.listByMonth(
        '1900-06',
        '1',
        '20',
        'date',
        'desc',
        'all',
        'all',
        '',
        'all',
        mockUser,
      );
      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ year: 1900, month: 6 }),
      );

      await controller.listByMonth(
        '2100-06',
        '1',
        '20',
        'date',
        'desc',
        'all',
        'all',
        '',
        'all',
        mockUser,
      );
      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ year: 2100, month: 6 }),
      );
    });

    it('should handle NaN page parameter and use default', async () => {
      // Arrange
      const month = '2024-01';
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const mockUseCaseResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        summary: {
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          entriesCount: 0,
        },
      };

      listEntriesByMonthUseCase.execute.mockResolvedValue(mockUseCaseResponse);

      // Act - Pass non-numeric page that will result in NaN
      await controller.listByMonth(
        month,
        'not-a-number', // This will cause parseInt to return NaN, triggering the || 1 fallback
        '20',
        'date',
        'desc',
        'all',
        'all',
        '',
        'all',
        mockUser,
      );

      // Assert - Should use page 1 as default
      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1, // Should default to 1 when parseInt returns NaN
        }),
      );
    });

    it('should handle NaN limit parameter and use default', async () => {
      // Arrange
      const month = '2024-01';
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const mockUseCaseResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        summary: {
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          entriesCount: 0,
        },
      };

      listEntriesByMonthUseCase.execute.mockResolvedValue(mockUseCaseResponse);

      // Act - Pass non-numeric limit that will result in NaN
      await controller.listByMonth(
        month,
        '1',
        'not-a-number', // This will cause parseInt to return NaN, triggering the || 20 fallback
        'date',
        'desc',
        'all',
        'all',
        '',
        'all',
        mockUser,
      );

      // Assert - Should use limit 20 as default
      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 20, // Should default to 20 when parseInt returns NaN
        }),
      );
    });

    it('should pass search parameter to use case when provided', async () => {
      // Arrange
      const month = '2024-01';
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const mockUseCaseResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        summary: {
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          entriesCount: 0,
        },
      };

      listEntriesByMonthUseCase.execute.mockResolvedValue(mockUseCaseResponse);

      // Act
      await controller.listByMonth(
        month,
        '1',
        '20',
        'date',
        'desc',
        'all',
        'all',
        'groceries',
        'all',
        mockUser,
      );

      // Assert
      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        year: 2024,
        month: 1,
        page: 1,
        limit: 20,
        sort: 'date',
        order: 'desc',
        type: 'all',
        categoryId: undefined,
        search: 'groceries',
        isPaid: 'all',
      });
    });

    it('should trim and pass search parameter when provided with whitespace', async () => {
      // Arrange
      const month = '2024-01';
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const mockUseCaseResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        summary: {
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          entriesCount: 0,
        },
      };

      listEntriesByMonthUseCase.execute.mockResolvedValue(mockUseCaseResponse);

      // Act
      await controller.listByMonth(
        month,
        '1',
        '20',
        'date',
        'desc',
        'all',
        'all',
        '  groceries  ',
        'all',
        mockUser,
      );

      // Assert
      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        year: 2024,
        month: 1,
        page: 1,
        limit: 20,
        sort: 'date',
        order: 'desc',
        type: 'all',
        categoryId: undefined,
        search: 'groceries',
        isPaid: 'all',
      });
    });

    it('should not pass search parameter when empty string is provided', async () => {
      // Arrange
      const month = '2024-01';
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const mockUseCaseResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        summary: {
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          entriesCount: 0,
        },
      };

      listEntriesByMonthUseCase.execute.mockResolvedValue(mockUseCaseResponse);

      // Act
      await controller.listByMonth(
        month,
        '1',
        '20',
        'date',
        'desc',
        'all',
        'all',
        '',
        'all',
        mockUser,
      );

      // Assert
      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        year: 2024,
        month: 1,
        page: 1,
        limit: 20,
        sort: 'date',
        order: 'desc',
        type: 'all',
        categoryId: undefined,
        search: undefined,
        isPaid: 'all',
      });
    });
  });
});
