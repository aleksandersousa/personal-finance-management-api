import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntryController } from '@presentation/controllers/entry.controller';
import { UpdateEntryUseCase } from '@domain/usecases/update-entry.usecase';
import { MockEntryFactory } from '@test/domain/mocks/models/entry.mock';
import { LoggerSpy } from '@test/infra/mocks/logging/logger.spy';
import { MetricsSpy } from '@test/infra/mocks/metrics/metrics.spy';
import { UpdateEntryDto } from '@presentation/dtos';

describe('EntryController - UPDATE', () => {
  let controller: EntryController;
  let updateEntryUseCase: jest.Mocked<UpdateEntryUseCase>;
  let loggerSpy: LoggerSpy;
  let metricsSpy: MetricsSpy;

  beforeEach(async () => {
    updateEntryUseCase = {
      execute: jest.fn(),
    };
    loggerSpy = new LoggerSpy();
    metricsSpy = new MetricsSpy();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntryController],
      providers: [
        { provide: 'AddEntryUseCase', useValue: {} },
        { provide: 'ListEntriesByMonthUseCase', useValue: {} },
        { provide: 'DeleteEntryUseCase', useValue: {} },
        { provide: 'UpdateEntryUseCase', useValue: updateEntryUseCase },
        { provide: 'GetEntriesMonthsYearsUseCase', useValue: {} },
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

  describe('update', () => {
    it('should update entry and log business event', async () => {
      // Arrange
      const entryId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const updateDto: UpdateEntryDto = {
        description: 'Updated Monthly Salary',
        amount: 5200.0,
        date: '2025-01-15T10:00:00Z',
        type: 'INCOME',
        isFixed: true,
        categoryId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const expectedEntry = MockEntryFactory.create({
        id: entryId,
        description: 'Updated Monthly Salary',
        amount: 5200.0,
        type: 'INCOME',
        isFixed: true,
        categoryId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        userId: 'user-123',
        date: new Date('2025-01-15T10:00:00Z'),
        updatedAt: new Date(),
      });

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

      // Verify business event logging
      const businessEvents = loggerSpy.getBusinessEvents(
        'entry_api_update_success',
      );
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0]).toMatchObject({
        entityId: entryId,
        userId: 'user-123',
        metadata: {
          type: 'INCOME',
          amount: 5200.0,
          isFixed: true,
        },
      });

      // Verify metrics
      expect(
        metricsSpy.hasRecordedHttpRequest('PUT', '/entries/:id', 200),
      ).toBe(true);
    });

    it('should handle validation errors and throw BadRequestException', async () => {
      // Arrange
      const entryId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const updateDto: UpdateEntryDto = {
        description: '',
        amount: -100,
        date: '2025-01-15T10:00:00Z',
        type: 'INCOME',
        isFixed: true,
        categoryId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const error = new Error('Amount must be greater than zero');

      updateEntryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.update(entryId, updateDto, mockUser),
      ).rejects.toThrow(BadRequestException);

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);

      // Verify error metrics
      expect(metricsSpy.hasRecordedApiError('entry_update')).toBe(true);
    });

    it('should handle not found errors and throw NotFoundException', async () => {
      // Arrange
      const entryId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const updateDto: UpdateEntryDto = {
        description: 'Updated Entry',
        amount: 100.0,
        date: '2025-01-15T10:00:00Z',
        type: 'EXPENSE',
        isFixed: false,
        categoryId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const error = new Error('Entry not found');

      updateEntryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.update(entryId, updateDto, mockUser),
      ).rejects.toThrow(NotFoundException);

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);

      // Verify error metrics
      expect(metricsSpy.hasRecordedApiError('entry_update')).toBe(true);
    });

    it('should handle unauthorized errors and throw NotFoundException with access denied message', async () => {
      // Arrange
      const entryId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const updateDto: UpdateEntryDto = {
        description: 'Updated Entry',
        amount: 100.0,
        date: '2025-01-15T10:00:00Z',
        type: 'EXPENSE',
        isFixed: false,
        categoryId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const error = new Error('User unauthorized to perform this action');

      updateEntryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.update(entryId, updateDto, mockUser),
      ).rejects.toThrow(
        new NotFoundException('Entry not found or access denied'),
      );

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);

      // Verify error metrics
      expect(metricsSpy.hasRecordedApiError('entry_update')).toBe(true);
    });

    it('should handle category not found errors', async () => {
      // Arrange
      const entryId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const updateDto: UpdateEntryDto = {
        description: 'Updated Entry',
        amount: 100.0,
        date: '2025-01-15T10:00:00Z',
        type: 'EXPENSE',
        isFixed: false,
        categoryId: 'non-existent-category',
      };
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const error = new Error('Category not found');

      updateEntryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.update(entryId, updateDto, mockUser),
      ).rejects.toThrow(NotFoundException);

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);
    });

    it('should handle generic errors and throw BadRequestException', async () => {
      // Arrange
      const entryId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const updateDto: UpdateEntryDto = {
        description: 'Updated Entry',
        amount: 100.0,
        date: '2025-01-15T10:00:00Z',
        type: 'EXPENSE',
        isFixed: false,
        categoryId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const error = new Error('Database connection failed');

      updateEntryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.update(entryId, updateDto, mockUser),
      ).rejects.toThrow(BadRequestException);

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);

      // Verify metrics
      expect(metricsSpy.hasRecordedApiError('entry_update')).toBe(true);
    });

    it('should measure request duration in logs', async () => {
      // Arrange
      const entryId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const updateDto: UpdateEntryDto = {
        description: 'Measured Update',
        amount: 750.0,
        date: '2025-01-15T10:00:00Z',
        type: 'EXPENSE',
        isFixed: false,
        categoryId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const expectedEntry = MockEntryFactory.create({
        id: entryId,
        description: 'Measured Update',
        amount: 750.0,
        type: 'EXPENSE',
        isFixed: false,
        categoryId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        userId: 'user-123',
        date: new Date('2025-01-15T10:00:00Z'),
        updatedAt: new Date(),
      });

      updateEntryUseCase.execute.mockResolvedValue(expectedEntry);

      // Act
      await controller.update(entryId, updateDto, mockUser);

      // Assert
      const businessEvents = loggerSpy.getBusinessEvents(
        'entry_api_update_success',
      );
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0]).toHaveProperty('duration');
      expect(typeof businessEvents[0].duration).toBe('number');
      expect(businessEvents[0].duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle client error patterns correctly', async () => {
      // Arrange
      const entryId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const updateDto: UpdateEntryDto = {
        description: 'Test Entry',
        amount: 100.0,
        date: '2025-01-15T10:00:00Z',
        type: 'INCOME',
        isFixed: false,
        categoryId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const clientErrors = [
        'validation failed',
        'invalid format',
        'required field missing',
        'must be positive',
        'cannot be empty',
      ];

      for (const errorMessage of clientErrors) {
        const error = new Error(errorMessage);
        updateEntryUseCase.execute.mockRejectedValue(error);

        // Act & Assert
        await expect(
          controller.update(entryId, updateDto, mockUser),
        ).rejects.toThrow(BadRequestException);

        // Reset mock for next iteration
        jest.clearAllMocks();
        loggerSpy.clear();
        metricsSpy.clear();
      }
    });
  });
});
