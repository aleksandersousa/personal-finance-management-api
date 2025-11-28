import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TypeormEntryRepository } from '@infra/db/typeorm/repositories/typeorm-entry.repository';
import { EntryEntity } from '@infra/db/typeorm/entities/entry.entity';
import { FindEntriesByMonthFilters } from '@data/protocols/entry-repository';
import { ContextAwareLoggerService } from '@infra/logging/context-aware-logger.service';
import { FinancialMetricsService } from '@infra/metrics/financial-metrics.service';

describe('TypeormEntryRepository', () => {
  let repository: TypeormEntryRepository;
  let testingModule: TestingModule;
  let mockRepository: jest.Mocked<Repository<EntryEntity>>;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<EntryEntity>>;
  let mockLogger: jest.Mocked<ContextAwareLoggerService>;
  let mockMetrics: jest.Mocked<FinancialMetricsService>;

  const mockEntryEntity: EntryEntity = {
    id: 'entry-1',
    userId: 'user-123',
    description: 'Test Entry',
    amount: 1000,
    date: new Date('2024-01-15'),
    type: 'INCOME',
    isFixed: false,
    categoryId: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as EntryEntity;

  beforeEach(async () => {
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
      getMany: jest.fn(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    } as any;

    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
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

  describe('create', () => {
    it('should create and save an entry', async () => {
      const createData = {
        userId: 'user-123',
        description: 'Test Entry',
        amount: 1000,
        date: new Date('2024-01-15'),
        type: 'INCOME' as const,
        isFixed: false,
        categoryId: null,
      };

      mockRepository.create.mockReturnValue(mockEntryEntity);
      mockRepository.save.mockResolvedValue(mockEntryEntity);

      const result = await repository.create(createData);

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: createData.userId,
        description: createData.description,
        amount: createData.amount,
        date: createData.date,
        type: createData.type,
        isFixed: createData.isFixed,
        categoryId: createData.categoryId,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockEntryEntity);
      expect(result.id).toBe(mockEntryEntity.id);
      expect(result.amount).toBe(Number(mockEntryEntity.amount));
    });
  });

  describe('findById', () => {
    it('should find an entry by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockEntryEntity);

      const result = await repository.findById('entry-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        relations: ['user', 'category'],
      });
      expect(result).toEqual({
        id: mockEntryEntity.id,
        userId: mockEntryEntity.userId,
        description: mockEntryEntity.description,
        amount: Number(mockEntryEntity.amount),
        date: mockEntryEntity.date,
        type: mockEntryEntity.type,
        isFixed: mockEntryEntity.isFixed,
        categoryId: mockEntryEntity.categoryId,
        deletedAt: mockEntryEntity.deletedAt,
        createdAt: mockEntryEntity.createdAt,
        updatedAt: mockEntryEntity.updatedAt,
      });
    });

    it('should return null when entry not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find entries by user id', async () => {
      const mockEntries = [mockEntryEntity];
      mockRepository.find.mockResolvedValue(mockEntries);

      const result = await repository.findByUserId('user-123');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        relations: ['user', 'category'],
        order: { date: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findByUserIdAndMonth', () => {
    it('should find entries by user id and month', async () => {
      const mockEntries = [mockEntryEntity];
      mockQueryBuilder.getMany.mockResolvedValue(mockEntries);

      const result = await repository.findByUserIdAndMonth('user-123', 2024, 1);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('entry');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'entry.userId = :userId',
        { userId: 'user-123' },
      );
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update an entry', async () => {
      const updateData = {
        description: 'Updated Entry',
        amount: 2000,
      };

      mockRepository.update.mockResolvedValue({
        affected: 1,
        generatedMaps: [],
        raw: {},
      });
      mockRepository.findOne.mockResolvedValue({
        ...mockEntryEntity,
        ...updateData,
      });

      const result = await repository.update('entry-1', updateData);

      expect(mockRepository.update).toHaveBeenCalledWith('entry-1', updateData);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        relations: ['user', 'category'],
      });
      expect(result.description).toBe(updateData.description);
      expect(result.amount).toBe(updateData.amount);
    });

    it('should throw error when entry not found after update', async () => {
      mockRepository.update.mockResolvedValue({
        affected: 1,
        generatedMaps: [],
        raw: {},
      });
      mockRepository.findOne.mockResolvedValue(null);

      await expect(repository.update('non-existent', {})).rejects.toThrow(
        'Entry not found',
      );
    });

    it('should handle partial updates with all fields', async () => {
      const updateData = {
        userId: 'user-456',
        description: 'New Description',
        amount: 1500,
        date: new Date('2024-02-01'),
        type: 'EXPENSE' as const,
        isFixed: true,
        categoryId: 'category-123',
      };

      mockRepository.update.mockResolvedValue({
        affected: 1,
        generatedMaps: [],
        raw: {},
      });
      mockRepository.findOne.mockResolvedValue({
        ...mockEntryEntity,
        ...updateData,
      });

      const result = await repository.update('entry-1', updateData);

      expect(mockRepository.update).toHaveBeenCalledWith('entry-1', updateData);
      expect(result.userId).toBe(updateData.userId);
      expect(result.type).toBe(updateData.type);
    });
  });

  describe('delete', () => {
    it('should delete an entry', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await expect(repository.delete('entry-1')).resolves.not.toThrow();

      expect(mockRepository.delete).toHaveBeenCalledWith('entry-1');
    });

    it('should throw error when entry not found', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0, raw: {} });

      await expect(repository.delete('non-existent')).rejects.toThrow(
        'Entry not found',
      );
    });
  });

  describe('findByUserIdAndMonthWithFilters', () => {
    const mockEntries = [
      {
        id: 'entry-1',
        userId: 'user-123',
        description: 'Salary',
        amount: 5000,
        date: new Date('2024-01-15'),
        type: 'INCOME',
        isFixed: true,
        categoryId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'entry-2',
        userId: 'user-123',
        description: 'Rent',
        amount: 1500,
        date: new Date('2024-01-01'),
        type: 'EXPENSE',
        isFixed: true,
        categoryId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as EntryEntity[];

    it('should build correct query with basic filters', async () => {
      const filters: FindEntriesByMonthFilters = {
        userId: 'user-123',
        year: 2024,
        month: 1,
      };

      mockQueryBuilder.getCount.mockResolvedValue(2);
      mockQueryBuilder.getMany.mockResolvedValue(mockEntries);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '5000',
        totalExpenses: '1500',
      });

      await repository.findByUserIdAndMonthWithFilters(filters);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('entry');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'entry.userId = :userId',
        { userId: 'user-123' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.date >= :startDate',
        expect.any(Object),
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.date <= :endDate',
        expect.any(Object),
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'entry.user',
        'user',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'entry.category',
        'category',
      );
    });

    it('should apply type filter when provided', async () => {
      const filters: FindEntriesByMonthFilters = {
        userId: 'user-123',
        year: 2024,
        month: 1,
        type: 'INCOME',
      };

      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue([mockEntries[0]]);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '5000',
        totalExpenses: '0',
      });

      await repository.findByUserIdAndMonthWithFilters(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.type = :type',
        { type: 'INCOME' },
      );
    });

    it('should apply category filter when provided', async () => {
      const filters: FindEntriesByMonthFilters = {
        userId: 'user-123',
        year: 2024,
        month: 1,
        categoryId: 'category-123',
      };

      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue([mockEntries[0]]);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '5000',
        totalExpenses: '0',
      });

      await repository.findByUserIdAndMonthWithFilters(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.categoryId = :categoryId',
        { categoryId: 'category-123' },
      );
    });

    it('should apply sorting correctly', async () => {
      const filters: FindEntriesByMonthFilters = {
        userId: 'user-123',
        year: 2024,
        month: 1,
        sort: 'amount',
        order: 'asc',
      };

      mockQueryBuilder.getCount.mockResolvedValue(2);
      mockQueryBuilder.getMany.mockResolvedValue(mockEntries);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '5000',
        totalExpenses: '1500',
      });

      await repository.findByUserIdAndMonthWithFilters(filters);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'entry.amount',
        'ASC',
      );
    });

    it('should apply pagination correctly', async () => {
      const filters: FindEntriesByMonthFilters = {
        userId: 'user-123',
        year: 2024,
        month: 1,
        page: 2,
        limit: 10,
      };

      mockQueryBuilder.getCount.mockResolvedValue(25);
      mockQueryBuilder.getMany.mockResolvedValue(mockEntries);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '5000',
        totalExpenses: '1500',
      });

      await repository.findByUserIdAndMonthWithFilters(filters);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10); // (page - 1) * limit
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should return correct result structure', async () => {
      const filters: FindEntriesByMonthFilters = {
        userId: 'user-123',
        year: 2024,
        month: 1,
      };

      mockQueryBuilder.getCount.mockResolvedValue(2);
      mockQueryBuilder.getMany.mockResolvedValue(mockEntries);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '5000',
        totalExpenses: '1500',
      });

      const result = await repository.findByUserIdAndMonthWithFilters(filters);

      expect(result).toEqual({
        data: expect.any(Array),
        total: 2,
        totalIncome: 5000,
        totalExpenses: 1500,
      });
      expect(result.data).toHaveLength(2);
    });

    it('should handle default values correctly', async () => {
      const filters: FindEntriesByMonthFilters = {
        userId: 'user-123',
        year: 2024,
        month: 1,
        // No page, limit, sort, order provided - should use defaults
      };

      mockQueryBuilder.getCount.mockResolvedValue(2);
      mockQueryBuilder.getMany.mockResolvedValue(mockEntries);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '5000',
        totalExpenses: '1500',
      });

      await repository.findByUserIdAndMonthWithFilters(filters);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0); // (1 - 1) * 20
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'entry.date',
        'DESC',
      );
    });

    it("should not apply type filter when type is 'all'", async () => {
      const filters: FindEntriesByMonthFilters = {
        userId: 'user-123',
        year: 2024,
        month: 1,
        type: 'all',
      };

      mockQueryBuilder.getCount.mockResolvedValue(2);
      mockQueryBuilder.getMany.mockResolvedValue(mockEntries);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '5000',
        totalExpenses: '1500',
      });

      await repository.findByUserIdAndMonthWithFilters(filters);

      // Should not call andWhere with type filter
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'entry.type = :type',
        expect.any(Object),
      );
    });

    it("should not apply category filter when categoryId is 'all'", async () => {
      const filters: FindEntriesByMonthFilters = {
        userId: 'user-123',
        year: 2024,
        month: 1,
        categoryId: 'all',
      };

      mockQueryBuilder.getCount.mockResolvedValue(2);
      mockQueryBuilder.getMany.mockResolvedValue(mockEntries);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '5000',
        totalExpenses: '1500',
      });

      await repository.findByUserIdAndMonthWithFilters(filters);

      // Should not call andWhere with categoryId filter
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'entry.categoryId = :categoryId',
        expect.any(Object),
      );
    });

    it('should use default sort field for invalid sort parameter', async () => {
      const filters: FindEntriesByMonthFilters = {
        userId: 'user-123',
        year: 2024,
        month: 1,
        sort: 'invalid-sort-field', // Invalid sort field, should fallback to 'date'
      };

      mockQueryBuilder.getCount.mockResolvedValue(2);
      mockQueryBuilder.getMany.mockResolvedValue(mockEntries);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: '5000',
        totalExpenses: '1500',
      });

      await repository.findByUserIdAndMonthWithFilters(filters);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'entry.date', // Should fallback to 'date'
        'DESC',
      );
    });

    it('should handle null summary result', async () => {
      const filters: FindEntriesByMonthFilters = {
        userId: 'user-123',
        year: 2024,
        month: 1,
      };

      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getRawOne.mockResolvedValue(null); // null summary result

      const result = await repository.findByUserIdAndMonthWithFilters(filters);

      expect(result).toEqual({
        data: [],
        total: 0,
        totalIncome: 0, // Should fallback to 0
        totalExpenses: 0, // Should fallback to 0
      });
    });

    it('should handle summary result with null values', async () => {
      const filters: FindEntriesByMonthFilters = {
        userId: 'user-123',
        year: 2024,
        month: 1,
      };

      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue([mockEntries[0]]);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: null, // null income
        totalExpenses: null, // null expenses
      });

      const result = await repository.findByUserIdAndMonthWithFilters(filters);

      expect(result).toEqual({
        data: expect.any(Array),
        total: 1,
        totalIncome: 0, // Should convert null to 0
        totalExpenses: 0, // Should convert null to 0
      });
    });
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

  describe('getMonthlySummaryStats', () => {
    const mockSummaryStats = {
      totalIncome: '5000.00',
      totalExpenses: '3000.00',
      fixedIncome: '4000.00',
      dynamicIncome: '1000.00',
      fixedExpenses: '2000.00',
      dynamicExpenses: '1000.00',
      totalEntries: '10',
      incomeEntries: '4',
      expenseEntries: '6',
    };

    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1234567890);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should get monthly summary stats successfully', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue(mockSummaryStats);

      const result = await repository.getMonthlySummaryStats(
        'user-123',
        2024,
        1,
      );

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('entry');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        "SUM(CASE WHEN entry.type = 'INCOME' THEN entry.amount ELSE 0 END)",
        'totalIncome',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        "SUM(CASE WHEN entry.type = 'EXPENSE' THEN entry.amount ELSE 0 END)",
        'totalExpenses',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        "SUM(CASE WHEN entry.type = 'INCOME' AND entry.isFixed = true THEN entry.amount ELSE 0 END)",
        'fixedIncome',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        "SUM(CASE WHEN entry.type = 'INCOME' AND entry.isFixed = false THEN entry.amount ELSE 0 END)",
        'dynamicIncome',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        "SUM(CASE WHEN entry.type = 'EXPENSE' AND entry.isFixed = true THEN entry.amount ELSE 0 END)",
        'fixedExpenses',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        "SUM(CASE WHEN entry.type = 'EXPENSE' AND entry.isFixed = false THEN entry.amount ELSE 0 END)",
        'dynamicExpenses',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        'COUNT(*)',
        'totalEntries',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        "COUNT(CASE WHEN entry.type = 'INCOME' THEN 1 END)",
        'incomeEntries',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        "COUNT(CASE WHEN entry.type = 'EXPENSE' THEN 1 END)",
        'expenseEntries',
      );

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'entry.userId = :userId',
        { userId: 'user-123' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.date >= :startDate',
        { startDate: new Date(2024, 0, 1) },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.date <= :endDate',
        { endDate: new Date(2024, 1, 0, 23, 59, 59) },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.deletedAt IS NULL',
      );

      expect(result).toEqual({
        totalIncome: 5000,
        totalExpenses: 3000,
        fixedIncome: 4000,
        dynamicIncome: 1000,
        fixedExpenses: 2000,
        dynamicExpenses: 1000,
        totalEntries: 10,
        incomeEntries: 4,
        expenseEntries: 6,
      });

      // Verify business event logging
      expect(mockLogger.logBusinessEvent).toHaveBeenCalledWith({
        event: 'monthly_summary_stats_calculated',
        userId: 'user-123',
        metadata: {
          year: 2024,
          month: 1,
          duration: 0, // Date.now() - startTime mocked to return 0
        },
      });

      // Verify metrics recording
      expect(mockMetrics.recordTransaction).toHaveBeenCalledWith(
        'get_monthly_summary_stats',
        'success',
      );
    });

    it('should handle null values in summary stats', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalIncome: null,
        totalExpenses: null,
        fixedIncome: null,
        dynamicIncome: null,
        fixedExpenses: null,
        dynamicExpenses: null,
        totalEntries: null,
        incomeEntries: null,
        expenseEntries: null,
      });

      const result = await repository.getMonthlySummaryStats(
        'user-123',
        2024,
        1,
      );

      expect(result).toEqual({
        totalIncome: 0,
        totalExpenses: 0,
        fixedIncome: 0,
        dynamicIncome: 0,
        fixedExpenses: 0,
        dynamicExpenses: 0,
        totalEntries: 0,
        incomeEntries: 0,
        expenseEntries: 0,
      });
    });

    it('should handle undefined result from query', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue(undefined);

      const result = await repository.getMonthlySummaryStats(
        'user-123',
        2024,
        1,
      );

      expect(result).toEqual({
        totalIncome: 0,
        totalExpenses: 0,
        fixedIncome: 0,
        dynamicIncome: 0,
        fixedExpenses: 0,
        dynamicExpenses: 0,
        totalEntries: 0,
        incomeEntries: 0,
        expenseEntries: 0,
      });
    });

    it('should handle database errors during getMonthlySummaryStats', async () => {
      const dbError = new Error('Database query failed');
      mockQueryBuilder.getRawOne.mockRejectedValue(dbError);

      await expect(
        repository.getMonthlySummaryStats('user-123', 2024, 1),
      ).rejects.toThrow('Database query failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get monthly summary stats for user user-123',
        dbError.stack,
      );
      expect(mockMetrics.recordApiError).toHaveBeenCalledWith(
        'get_monthly_summary_stats',
        'Database query failed',
      );
    });

    it('should calculate correct date range for different months', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue(mockSummaryStats);

      // Test February 2024 (leap year)
      await repository.getMonthlySummaryStats('user-123', 2024, 2);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.date >= :startDate',
        { startDate: new Date(2024, 1, 1) }, // February 1st
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.date <= :endDate',
        { endDate: new Date(2024, 2, 0, 23, 59, 59) }, // February 29th (leap year)
      );
    });

    it('should calculate correct date range for December', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue(mockSummaryStats);

      await repository.getMonthlySummaryStats('user-123', 2024, 12);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.date >= :startDate',
        { startDate: new Date(2024, 11, 1) }, // December 1st
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.date <= :endDate',
        { endDate: new Date(2024, 12, 0, 23, 59, 59) }, // December 31st
      );
    });
  });

  describe('getCategorySummaryForMonth', () => {
    const mockCategorySummaryResults = [
      {
        entry_categoryId: 'category-1',
        category_name: 'Food',
        entry_type: 'EXPENSE',
        sum: '1500.00',
        count: '5',
      },
      {
        entry_categoryId: 'category-2',
        category_name: 'Salary',
        entry_type: 'INCOME',
        sum: '5000.00',
        count: '1',
      },
      {
        entry_categoryId: 'category-3',
        category_name: null, // Test null category name
        entry_type: 'EXPENSE',
        sum: '500.00',
        count: '2',
      },
    ];

    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1234567890);
      mockQueryBuilder.leftJoin = jest.fn().mockReturnThis();
      mockQueryBuilder.groupBy = jest.fn().mockReturnThis();
      mockQueryBuilder.getRawMany = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should get category summary for month successfully', async () => {
      // Mock query builder - we get all results then slice to top 3
      mockQueryBuilder.getRawMany.mockResolvedValue(mockCategorySummaryResults);

      const result = await repository.getCategorySummaryForMonth(
        'user-123',
        2024,
        1,
      );

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('entry');
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'entry.category',
        'category',
      );
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'entry.categoryId',
        'category.name',
        'entry.type',
        'SUM(entry.amount)',
        'COUNT(*)',
      ]);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'entry.userId = :userId',
        { userId: 'user-123' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.date >= :startDate',
        { startDate: new Date(2024, 0, 1) },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.date <= :endDate',
        { endDate: new Date(2024, 1, 0, 23, 59, 59) },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.deletedAt IS NULL',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.categoryId IS NOT NULL',
      );
      expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith(
        'entry.categoryId, category.name, entry.type',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'SUM(entry.amount)',
        'DESC',
      );

      expect(result).toEqual({
        items: [
          {
            categoryId: 'category-1',
            categoryName: 'Food',
            type: 'EXPENSE',
            total: 1500,
            count: 5,
          },
          {
            categoryId: 'category-2',
            categoryName: 'Salary',
            type: 'INCOME',
            total: 5000,
            count: 1,
          },
          {
            categoryId: 'category-3',
            categoryName: 'Unknown Category', // Should default to 'Unknown Category'
            type: 'EXPENSE',
            total: 500,
            count: 2,
          },
        ],
        incomeTotal: 1,
        expenseTotal: 2,
      });

      // Verify business event logging
      expect(mockLogger.logBusinessEvent).toHaveBeenCalledWith({
        event: 'category_summary_calculated',
        userId: 'user-123',
        metadata: {
          year: 2024,
          month: 1,
          categoriesCount: 3,
          incomeTotal: 1,
          expenseTotal: 2,
          duration: 0, // Date.now() - startTime mocked to return 0
        },
      });

      // Verify metrics recording
      expect(mockMetrics.recordTransaction).toHaveBeenCalledWith(
        'get_category_summary',
        'success',
      );
    });

    it('should handle empty results', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await repository.getCategorySummaryForMonth(
        'user-123',
        2024,
        1,
      );

      expect(result).toEqual({
        items: [],
        incomeTotal: 0,
        expenseTotal: 0,
      });

      // Verify business event logging with zero categories
      expect(mockLogger.logBusinessEvent).toHaveBeenCalledWith({
        event: 'category_summary_calculated',
        userId: 'user-123',
        metadata: {
          year: 2024,
          month: 1,
          categoriesCount: 0,
          incomeTotal: 0,
          expenseTotal: 0,
          duration: 0,
        },
      });
    });

    it('should handle null values in result data', async () => {
      const resultsWithNulls = [
        {
          entry_categoryId: 'category-1',
          category_name: 'Food',
          entry_type: 'EXPENSE',
          sum: null, // null sum
          count: null, // null count
        },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(resultsWithNulls);

      const result = await repository.getCategorySummaryForMonth(
        'user-123',
        2024,
        1,
      );

      expect(result).toEqual({
        items: [
          {
            categoryId: 'category-1',
            categoryName: 'Food',
            type: 'EXPENSE',
            total: 0, // Should convert null to 0
            count: 0, // Should convert null to 0
          },
        ],
        incomeTotal: 0,
        expenseTotal: 1,
      });
    });

    it('should handle database errors during getCategorySummaryForMonth', async () => {
      const dbError = new Error('Database query failed');
      mockQueryBuilder.getRawMany.mockRejectedValue(dbError);

      await expect(
        repository.getCategorySummaryForMonth('user-123', 2024, 1),
      ).rejects.toThrow('Database query failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get category summary for user user-123',
        dbError.stack,
      );
      expect(mockMetrics.recordApiError).toHaveBeenCalledWith(
        'get_category_summary',
        'Database query failed',
      );
    });

    it('should calculate correct date range for different months', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      // Test June 2024
      await repository.getCategorySummaryForMonth('user-123', 2024, 6);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.date >= :startDate',
        { startDate: new Date(2024, 5, 1) }, // June 1st
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.date <= :endDate',
        { endDate: new Date(2024, 6, 0, 23, 59, 59) }, // June 30th
      );
    });

    it('should handle undefined sum and count values', async () => {
      const resultsWithUndefined = [
        {
          entry_categoryId: 'category-1',
          category_name: 'Food',
          entry_type: 'EXPENSE',
          sum: undefined,
          count: undefined,
        },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(resultsWithUndefined);

      const result = await repository.getCategorySummaryForMonth(
        'user-123',
        2024,
        1,
      );

      expect(result).toEqual({
        items: [
          {
            categoryId: 'category-1',
            categoryName: 'Food',
            type: 'EXPENSE',
            total: 0, // Should convert undefined to 0
            count: 0, // Should convert undefined to 0
          },
        ],
        incomeTotal: 0,
        expenseTotal: 1,
      });
    });

    it('should get category summary for a specific month', async () => {
      // Arrange
      const userId = 'test-user-id';
      const year = 2023;
      const month = 10;
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const mockResults = [
        {
          entry_categoryId: 'cat1',
          category_name: 'Food',
          entry_type: 'EXPENSE',
          sum: '150.50',
          count: '3',
        },
        {
          entry_categoryId: 'cat2',
          category_name: 'Salary',
          entry_type: 'INCOME',
          sum: '5000.00',
          count: '1',
        },
      ];

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockResults),
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      // Act
      const result = await repository.getCategorySummaryForMonth(
        userId,
        year,
        month,
      );

      // Assert
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('entry');
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'entry.category',
        'category',
      );
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'entry.categoryId',
        'category.name',
        'entry.type',
        'SUM(entry.amount)',
        'COUNT(*)',
      ]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'entry.userId = :userId',
        { userId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.date >= :startDate',
        { startDate },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.date <= :endDate',
        { endDate },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.deletedAt IS NULL',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.categoryId IS NOT NULL',
      );
      expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith(
        'entry.categoryId, category.name, entry.type',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'SUM(entry.amount)',
        'DESC',
      );
      expect(mockQueryBuilder.getRawMany).toHaveBeenCalled();

      expect(result.items).toHaveLength(2);
      expect(result.incomeTotal).toBe(1);
      expect(result.expenseTotal).toBe(1);
      expect(result.items[0]).toEqual({
        categoryId: 'cat1',
        categoryName: 'Food',
        type: 'EXPENSE',
        total: 150.5,
        count: 3,
      });
      expect(result.items[1]).toEqual({
        categoryId: 'cat2',
        categoryName: 'Salary',
        type: 'INCOME',
        total: 5000,
        count: 1,
      });

      expect(mockLogger.logBusinessEvent).toHaveBeenCalledWith({
        event: 'category_summary_calculated',
        userId,
        metadata: expect.objectContaining({
          year,
          month,
          categoriesCount: 2,
          incomeTotal: 1,
          expenseTotal: 1,
          duration: expect.any(Number),
        }),
      });

      expect(mockMetrics.recordTransaction).toHaveBeenCalledWith(
        'get_category_summary',
        'success',
      );
    });

    it('should handle errors when getting category summary', async () => {
      // Arrange
      const userId = 'test-user-id';
      const year = 2023;
      const month = 10;
      const error = new Error('Database error');

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockRejectedValue(error),
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      // Act & Assert
      await expect(
        repository.getCategorySummaryForMonth(userId, year, month),
      ).rejects.toThrow(error);

      expect(mockLogger.error).toHaveBeenCalledWith(
        `Failed to get category summary for user ${userId}`,
        error.stack,
      );

      expect(mockMetrics.recordApiError).toHaveBeenCalledWith(
        'get_category_summary',
        error.message,
      );
    });
  });

  describe('getFixedEntriesSummary', () => {
    it('should get fixed entries summary', async () => {
      // Arrange
      const userId = 'test-user-id';
      const mockResult = {
        fixedIncome: '5000.00',
        fixedExpenses: '2500.00',
        entriesCount: '5',
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockResult),
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      // Act
      const result = await repository.getFixedEntriesSummary(userId);

      // Assert
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('entry');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        "SUM(CASE WHEN entry.type = 'INCOME' AND entry.isFixed = true THEN entry.amount ELSE 0 END)",
        'fixedIncome',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        "SUM(CASE WHEN entry.type = 'EXPENSE' AND entry.isFixed = true THEN entry.amount ELSE 0 END)",
        'fixedExpenses',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        'COUNT(CASE WHEN entry.isFixed = true THEN 1 END)',
        'entriesCount',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'entry.userId = :userId',
        { userId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.deletedAt IS NULL',
      );
      expect(mockQueryBuilder.getRawOne).toHaveBeenCalled();

      expect(result).toEqual({
        fixedIncome: 5000,
        fixedExpenses: 2500,
        fixedNetFlow: 2500,
        entriesCount: 5,
      });

      expect(mockLogger.logBusinessEvent).toHaveBeenCalledWith({
        event: 'fixed_entries_summary_calculated',
        userId,
        metadata: expect.objectContaining({
          fixedIncome: 5000,
          fixedExpenses: 2500,
          fixedNetFlow: 2500,
          entriesCount: 5,
          duration: expect.any(Number),
        }),
      });

      expect(mockMetrics.recordTransaction).toHaveBeenCalledWith(
        'get_fixed_entries_summary',
        'success',
      );
    });

    it('should handle null result from database query', async () => {
      // This test targets lines 449 and 475 where parseFloat and parseInt handle null/undefined values
      const userId = 'test-user-id';

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null), // null result to test fallback
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      // Act
      const result = await repository.getFixedEntriesSummary(userId);

      // Assert
      expect(result).toEqual({
        fixedIncome: 0, // parseFloat(null?.fixedIncome || '0')
        fixedExpenses: 0, // parseFloat(null?.fixedExpenses || '0')
        fixedNetFlow: 0,
        entriesCount: 0, // parseInt(null?.entriesCount || '0')
      });

      expect(mockLogger.logBusinessEvent).toHaveBeenCalledWith({
        event: 'fixed_entries_summary_calculated',
        userId,
        metadata: expect.objectContaining({
          fixedIncome: 0,
          fixedExpenses: 0,
          fixedNetFlow: 0,
          entriesCount: 0,
          duration: expect.any(Number),
        }),
      });
    });

    it('should handle undefined values in database result', async () => {
      // This test targets lines 449 and 475 with undefined values in the result object
      const userId = 'test-user-id';
      const mockResult = {
        fixedIncome: undefined, // Test undefined fixedIncome
        fixedExpenses: undefined, // Test undefined fixedExpenses
        entriesCount: undefined, // Test undefined entriesCount
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockResult),
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      // Act
      const result = await repository.getFixedEntriesSummary(userId);

      // Assert
      expect(result).toEqual({
        fixedIncome: 0, // parseFloat(undefined || '0')
        fixedExpenses: 0, // parseFloat(undefined || '0')
        fixedNetFlow: 0,
        entriesCount: 0, // parseInt(undefined || '0')
      });

      expect(mockLogger.logBusinessEvent).toHaveBeenCalledWith({
        event: 'fixed_entries_summary_calculated',
        userId,
        metadata: expect.objectContaining({
          fixedIncome: 0,
          fixedExpenses: 0,
          fixedNetFlow: 0,
          entriesCount: 0,
        }),
      });
    });

    it('should handle empty string values in database result', async () => {
      // This test ensures parseFloat and parseInt handle empty strings correctly
      const userId = 'test-user-id';
      const mockResult = {
        fixedIncome: '', // Empty string
        fixedExpenses: '', // Empty string
        entriesCount: '', // Empty string
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockResult),
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      // Act
      const result = await repository.getFixedEntriesSummary(userId);

      // Assert
      expect(result).toEqual({
        fixedIncome: 0, // parseFloat('' || '0')
        fixedExpenses: 0, // parseFloat('' || '0')
        fixedNetFlow: 0,
        entriesCount: 0, // parseInt('' || '0')
      });
    });

    it('should handle errors when getting fixed entries summary', async () => {
      // Arrange
      const userId = 'test-user-id';
      const error = new Error('Database error');

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockRejectedValue(error),
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      // Act & Assert
      await expect(repository.getFixedEntriesSummary(userId)).rejects.toThrow(
        error,
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        `Failed to get fixed entries summary for user ${userId}`,
        error.stack,
      );

      expect(mockMetrics.recordApiError).toHaveBeenCalledWith(
        'get_fixed_entries_summary',
        error.message,
      );
    });
  });

  describe('getCurrentBalance', () => {
    it('should get current balance', async () => {
      // Arrange
      const userId = 'test-user-id';
      const mockResult = {
        totalIncome: '8000.00',
        totalExpenses: '3500.00',
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockResult),
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      // Act
      const result = await repository.getCurrentBalance(userId);

      // Assert
      expect(result).toBe(4500);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('entry');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        "SUM(CASE WHEN entry.type = 'INCOME' THEN entry.amount ELSE 0 END)",
        'totalIncome',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        "SUM(CASE WHEN entry.type = 'EXPENSE' THEN entry.amount ELSE 0 END)",
        'totalExpenses',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'entry.userId = :userId',
        { userId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.deletedAt IS NULL',
      );
      expect(mockQueryBuilder.getRawOne).toHaveBeenCalled();
      expect(mockLogger.logBusinessEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'current_balance_calculated',
          userId,
          metadata: expect.objectContaining({
            totalIncome: 8000,
            totalExpenses: 3500,
            currentBalance: 4500,
          }),
        }),
      );
      expect(mockMetrics.recordTransaction).toHaveBeenCalledWith(
        'get_current_balance',
        'success',
      );
    });

    it('should handle null result from database', async () => {
      // Arrange
      const userId = 'test-user-id';
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      // Act
      const result = await repository.getCurrentBalance(userId);

      // Assert
      expect(result).toBe(0);
      expect(mockLogger.logBusinessEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'current_balance_calculated',
          userId,
          metadata: expect.objectContaining({
            totalIncome: 0,
            totalExpenses: 0,
            currentBalance: 0,
          }),
        }),
      );
    });

    it('should handle empty string values from database', async () => {
      // Arrange
      const userId = 'test-user-id';
      const mockResult = {
        totalIncome: '',
        totalExpenses: '',
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockResult),
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      // Act
      const result = await repository.getCurrentBalance(userId);

      // Assert
      expect(result).toBe(0);
      expect(mockLogger.logBusinessEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'current_balance_calculated',
          userId,
          metadata: expect.objectContaining({
            totalIncome: 0,
            totalExpenses: 0,
            currentBalance: 0,
          }),
        }),
      );
    });

    it('should handle negative balance', async () => {
      // Arrange
      const userId = 'test-user-id';
      const mockResult = {
        totalIncome: '1000.00',
        totalExpenses: '3000.00',
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockResult),
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      // Act
      const result = await repository.getCurrentBalance(userId);

      // Assert
      expect(result).toBe(-2000);
      expect(mockLogger.logBusinessEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'current_balance_calculated',
          userId,
          metadata: expect.objectContaining({
            totalIncome: 1000,
            totalExpenses: 3000,
            currentBalance: -2000,
          }),
        }),
      );
    });

    it('should handle database error', async () => {
      // Arrange
      const userId = 'test-user-id';
      const mockError = new Error('Database connection error');
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockRejectedValue(mockError),
      };

      mockRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      // Act & Assert
      await expect(repository.getCurrentBalance(userId)).rejects.toThrow(
        mockError,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Failed to get current balance for user ${userId}`,
        mockError.stack,
      );
      expect(mockMetrics.recordApiError).toHaveBeenCalledWith(
        'get_current_balance',
        mockError.message,
      );
    });
  });
});
