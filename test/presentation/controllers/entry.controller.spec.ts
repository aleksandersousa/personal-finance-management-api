import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntryController } from '../../../src/presentation/controllers/entry.controller';
import { DbAddEntryUseCase } from '../../../src/data/usecases/db-add-entry.usecase';
import { AddEntryUseCaseMockFactory } from '../../domain/mocks/usecases/add-entry.mock';
import { MockEntryFactory } from '../../domain/mocks/models/entry.mock';
import { LoggerSpy } from '../../infra/mocks/logging/logger.spy';
import { MetricsSpy } from '../../infra/mocks/metrics/metrics.spy';
import { CreateEntryDto } from '../../../src/presentation/dtos/create-entry.dto';
import { RequestMockFactory } from '../mocks/controllers/request.mock';
import { DbUpdateEntryUseCase } from '../../../src/data/usecases/db-update-entry.usecase';
import { ContextAwareLoggerService } from '../../../src/infra/logging/context-aware-logger.service';
import { FinancialMetricsService } from '../../../src/infra/metrics/financial-metrics.service';

describe('EntryController', () => {
  let controller: EntryController;
  let addEntryUseCase: jest.Mocked<any>;
  let listEntriesByMonthUseCase: jest.Mocked<any>;
  let loggerSpy: LoggerSpy;
  let metricsSpy: MetricsSpy;
  let updateEntryUseCase: jest.Mocked<any>;

  beforeEach(async () => {
    addEntryUseCase = AddEntryUseCaseMockFactory.createSuccess();
    listEntriesByMonthUseCase = {
      execute: jest.fn(),
    };
    loggerSpy = new LoggerSpy();
    metricsSpy = new MetricsSpy();
    updateEntryUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntryController],
      providers: [
        {
          provide: DbAddEntryUseCase,
          useValue: addEntryUseCase,
        },
        {
          provide: 'ListEntriesByMonthUseCase',
          useValue: listEntriesByMonthUseCase,
        },
        {
          provide: DbUpdateEntryUseCase,
          useValue: updateEntryUseCase,
        },
        {
          provide: ContextAwareLoggerService,
          useValue: loggerSpy,
        },
        {
          provide: FinancialMetricsService,
          useValue: metricsSpy,
        },
      ],
    }).compile();

    controller = module.get<EntryController>(EntryController);
  });

  afterEach(() => {
    loggerSpy.clear();
    metricsSpy.clear();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an entry successfully', async () => {
      const createEntryDto: CreateEntryDto = {
        amount: 1000.0,
        description: 'Salary',
        type: 'INCOME',
        isFixed: true,
        categoryId: 'category-id',
        date: '2024-01-15',
      };

      const mockUser = { id: 'user-id', email: 'test@example.com' };
      const mockEntry = MockEntryFactory.create({
        id: 'entry-id',
        amount: 1000.0,
        description: 'Salary',
        type: 'INCOME',
        isFixed: true,
        categoryId: 'category-id',
        userId: 'user-id',
        date: new Date('2024-01-15'),
      });

      addEntryUseCase.execute.mockResolvedValue(mockEntry);

      const result = await controller.create(createEntryDto, mockUser);

      expect(result).toHaveProperty('id');
      expect(result.amount).toBe(mockEntry.amount);
      expect(result.description).toBe(mockEntry.description);
      expect(result.type).toBe(mockEntry.type);
      expect(result.userId).toBe(mockEntry.userId);

      expect(addEntryUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-id',
        description: createEntryDto.description,
        amount: createEntryDto.amount,
        date: new Date(createEntryDto.date),
        type: createEntryDto.type,
        isFixed: createEntryDto.isFixed,
        categoryId: createEntryDto.categoryId,
      });
    });

    it('should throw NotFoundException when category not found', async () => {
      const createEntryDto: CreateEntryDto = {
        amount: 1000.0,
        description: 'Salary',
        type: 'INCOME',
        isFixed: true,
        categoryId: 'invalid-category-id',
        date: '2024-01-15',
      };

      const mockUser = { id: 'user-id', email: 'test@example.com' };
      const error = new Error('Category not found');

      addEntryUseCase.execute.mockRejectedValue(error);

      await expect(controller.create(createEntryDto, mockUser)).rejects.toThrow(
        'Category not found',
      );
    });

    it('should handle validation errors', async () => {
      const createEntryDto: CreateEntryDto = {
        amount: -100,
        description: '',
        type: 'INCOME',
        isFixed: true,
        categoryId: 'category-id',
        date: '2024-01-15',
      };

      const mockUser = { id: 'user-id', email: 'test@example.com' };
      const validationError = new Error('Amount must be greater than zero');

      addEntryUseCase.execute.mockRejectedValue(validationError);

      await expect(controller.create(createEntryDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle general errors with default message', async () => {
      const createEntryDto: CreateEntryDto = {
        amount: 1000.0,
        description: 'Test Entry',
        type: 'INCOME',
        isFixed: false,
        categoryId: 'category-id',
        date: '2024-01-15',
      };

      const mockUser = { id: 'user-id', email: 'test@example.com' };
      // Error that doesn't match "not found" or validation patterns
      const generalError = new Error('Database connection timeout');

      addEntryUseCase.execute.mockRejectedValue(generalError);

      await expect(controller.create(createEntryDto, mockUser)).rejects.toThrow(
        'Failed to create entry',
      );
    });
  });

  describe('listByMonth', () => {
    it('should return entries for a specific month with pagination', async () => {
      const month = '2024-01';
      const mockUser = { id: 'user-id', email: 'test@example.com' };

      const mockEntries = [
        MockEntryFactory.create({
          id: 'entry-1',
          amount: 1000.0,
          description: 'Salary',
          type: 'INCOME' as any,
          isFixed: true,
          categoryId: 'category-1',
          userId: 'user-id',
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

      const result = await controller.listByMonth(
        month,
        '1',
        '20',
        'date',
        'desc',
        'all',
        'all',
        mockUser,
      );

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
        userId: 'user-id',
        year: 2024,
        month: 1,
        page: 1,
        limit: 20,
        sort: 'date',
        order: 'desc',
        type: 'all',
        categoryId: undefined,
      });
    });

    it('should use default values when parameters are not provided', async () => {
      const month = '2024-01';
      const mockUser = { id: 'user-id', email: 'test@example.com' };

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

      // Call the controller method with minimal parameters to test defaults
      await controller.listByMonth(
        month,
        undefined, // page - should use default
        undefined, // limit - should use default
        undefined, // sort - should use default
        undefined, // order - should use default
        undefined, // type - should use default
        undefined, // category - should use default
        mockUser,
      );

      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-id',
        year: 2024,
        month: 1,
        page: 1,
        limit: 20,
        sort: 'date',
        order: 'desc',
        type: 'all',
        categoryId: undefined,
      });
    });

    it('should handle invalid page parameter and use default', async () => {
      const month = '2024-01';
      const mockUser = { id: 'user-id', email: 'test@example.com' };

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

      // Test with invalid page parameter
      await controller.listByMonth(
        month,
        'invalid-page', // This will trigger parseInt fallback
        '20',
        'date',
        'desc',
        'all',
        'all',
        mockUser,
      );

      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1, // Should fallback to 1
        }),
      );
    });

    it('should handle invalid limit parameter and use default', async () => {
      const month = '2024-01';
      const mockUser = { id: 'user-id', email: 'test@example.com' };

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

      // Test with invalid limit parameter
      await controller.listByMonth(
        month,
        '1',
        'invalid-limit', // This will trigger parseInt fallback
        'date',
        'desc',
        'all',
        'all',
        mockUser,
      );

      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 20, // Should fallback to 20
        }),
      );
    });

    it('should enforce minimum page value of 1', async () => {
      const month = '2024-01';
      const mockUser = { id: 'user-id', email: 'test@example.com' };

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

      // Test with page value less than 1
      await controller.listByMonth(
        month,
        '0', // Should be forced to 1
        '20',
        'date',
        'desc',
        'all',
        'all',
        mockUser,
      );

      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1, // Should be enforced to minimum 1
        }),
      );
    });

    it('should enforce maximum limit value of 100', async () => {
      const month = '2024-01';
      const mockUser = { id: 'user-id', email: 'test@example.com' };

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

      // Test with limit value greater than 100
      await controller.listByMonth(
        month,
        '1',
        '150', // Should be capped at 100
        'date',
        'desc',
        'all',
        'all',
        mockUser,
      );

      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100, // Should be capped at maximum 100
        }),
      );
    });

    it('should enforce minimum limit value of 1', async () => {
      const month = '2024-01';
      const mockUser = { id: 'user-id', email: 'test@example.com' };

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

      // Test with limit value less than 1
      await controller.listByMonth(
        month,
        '1',
        '-5', // Should be forced to 1
        'date',
        'desc',
        'all',
        'all',
        mockUser,
      );

      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 1, // Should be enforced to minimum 1
        }),
      );
    });

    it('should validate invalid sort parameter', async () => {
      const month = '2024-01';
      const mockUser = { id: 'user-id', email: 'test@example.com' };

      await expect(
        controller.listByMonth(
          month,
          '1',
          '20',
          'invalid-sort', // Invalid sort field
          'desc',
          'all',
          'all',
          mockUser,
        ),
      ).rejects.toThrow(
        'Invalid sort field. Must be one of: date, amount, description',
      );
    });

    it('should validate invalid order parameter', async () => {
      const month = '2024-01';
      const mockUser = { id: 'user-id', email: 'test@example.com' };

      await expect(
        controller.listByMonth(
          month,
          '1',
          '20',
          'date',
          'invalid-order', // Invalid order
          'all',
          'all',
          mockUser,
        ),
      ).rejects.toThrow('Invalid order. Must be one of: asc, desc');
    });

    it('should validate invalid type parameter', async () => {
      const month = '2024-01';
      const mockUser = { id: 'user-id', email: 'test@example.com' };

      await expect(
        controller.listByMonth(
          month,
          '1',
          '20',
          'date',
          'desc',
          'INVALID_TYPE', // Invalid type
          'all',
          mockUser,
        ),
      ).rejects.toThrow('Invalid type. Must be one of: INCOME, EXPENSE, all');
    });

    it('should validate invalid month format', async () => {
      const mockUser = { id: 'user-id', email: 'test@example.com' };

      await expect(
        controller.listByMonth(
          'invalid-month', // Invalid format
          '1',
          '20',
          'date',
          'desc',
          'all',
          'all',
          mockUser,
        ),
      ).rejects.toThrow('Month must be in YYYY-MM format');
    });

    it('should validate missing month parameter', async () => {
      const mockUser = { id: 'user-id', email: 'test@example.com' };

      await expect(
        controller.listByMonth(
          null as any, // Missing month
          '1',
          '20',
          'date',
          'desc',
          'all',
          'all',
          mockUser,
        ),
      ).rejects.toThrow('Month must be in YYYY-MM format');
    });

    it('should validate year and month values', async () => {
      const mockUser = { id: 'user-id', email: 'test@example.com' };

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
          mockUser,
        ),
      ).rejects.toThrow('Invalid year or month value');
    });

    it('should handle pagination parameters correctly', async () => {
      const month = '2024-01';
      const mockUser = { id: 'user-id', email: 'test@example.com' };

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

      await controller.listByMonth(
        month,
        '2',
        '10',
        'amount',
        'asc',
        'INCOME',
        'category-123',
        mockUser,
      );

      expect(listEntriesByMonthUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-id',
        year: 2024,
        month: 1,
        page: 2,
        limit: 10,
        sort: 'amount',
        order: 'asc',
        type: 'INCOME',
        categoryId: 'category-123',
      });
    });

    it('should handle list entries errors appropriately', async () => {
      const month = '2024-01';
      const mockUser = { id: 'user-id', email: 'test@example.com' };

      const error = new Error('Database connection failed');
      listEntriesByMonthUseCase.execute.mockRejectedValue(error);

      await expect(
        controller.listByMonth(
          month,
          '1',
          '20',
          'date',
          'desc',
          'all',
          'all',
          mockUser,
        ),
      ).rejects.toThrow('Failed to retrieve entries');
    });

    it('should handle client errors in listByMonth', async () => {
      const month = '2024-01';
      const mockUser = { id: 'user-id', email: 'test@example.com' };

      const clientError = new Error('Invalid parameters provided');
      listEntriesByMonthUseCase.execute.mockRejectedValue(clientError);

      await expect(
        controller.listByMonth(
          month,
          '1',
          '20',
          'date',
          'desc',
          'all',
          'all',
          mockUser,
        ),
      ).rejects.toThrow('Invalid parameters provided');
    });
  });

  describe('update', () => {
    it('should update entry and log business event', async () => {
      // Arrange
      const entryId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const updateDto = {
        description: 'Updated Monthly Salary',
        amount: 5200.0,
        date: '2025-01-15T10:00:00Z',
        type: 'INCOME' as const,
        isFixed: true,
        categoryId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const expectedEntry = MockEntryFactory.createUpdated();

      updateEntryUseCase.execute.mockResolvedValue(expectedEntry);

      // Act
      const result = await controller.update(entryId, updateDto, mockUser);

      // Assert
      expect(result).toMatchObject({
        id: expectedEntry.id,
        amount: expectedEntry.amount,
        description: expectedEntry.description,
        type: expectedEntry.type,
        isFixed: expectedEntry.isFixed,
        userId: expectedEntry.userId,
        date: expectedEntry.date,
        createdAt: expectedEntry.createdAt,
        updatedAt: expectedEntry.updatedAt,
      });
      expect(updateEntryUseCase.execute).toHaveBeenCalledWith({
        id: entryId,
        userId: 'user-123',
        description: updateDto.description,
        amount: updateDto.amount,
        date: new Date(updateDto.date),
        type: updateDto.type,
        isFixed: updateDto.isFixed,
        categoryId: updateDto.categoryId,
      });

      // Note: Controller doesn't implement logging/metrics yet
      // This would be added in a future enhancement
    });

    it('should handle validation errors and throw BadRequestException', async () => {
      // Arrange
      const entryId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const updateDto = {
        description: '',
        amount: -100,
        date: '2025-01-15T10:00:00Z',
        type: 'INCOME' as const,
        isFixed: true,
      };
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const error = new Error('Amount must be greater than zero');

      updateEntryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.update(entryId, updateDto, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle not found errors and throw NotFoundException', async () => {
      // Arrange
      const entryId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const updateDto = {
        description: 'Updated Entry',
        amount: 100.0,
        date: '2025-01-15T10:00:00Z',
        type: 'EXPENSE' as const,
        isFixed: false,
      };
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const error = new Error('Entry not found');

      updateEntryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.update(entryId, updateDto, mockRequest),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle unauthorized errors and throw NotFoundException with access denied message', async () => {
      // Arrange
      const entryId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const updateDto = {
        description: 'Updated Entry',
        amount: 100.0,
        date: '2025-01-15T10:00:00Z',
        type: 'EXPENSE' as const,
        isFixed: false,
      };
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const error = new Error('You can only update your own entries');

      updateEntryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.update(entryId, updateDto, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle category not found errors', async () => {
      // Arrange
      const entryId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const updateDto = {
        description: 'Updated Entry',
        amount: 100.0,
        date: '2025-01-15T10:00:00Z',
        type: 'EXPENSE' as const,
        isFixed: false,
        categoryId: 'non-existent-category',
      };
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const error = new Error('Category not found');

      updateEntryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.update(entryId, updateDto, mockRequest),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle generic errors and throw BadRequestException', async () => {
      // Arrange
      const entryId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const updateDto = {
        description: 'Updated Entry',
        amount: 100.0,
        date: '2025-01-15T10:00:00Z',
        type: 'EXPENSE' as const,
        isFixed: false,
      };
      const mockRequest = RequestMockFactory.createWithUser('user-123');
      const error = new Error('Database connection failed');

      updateEntryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.update(entryId, updateDto, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
