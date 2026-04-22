import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { TypeormCategoryRepository } from '@infra/db/typeorm/repositories/typeorm-category.repository';
import { CategoryEntity } from '@infra/db/typeorm/entities/category.entity';
import { LoggerSpy } from '../../../../mocks/logging/logger.spy';
import { MetricsSpy } from '../../../../mocks/metrics/metrics.spy';
import { Category, CategoryType } from '@domain/models/category.model';

describe('TypeormCategoryRepository - findByUserIdAndName', () => {
  let repository: TypeormCategoryRepository;
  let testingModule: TestingModule;
  let mockTypeormRepository: jest.Mocked<Repository<CategoryEntity>>;
  let loggerSpy: LoggerSpy;
  let metricsSpy: MetricsSpy;

  const mockUserId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  const mockCategoryEntity = {
    id: 'test-id',
    name: 'Test Category',
    description: 'Test Description',
    type: CategoryType.INCOME,
    color: '#4CAF50',
    icon: 'work',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    deletedAt: null,
    entries: [],
  };

  const mockCategory: Category = {
    id: 'test-id',
    name: 'Test Category',
    description: 'Test Description',
    type: CategoryType.INCOME,
    color: '#4CAF50',
    icon: 'work',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  beforeEach(async () => {
    loggerSpy = new LoggerSpy();
    metricsSpy = new MetricsSpy();

    mockTypeormRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
      count: jest.fn(),
    } as any;

    mockTypeormRepository.createQueryBuilder.mockReturnValue(
      mockQueryBuilder as any,
    );

    testingModule = await Test.createTestingModule({
      providers: [
        {
          provide: TypeormCategoryRepository,
          useFactory: () => {
            return new TypeormCategoryRepository(
              mockTypeormRepository,
              loggerSpy,
              metricsSpy,
            );
          },
        },
      ],
    }).compile();

    repository = testingModule.get<TypeormCategoryRepository>(
      TypeormCategoryRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    loggerSpy.clear();
    metricsSpy.clear();
  });

  afterAll(async () => {
    await testingModule.close();
  });

  describe('findByUserIdAndName', () => {
    it('should find category by user id and name successfully', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockCategoryEntity as any);

      const result = await repository.findByUserIdAndName(
        mockUserId,
        'Test Category',
      );

      expect(result).toMatchObject(mockCategory);
      expect(mockTypeormRepository.createQueryBuilder).toHaveBeenCalledWith(
        'category',
      );
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'category.users',
        'user',
        'user.id = :userId',
        { userId: mockUserId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'category.name = :name',
        { name: 'Test Category' },
      );

      expect(metricsSpy.hasRecordedMetric('financial_transactions_total')).toBe(
        true,
      );
      const transactionMetrics = metricsSpy.getMetricsByFilter(
        'financial_transactions_total',
      );
      expect(transactionMetrics[0].labels).toMatchObject({
        type: 'category_find_by_user_id_and_name',
        status: 'success',
      });
    });

    it('should return null when category not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const result = await repository.findByUserIdAndName(
        mockUserId,
        'Non-existent Category',
      );

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockQueryBuilder.getOne.mockRejectedValue(error);

      await expect(
        repository.findByUserIdAndName(mockUserId, 'Any Category'),
      ).rejects.toThrow();

      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);
      expect(loggerSpy.loggedErrors[0].message).toContain(
        'Failed to find category by userId and name',
      );

      expect(metricsSpy.hasRecordedMetric('api_errors_total')).toBe(true);
      const errorMetrics = metricsSpy.getMetricsByFilter('api_errors_total');
      expect(errorMetrics[0].labels.endpoint).toBe(
        'category_repository_find_by_user_id_and_name',
      );
    });

    it('should log and rethrow on error', async () => {
      mockQueryBuilder.getOne.mockRejectedValue('err');
      await expect(repository.findByUserIdAndName('u', 'n')).rejects.toBe(
        'err',
      );
    });
  });
});
