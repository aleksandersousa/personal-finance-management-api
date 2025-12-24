import { Test, TestingModule } from '@nestjs/testing';
import { EntryController } from '@presentation/controllers/entry.controller';
import { GetEntriesMonthsYearsUseCase } from '@domain/usecases/get-entries-months-years.usecase';
import { LoggerSpy } from '../../../infra/mocks/logging/logger.spy';
import { MetricsSpy } from '../../../infra/mocks/metrics/metrics.spy';

describe('EntryController - GET_MONTHS_YEARS', () => {
  let controller: EntryController;
  let getEntriesMonthsYearsUseCase: jest.Mocked<GetEntriesMonthsYearsUseCase>;
  let loggerSpy: LoggerSpy;
  let metricsSpy: MetricsSpy;

  beforeEach(async () => {
    getEntriesMonthsYearsUseCase = {
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
        { provide: 'UpdateEntryUseCase', useValue: {} },
        {
          provide: 'GetEntriesMonthsYearsUseCase',
          useValue: getEntriesMonthsYearsUseCase,
        },
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

  describe('getMonthsYears', () => {
    it('should return months and years successfully and log business event', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const mockUseCaseResponse = {
        monthsYears: [
          { year: 2024, month: 2 },
          { year: 2024, month: 1 },
          { year: 2023, month: 12 },
        ],
      };

      getEntriesMonthsYearsUseCase.execute.mockResolvedValue(
        mockUseCaseResponse,
      );

      // Act
      const result = await controller.getMonthsYears(mockUser);

      // Assert
      expect(result.monthsYears).toHaveLength(3);
      expect(result.monthsYears).toEqual([
        { year: 2024, month: 2 },
        { year: 2024, month: 1 },
        { year: 2023, month: 12 },
      ]);

      expect(getEntriesMonthsYearsUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
      });

      // Verify business event logging
      const businessEvents = loggerSpy.getBusinessEvents(
        'entry_api_months_years_success',
      );
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0]).toMatchObject({
        userId: 'user-123',
        metadata: {
          count: 3,
        },
      });

      // Verify metrics
      expect(
        metricsSpy.hasRecordedHttpRequest('GET', '/entries/months-years', 200),
      ).toBe(true);
    });

    it('should return empty array when user has no entries', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const mockUseCaseResponse = {
        monthsYears: [],
      };

      getEntriesMonthsYearsUseCase.execute.mockResolvedValue(
        mockUseCaseResponse,
      );

      // Act
      const result = await controller.getMonthsYears(mockUser);

      // Assert
      expect(result.monthsYears).toHaveLength(0);
      expect(result.monthsYears).toEqual([]);

      expect(getEntriesMonthsYearsUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
      });

      // Verify business event logging
      const businessEvents = loggerSpy.getBusinessEvents(
        'entry_api_months_years_success',
      );
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0]).toMatchObject({
        userId: 'user-123',
        metadata: {
          count: 0,
        },
      });
    });

    it('should handle single month and year', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const mockUseCaseResponse = {
        monthsYears: [{ year: 2024, month: 1 }],
      };

      getEntriesMonthsYearsUseCase.execute.mockResolvedValue(
        mockUseCaseResponse,
      );

      // Act
      const result = await controller.getMonthsYears(mockUser);

      // Assert
      expect(result.monthsYears).toHaveLength(1);
      expect(result.monthsYears).toEqual([{ year: 2024, month: 1 }]);
    });

    it('should handle entries from multiple years', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const mockUseCaseResponse = {
        monthsYears: [
          { year: 2024, month: 5 },
          { year: 2023, month: 12 },
          { year: 2022, month: 6 },
        ],
      };

      getEntriesMonthsYearsUseCase.execute.mockResolvedValue(
        mockUseCaseResponse,
      );

      // Act
      const result = await controller.getMonthsYears(mockUser);

      // Assert
      expect(result.monthsYears).toHaveLength(3);
      expect(result.monthsYears).toEqual([
        { year: 2024, month: 5 },
        { year: 2023, month: 12 },
        { year: 2022, month: 6 },
      ]);
    });

    it('should handle client errors appropriately', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const clientError = new Error('User ID is required');
      getEntriesMonthsYearsUseCase.execute.mockRejectedValue(clientError);

      // Act & Assert
      await expect(controller.getMonthsYears(mockUser)).rejects.toThrow(
        'User ID is required',
      );

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);

      // Verify error metrics
      expect(metricsSpy.hasRecordedApiError('entry_months_years')).toBe(true);
    });

    it('should handle generic errors appropriately', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const error = new Error('Database connection failed');
      getEntriesMonthsYearsUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getMonthsYears(mockUser)).rejects.toThrow(
        'Failed to retrieve months and years',
      );

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);

      // Verify error metrics
      expect(metricsSpy.hasRecordedApiError('entry_months_years')).toBe(true);
    });

    it('should measure request duration in logs', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const mockUseCaseResponse = {
        monthsYears: [{ year: 2024, month: 1 }],
      };

      getEntriesMonthsYearsUseCase.execute.mockResolvedValue(
        mockUseCaseResponse,
      );

      // Act
      await controller.getMonthsYears(mockUser);

      // Assert
      const businessEvents = loggerSpy.getBusinessEvents(
        'entry_api_months_years_success',
      );
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0]).toHaveProperty('duration');
      expect(typeof businessEvents[0].duration).toBe('number');
      expect(businessEvents[0].duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle user not found error', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const notFoundError = new Error('User not found');
      getEntriesMonthsYearsUseCase.execute.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.getMonthsYears(mockUser)).rejects.toThrow(
        'User not found',
      );

      // Verify error logging
      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);
    });
  });
});
