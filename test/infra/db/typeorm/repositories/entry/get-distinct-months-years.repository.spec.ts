import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeormEntryRepository } from '@infra/db/typeorm/repositories/typeorm-entry.repository';
import { EntryEntity } from '@infra/db/typeorm/entities/entry.entity';
import { EntryMonthlyPaymentEntity } from '@infra/db/typeorm/entities/entry-monthly-payment.entity';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { FinancialMetricsService } from '@infra/metrics/financial-metrics.service';

describe('TypeormEntryRepository - Get Distinct Months Years', () => {
  let repository: TypeormEntryRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<EntryEntity>>;
  let mockMonthlyPaymentRepository: jest.Mocked<Repository<EntryMonthlyPaymentEntity>>;
  let mockLogger: jest.Mocked<ContextAwareLoggerService>;
  let mockMetrics: jest.Mocked<FinancialMetricsService>;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    mockMonthlyPaymentRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
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
          provide: getRepositoryToken(EntryMonthlyPaymentEntity),
          useValue: mockMonthlyPaymentRepository,
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

  describe('getDistinctMonthsYears', () => {
    it('should get distinct months and years successfully', async () => {
      const userId = 'test-user-id';
      const mockResults = [
        { year: '2024', month: '2' },
        { year: '2024', month: '1' },
        { year: '2023', month: '12' },
      ];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockResults),
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await repository.getDistinctMonthsYears(userId);

      expect(result).toEqual([
        { year: 2024, month: 2 },
        { year: 2024, month: 1 },
        { year: 2023, month: 12 },
      ]);

      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        'EXTRACT(YEAR FROM entry.date)',
        'year',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        'EXTRACT(MONTH FROM entry.date)',
        'month',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'entry.userId = :userId',
        { userId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.deletedAt IS NULL',
      );
      expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith(
        'EXTRACT(YEAR FROM entry.date)',
      );
      expect(mockQueryBuilder.addGroupBy).toHaveBeenCalledWith(
        'EXTRACT(MONTH FROM entry.date)',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'EXTRACT(YEAR FROM entry.date)',
        'DESC',
      );
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'EXTRACT(MONTH FROM entry.date)',
        'DESC',
      );
      expect(mockQueryBuilder.getRawMany).toHaveBeenCalled();

      expect(mockLogger.logBusinessEvent).toHaveBeenCalledWith({
        event: 'distinct_months_years_retrieved',
        userId,
        metadata: expect.objectContaining({
          count: 3,
          duration: expect.any(Number),
        }),
      });

      expect(mockMetrics.recordTransaction).toHaveBeenCalledWith(
        'get_distinct_months_years',
        'success',
      );
    });

    it('should return empty array when user has no entries', async () => {
      const userId = 'test-user-id';
      const mockResults: any[] = [];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockResults),
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await repository.getDistinctMonthsYears(userId);

      expect(result).toEqual([]);
      expect(mockLogger.logBusinessEvent).toHaveBeenCalledWith({
        event: 'distinct_months_years_retrieved',
        userId,
        metadata: expect.objectContaining({
          count: 0,
          duration: expect.any(Number),
        }),
      });
    });

    it('should handle single month and year', async () => {
      const userId = 'test-user-id';
      const mockResults = [{ year: '2024', month: '1' }];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockResults),
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await repository.getDistinctMonthsYears(userId);

      expect(result).toEqual([{ year: 2024, month: 1 }]);
      expect(result).toHaveLength(1);
    });

    it('should handle entries from multiple years', async () => {
      const userId = 'test-user-id';
      const mockResults = [
        { year: '2024', month: '5' },
        { year: '2023', month: '12' },
        { year: '2022', month: '6' },
      ];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockResults),
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await repository.getDistinctMonthsYears(userId);

      expect(result).toEqual([
        { year: 2024, month: 5 },
        { year: 2023, month: 12 },
        { year: 2022, month: 6 },
      ]);
      expect(result).toHaveLength(3);
    });

    it('should handle database errors', async () => {
      const userId = 'test-user-id';
      const error = new Error('Database connection failed');

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockRejectedValue(error),
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      await expect(repository.getDistinctMonthsYears(userId)).rejects.toThrow(
        'Database connection failed',
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        `Failed to get distinct months and years for user ${userId}`,
        error.stack,
      );

      expect(mockMetrics.recordApiError).toHaveBeenCalledWith(
        'get_distinct_months_years',
        error.message,
      );
    });

    it('should parse year and month as integers', async () => {
      const userId = 'test-user-id';
      const mockResults = [
        { year: '2024', month: '1' },
        { year: '2023', month: '12' },
      ];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockResults),
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await repository.getDistinctMonthsYears(userId);

      expect(result[0].year).toBe(2024);
      expect(result[0].month).toBe(1);
      expect(result[1].year).toBe(2023);
      expect(result[1].month).toBe(12);
      expect(typeof result[0].year).toBe('number');
      expect(typeof result[0].month).toBe('number');
    });
  });
});
