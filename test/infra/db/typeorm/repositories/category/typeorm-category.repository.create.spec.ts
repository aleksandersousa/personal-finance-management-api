import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { TypeormCategoryRepository } from '@infra/db/typeorm/repositories/typeorm-category.repository';
import { CategoryEntity } from '@infra/db/typeorm/entities/category.entity';
import { LoggerSpy } from '../../../../mocks/logging/logger.spy';
import { MetricsSpy } from '../../../../mocks/metrics/metrics.spy';
import {
  Category,
  CategoryType,
  CategoryCreateData,
} from '@domain/models/category.model';

describe('TypeormCategoryRepository - create', () => {
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

  const mockQbLink = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(0),
  };

  const mockRelationAdd = jest.fn().mockResolvedValue(undefined);
  const mockQbRelation = {
    relation: jest.fn().mockReturnValue({
      of: jest.fn().mockReturnValue({
        add: mockRelationAdd,
      }),
    }),
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

    mockTypeormRepository.createQueryBuilder.mockImplementation(
      (alias?: string) => {
        if (alias === 'category') {
          return mockQbLink as any;
        }
        return mockQbRelation as any;
      },
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
    mockQbLink.getCount.mockResolvedValue(0);
    mockRelationAdd.mockResolvedValue(undefined);
    loggerSpy.clear();
    metricsSpy.clear();
  });

  afterAll(async () => {
    await testingModule.close();
  });

  describe('create', () => {
    it('should create category successfully', async () => {
      const categoryData: CategoryCreateData = {
        name: 'Test Category',
        description: 'Test Description',
        type: CategoryType.INCOME,
        color: '#4CAF50',
        icon: 'work',
        userId: mockUserId,
      };

      mockTypeormRepository.findOne.mockResolvedValue(null);
      mockTypeormRepository.create.mockReturnValue(mockCategoryEntity as any);
      mockTypeormRepository.save.mockResolvedValue(mockCategoryEntity as any);

      const result = await repository.create(categoryData);

      expect(result).toMatchObject(mockCategory);
      expect(mockTypeormRepository.create).toHaveBeenCalledWith({
        name: categoryData.name,
        description: categoryData.description,
        type: categoryData.type,
        color: categoryData.color,
        icon: categoryData.icon,
      });
      expect(mockTypeormRepository.save).toHaveBeenCalledWith(
        mockCategoryEntity,
      );
      expect(mockRelationAdd).toHaveBeenCalledWith(mockUserId);

      const businessEvents = loggerSpy.getBusinessEvents('category_created');
      expect(businessEvents).toHaveLength(1);
      expect(businessEvents[0]).toMatchObject({
        event: 'category_created',
        entityId: result.id,
        userId: mockUserId,
        metadata: {
          categoryName: 'Test Category',
          categoryType: CategoryType.INCOME,
        },
      });

      expect(metricsSpy.hasRecordedMetric('financial_transactions_total')).toBe(
        true,
      );
      const transactionMetrics = metricsSpy.getMetricsByFilter(
        'financial_transactions_total',
      );
      expect(transactionMetrics[0].labels).toMatchObject({
        type: 'category_create',
        status: 'success',
      });
    });

    it('should create category with minimal data', async () => {
      const categoryData: CategoryCreateData = {
        name: 'Minimal Category',
        type: CategoryType.EXPENSE,
        userId: mockUserId,
      };

      const minimalEntity = {
        ...mockCategoryEntity,
        name: 'Minimal Category',
        type: CategoryType.EXPENSE,
        description: null,
        color: null,
        icon: null,
      };

      mockTypeormRepository.findOne.mockResolvedValue(null);
      mockTypeormRepository.create.mockReturnValue(minimalEntity as any);
      mockTypeormRepository.save.mockResolvedValue(minimalEntity as any);

      const result = await repository.create(categoryData);

      expect(result.name).toBe(categoryData.name);
      expect(result.description).toBeNull();
      expect(result.type).toBe(categoryData.type);
      expect(result.color).toBeNull();
      expect(result.icon).toBeNull();
    });

    it('should handle database errors and log them', async () => {
      const categoryData: CategoryCreateData = {
        name: 'Test Category',
        type: CategoryType.INCOME,
        userId: mockUserId,
      };

      const error = new Error('Database connection error');
      mockTypeormRepository.findOne.mockResolvedValue(null);
      mockTypeormRepository.create.mockReturnValue(mockCategoryEntity as any);
      mockTypeormRepository.save.mockRejectedValue(error);

      await expect(repository.create(categoryData)).rejects.toThrow();

      expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);
      const lastError = loggerSpy.loggedErrors[0];
      expect(lastError.message).toContain('Failed to create category');

      expect(metricsSpy.hasRecordedMetric('api_errors_total')).toBe(true);
      const errorMetrics = metricsSpy.getMetricsByFilter('api_errors_total');
      expect(errorMetrics[0].labels).toMatchObject({
        endpoint: 'category_repository_create',
      });
    });

    it('should rethrow non-Error exception and log/metric', async () => {
      mockTypeormRepository.findOne.mockResolvedValue(null);
      mockTypeormRepository.create.mockImplementation(() => ({}) as any);
      (mockTypeormRepository.save as any).mockRejectedValue('db-failure');
      await expect(
        repository.create({
          name: 'n',
          description: 'd',
          type: 'income' as any,
          color: '#',
          icon: 'i',
          userId: 'u',
        }),
      ).rejects.toBe('db-failure');
    });
  });
});
