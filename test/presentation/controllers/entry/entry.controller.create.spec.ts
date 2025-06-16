import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntryController } from '@presentation/controllers/entry.controller';
import { AddEntryUseCase } from '@domain/usecases/add-entry.usecase';
import { AddEntryUseCaseMockFactory } from '../../../domain/mocks/usecases/add-entry.mock';
import { MockEntryFactory } from '../../../domain/mocks/models/entry.mock';
import { LoggerSpy } from '../../../infra/mocks/logging/logger.spy';
import { MetricsSpy } from '../../../infra/mocks/metrics/metrics.spy';
import { CreateEntryDto } from '@presentation/dtos/create-entry.dto';

describe('EntryController - CREATE', () => {
  let controller: EntryController;
  let addEntryUseCase: jest.Mocked<AddEntryUseCase>;
  let loggerSpy: LoggerSpy;
  let metricsSpy: MetricsSpy;

  beforeEach(async () => {
    addEntryUseCase = AddEntryUseCaseMockFactory.createSuccess();
    loggerSpy = new LoggerSpy();
    metricsSpy = new MetricsSpy();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntryController],
      providers: [
        { provide: 'AddEntryUseCase', useValue: addEntryUseCase },
        { provide: 'ListEntriesByMonthUseCase', useValue: {} },
        { provide: 'DeleteEntryUseCase', useValue: {} },
        { provide: 'UpdateEntryUseCase', useValue: {} },
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

  describe('create', () => {
    it('should create an entry successfully and log business event', async () => {
      // Arrange
      const createEntryDto: CreateEntryDto = {
        amount: 1000.0,
        description: 'Salary',
        type: 'INCOME',
        isFixed: true,
        categoryId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        date: '2024-01-15',
      };

      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockEntry = MockEntryFactory.create({
        id: 'entry-123',
        amount: 1000.0,
        description: 'Salary',
        type: 'INCOME',
        isFixed: true,
        categoryId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        userId: 'user-123',
        date: new Date('2024-01-15'),
      });

      addEntryUseCase.execute.mockResolvedValue(mockEntry);

      // Act
      const result = await controller.create(createEntryDto, mockUser);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result.amount).toBe(mockEntry.amount);
      expect(result.description).toBe(mockEntry.description);
      expect(result.type).toBe(mockEntry.type);
      expect(result.userId).toBe(mockEntry.userId);

      expect(addEntryUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        description: createEntryDto.description,
        amount: createEntryDto.amount,
        date: new Date(createEntryDto.date),
        type: createEntryDto.type,
        isFixed: createEntryDto.isFixed,
        categoryId: createEntryDto.categoryId,
      });

      // Verify business event logging
      const businessEvents = loggerSpy.getBusinessEvents(
        'entry_api_create_success',
      );
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0]).toMatchObject({
        entityId: 'entry-123',
        userId: 'user-123',
        metadata: {
          type: 'INCOME',
          amount: 1000.0,
          isFixed: true,
        },
      });

      // Verify metrics
      expect(metricsSpy.hasRecordedHttpRequest('POST', '/entries', 201)).toBe(
        true,
      );
    });

    it('should throw NotFoundException when category not found', async () => {
      // Arrange
      const createEntryDto: CreateEntryDto = {
        amount: 1000.0,
        description: 'Salary',
        type: 'INCOME',
        isFixed: true,
        categoryId: 'invalid-category-id',
        date: '2024-01-15',
      };

      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const error = new Error('Category not found');

      addEntryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.create(createEntryDto, mockUser)).rejects.toThrow(
        NotFoundException,
      );

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);

      // Verify error metrics
      expect(metricsSpy.hasRecordedApiError('entry_create')).toBe(true);
    });

    it('should handle validation errors and log security event', async () => {
      // Arrange
      const createEntryDto: CreateEntryDto = {
        amount: -100,
        description: '',
        type: 'INCOME',
        isFixed: true,
        categoryId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        date: '2024-01-15',
      };

      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const validationError = new Error('Amount must be greater than zero');

      addEntryUseCase.execute.mockRejectedValue(validationError);

      // Act & Assert
      await expect(controller.create(createEntryDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);

      // Verify error metrics
      expect(metricsSpy.hasRecordedApiError('entry_create')).toBe(true);
    });

    it('should handle general errors with default message', async () => {
      // Arrange
      const createEntryDto: CreateEntryDto = {
        amount: 1000.0,
        description: 'Test Entry',
        type: 'INCOME',
        isFixed: false,
        categoryId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        date: '2024-01-15',
      };

      const mockUser = { id: 'user-123', email: 'test@example.com' };
      // Error that doesn't match "not found" or validation patterns
      const generalError = new Error('Database connection timeout');

      addEntryUseCase.execute.mockRejectedValue(generalError);

      // Act & Assert
      await expect(controller.create(createEntryDto, mockUser)).rejects.toThrow(
        'Failed to create entry',
      );

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);

      // Verify metrics
      expect(metricsSpy.hasRecordedApiError('entry_create')).toBe(true);
    });

    it('should measure request duration in logs', async () => {
      // Arrange
      const createEntryDto: CreateEntryDto = {
        amount: 500.0,
        description: 'Groceries',
        type: 'EXPENSE',
        isFixed: false,
        categoryId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        date: '2024-01-15',
      };

      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockEntry = MockEntryFactory.create({
        id: 'entry-123',
        amount: 500.0,
        description: 'Groceries',
        type: 'EXPENSE',
        isFixed: false,
        categoryId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        userId: 'user-123',
        date: new Date('2024-01-15'),
      });

      addEntryUseCase.execute.mockResolvedValue(mockEntry);

      // Act
      await controller.create(createEntryDto, mockUser);

      // Assert
      const businessEvents = loggerSpy.getBusinessEvents(
        'entry_api_create_success',
      );
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0]).toHaveProperty('duration');
      expect(typeof businessEvents[0].duration).toBe('number');
      expect(businessEvents[0].duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle client error patterns correctly', async () => {
      // Arrange
      const createEntryDto: CreateEntryDto = {
        amount: 1000.0,
        description: 'Test Entry',
        type: 'INCOME',
        isFixed: false,
        categoryId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        date: '2024-01-15',
      };

      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const clientErrors = [
        'validation failed',
        'invalid format',
        'required field missing',
        'must be positive',
        'cannot be empty',
        'already exists',
      ];

      for (const errorMessage of clientErrors) {
        const error = new Error(errorMessage);
        addEntryUseCase.execute.mockRejectedValue(error);

        // Act & Assert
        await expect(
          controller.create(createEntryDto, mockUser),
        ).rejects.toThrow(BadRequestException);

        // Reset mock for next iteration
        jest.clearAllMocks();
        loggerSpy.clear();
        metricsSpy.clear();
      }
    });
  });
});
