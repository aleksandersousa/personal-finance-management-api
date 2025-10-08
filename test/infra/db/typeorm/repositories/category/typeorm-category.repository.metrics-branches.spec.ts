import { Test, TestingModule } from '@nestjs/testing';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TypeormCategoryRepository } from '@infra/db/typeorm/repositories/typeorm-category.repository';
import { CategoryEntity } from '@infra/db/typeorm/entities/category.entity';
import { LoggerSpy } from '../../../../mocks/logging/logger.spy';
import { CategoryType } from '@domain/models/category.model';

describe('TypeormCategoryRepository - metrics off branches', () => {
  let repository: TypeormCategoryRepository;
  let testingModule: TestingModule;
  let mockTypeormRepository: jest.Mocked<Repository<CategoryEntity>>;
  let loggerSpy: LoggerSpy;

  const mockUserId = 'user-1';

  const baseEntity: CategoryEntity = {
    id: 'id1',
    name: 'Name',
    description: 'Desc',
    type: CategoryType.EXPENSE,
    color: '#000',
    icon: 'i',
    userId: mockUserId,
    isDefault: false,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    deletedAt: null as any,
    entries: [],
  } as any;

  beforeEach(async () => {
    loggerSpy = new LoggerSpy();

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
          useFactory: () =>
            // Pass metrics as undefined to hit the `if (this.metrics)` false branches
            new TypeormCategoryRepository(
              mockTypeormRepository,
              loggerSpy,
              undefined as any,
            ),
        },
      ],
    }).compile();

    repository = testingModule.get(TypeormCategoryRepository);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('findById without metrics should not attempt to record metrics', async () => {
    mockTypeormRepository.findOne.mockResolvedValue(baseEntity as any);
    const result = await repository.findById('id1');
    expect(result).toMatchObject({ id: 'id1', name: 'Name' });
  });

  it('findByUserId without metrics should return mapped categories', async () => {
    mockTypeormRepository.find.mockResolvedValue([baseEntity] as any);
    const result = await repository.findByUserId(mockUserId);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'id1', userId: mockUserId });
  });

  it('findWithFilters without metrics should work for includeStats=false', async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawAndEntities: jest
        .fn()
        .mockResolvedValue({ raw: [], entities: [baseEntity] }),
    } as unknown as jest.Mocked<SelectQueryBuilder<CategoryEntity>>;
    (mockTypeormRepository.createQueryBuilder as any).mockReturnValue(qb);

    const result = await repository.findWithFilters({
      userId: mockUserId,
      type: 'all' as any,
      includeStats: false,
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'id1' });
  });
});
