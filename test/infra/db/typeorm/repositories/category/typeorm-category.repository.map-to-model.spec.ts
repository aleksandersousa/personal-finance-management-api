import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { TypeormCategoryRepository } from '@infra/db/typeorm/repositories/typeorm-category.repository';
import { CategoryEntity } from '@infra/db/typeorm/entities/category.entity';
import { LoggerSpy } from '../../../../mocks/logging/logger.spy';
import { MetricsSpy } from '../../../../mocks/metrics/metrics.spy';
import {
  CategoryType,
  CategoryCreateData,
} from '@domain/models/category.model';

describe('TypeormCategoryRepository - mapToModel', () => {
  let repository: TypeormCategoryRepository;
  let testingModule: TestingModule;
  let mockTypeormRepository: jest.Mocked<Repository<CategoryEntity>>;
  let loggerSpy: LoggerSpy;
  let metricsSpy: MetricsSpy;

  const mockUserId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  // Mock data for testing
  const mockCategoryEntity = {
    id: 'test-id',
    name: 'Test Category',
    description: 'Test Description',
    type: CategoryType.INCOME,
    color: '#4CAF50',
    icon: 'work',
    userId: mockUserId,
    isDefault: false,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    deletedAt: null,
    entries: [],
  };

  beforeEach(async () => {
    loggerSpy = new LoggerSpy();
    metricsSpy = new MetricsSpy();

    // Create mock repository
    mockTypeormRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn(),
      count: jest.fn(),
    } as any;

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

  describe('mapToModel (private method coverage)', () => {
    it('should map entity to model correctly through public methods', async () => {
      // Arrange
      const categoryData: CategoryCreateData = {
        name: 'Test Mapping',
        description: 'Test Description',
        type: CategoryType.INCOME,
        color: '#4CAF50',
        icon: 'work',
        userId: mockUserId,
      };

      const entityWithAllFields = {
        ...mockCategoryEntity,
        ...categoryData,
      };

      mockTypeormRepository.create.mockReturnValue(entityWithAllFields as any);
      mockTypeormRepository.save.mockResolvedValue(entityWithAllFields as any);

      // Act
      const result = await repository.create(categoryData);

      // Assert - This tests the private mapToModel method indirectly
      expect(result).toMatchObject({
        id: expect.any(String),
        name: 'Test Mapping',
        description: 'Test Description',
        type: CategoryType.INCOME,
        color: '#4CAF50',
        icon: 'work',
        userId: mockUserId,
        isDefault: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });
});
