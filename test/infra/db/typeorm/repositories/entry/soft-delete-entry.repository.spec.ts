import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeormEntryRepository } from '@infra/db/typeorm/repositories/typeorm-entry.repository';
import { EntryEntity } from '@infra/db/typeorm/entities/entry.entity';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { FinancialMetricsService } from '@infra/metrics/financial-metrics.service';

describe('TypeormEntryRepository - Soft Delete Entry', () => {
  let repository: TypeormEntryRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<EntryEntity>>;
  let mockLogger: jest.Mocked<ContextAwareLoggerService>;
  let mockMetrics: jest.Mocked<FinancialMetricsService>;

  beforeEach(async () => {
    mockRepository = {
      update: jest.fn(),
    } as any;

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      logBusinessEvent: jest.fn(),
    } as any;

    mockMetrics = {
      recordHttpRequest: jest.fn(),
      recordAuthEvent: jest.fn(),
      recordTransaction: jest.fn(),
      recordApiError: jest.fn(),
      updateActiveUsers: jest.fn(),
      getMetrics: jest.fn(),
    } as any;

    testingModule = await Test.createTestingModule({
      providers: [
        TypeormEntryRepository,
        {
          provide: getRepositoryToken(EntryEntity),
          useValue: mockRepository,
        },
        {
          provide: 'Logger',
          useValue: mockLogger,
        },
        {
          provide: 'Metrics',
          useValue: mockMetrics,
        },
      ],
    }).compile();

    repository = testingModule.get<TypeormEntryRepository>(
      TypeormEntryRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('softDelete', () => {
    it('should soft delete an entry and return deletedAt timestamp', async () => {
      mockRepository.update.mockResolvedValue({
        affected: 1,
        generatedMaps: [],
        raw: {},
      });

      const result = await repository.softDelete('entry-1');

      expect(mockRepository.update).toHaveBeenCalledWith('entry-1', {
        deletedAt: expect.any(Date),
      });
      expect(result).toBeInstanceOf(Date);
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Entry soft deleted',
        'TypeormEntryRepository',
      );
      expect(mockMetrics.recordTransaction).toHaveBeenCalledWith(
        'delete',
        'success',
      );
    });

    it('should throw error when entry not found', async () => {
      mockRepository.update.mockResolvedValue({
        affected: 0,
        generatedMaps: [],
        raw: {},
      });

      await expect(repository.softDelete('non-existent')).rejects.toThrow(
        'Entry not found',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to soft delete entry - entry not found',
        '',
        'TypeormEntryRepository',
      );
    });

    it('should handle database errors during soft delete', async () => {
      const dbError = new Error('Database connection failed');
      mockRepository.update.mockRejectedValue(dbError);

      await expect(repository.softDelete('entry-1')).rejects.toThrow(
        'Database connection failed',
      );

      expect(mockMetrics.recordTransaction).toHaveBeenCalledWith(
        'delete',
        'error',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to soft delete entry entry-1',
        dbError.stack,
      );
    });
  });
});
