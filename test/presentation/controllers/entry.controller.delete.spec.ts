import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntryController } from '../../../src/presentation/controllers/entry.controller';
import { DbDeleteEntryUseCase } from '../../../src/data/usecases/db-delete-entry.usecase';
import { DeleteEntryUseCase } from '../../../src/domain/usecases/delete-entry.usecase';
import { LoggerSpy } from '../../infra/mocks/logging/logger.spy';
import { MetricsSpy } from '../../infra/mocks/metrics/metrics.spy';

describe('EntryController - DELETE', () => {
  let controller: EntryController;
  let deleteEntryUseCase: jest.Mocked<DeleteEntryUseCase>;
  let loggerSpy: LoggerSpy;
  let metricsSpy: MetricsSpy;

  beforeEach(async () => {
    deleteEntryUseCase = {
      execute: jest.fn().mockResolvedValue({
        deletedAt: new Date('2025-06-01T15:30:00Z'),
      }),
    };
    loggerSpy = new LoggerSpy();
    metricsSpy = new MetricsSpy();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntryController],
      providers: [
        { provide: 'DbAddEntryUseCase', useValue: {} },
        { provide: 'ListEntriesByMonthUseCase', useValue: {} },
        { provide: DbDeleteEntryUseCase, useValue: deleteEntryUseCase },
        { provide: 'ContextAwareLoggerService', useValue: loggerSpy },
        { provide: 'FinancialMetricsService', useValue: metricsSpy },
      ],
    }).compile();

    controller = module.get<EntryController>(EntryController);
  });

  afterEach(() => {
    loggerSpy.clear();
    metricsSpy.clear();
    jest.clearAllMocks();
  });

  describe('delete', () => {
    it('should delete entry and log business event', async () => {
      // Arrange
      const entryId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const expectedResult = { deletedAt: new Date('2025-06-01T15:30:00Z') };

      deleteEntryUseCase.execute.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.delete(entryId, mockUser);

      // Assert
      expect(result).toEqual({
        deletedAt: expectedResult.deletedAt,
      });

      expect(deleteEntryUseCase.execute).toHaveBeenCalledWith({
        entryId,
        userId: 'user-123',
      });

      // Verify business event logging
      const businessEvents = loggerSpy.getBusinessEvents(
        'entry_api_delete_success',
      );
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0]).toMatchObject({
        entityId: entryId,
        userId: 'user-123',
        deletedAt: expectedResult.deletedAt.toISOString(),
      });

      // Verify metrics
      expect(metricsSpy.hasRecordedMetric('financial_transactions_total')).toBe(
        true,
      );
      const successMetrics = metricsSpy.getMetrics(
        'financial_transactions_total',
      );
      expect(
        successMetrics.some(
          m => m.labels.type === 'delete' && m.labels.status === 'success',
        ),
      ).toBe(true);
    });

    it('should handle not found error and log security event', async () => {
      // Arrange
      const entryId = 'non-existent-entry';
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const error = new Error('Entry not found');

      deleteEntryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.delete(entryId, mockUser)).rejects.toThrow(
        NotFoundException,
      );

      // Verify security event logging
      const securityEvents = loggerSpy.getSecurityEvents('medium');
      expect(securityEvents).toHaveLength(1);
      expect(securityEvents[0]).toMatchObject({
        event: 'entry_api_delete_failed',
        userId: 'user-123',
        entityId: entryId,
        error: 'Entry not found',
      });

      // Verify error metrics
      const errorMetrics = metricsSpy.getMetrics(
        'financial_transactions_total',
      );
      expect(
        errorMetrics.some(
          m => m.labels.type === 'delete' && m.labels.status === 'error',
        ),
      ).toBe(true);
    });

    it('should handle ownership error', async () => {
      // Arrange
      const entryId = 'entry-123';
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const error = new Error('User does not own this entry');

      deleteEntryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.delete(entryId, mockUser)).rejects.toThrow(
        BadRequestException,
      );

      // Verify security event logging
      const securityEvents = loggerSpy.getSecurityEvents('medium');
      expect(securityEvents).toHaveLength(1);
      expect(securityEvents[0]).toMatchObject({
        event: 'entry_api_delete_failed',
        error: 'User does not own this entry',
      });
    });

    it('should handle already deleted error', async () => {
      // Arrange
      const entryId = 'entry-123';
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const error = new Error('Entry is already deleted');

      deleteEntryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.delete(entryId, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle validation errors', async () => {
      // Arrange
      const entryId = 'entry-123';
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const error = new Error('Entry ID is required');

      deleteEntryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.delete(entryId, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle generic errors', async () => {
      // Arrange
      const entryId = 'entry-123';
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const error = new Error('Unexpected error');

      deleteEntryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.delete(entryId, mockUser)).rejects.toThrow(
        new BadRequestException('Failed to delete entry'),
      );
    });

    it('should measure request duration in logs', async () => {
      // Arrange
      const entryId = 'entry-123';
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const expectedResult = { deletedAt: new Date('2025-06-01T15:30:00Z') };

      deleteEntryUseCase.execute.mockResolvedValue(expectedResult);

      // Act
      await controller.delete(entryId, mockUser);

      // Assert
      const businessEvents = loggerSpy.getBusinessEvents(
        'entry_api_delete_success',
      );
      expect(businessEvents[0]).toHaveProperty('duration');
      expect(typeof businessEvents[0].duration).toBe('number');
      expect(businessEvents[0].duration).toBeGreaterThanOrEqual(0);
    });
  });
});
