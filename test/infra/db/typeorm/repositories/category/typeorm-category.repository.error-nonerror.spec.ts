import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { TypeormCategoryRepository } from '@infra/db/typeorm/repositories/typeorm-category.repository';
import { CategoryEntity } from '@infra/db/typeorm/entities/category.entity';
import { LoggerSpy } from '../../../../mocks/logging/logger.spy';
import { MetricsSpy } from '../../../../mocks/metrics/metrics.spy';

describe('TypeormCategoryRepository - non-Error exceptions', () => {
  let repository: TypeormCategoryRepository;
  let testingModule: TestingModule;
  let mockTypeormRepository: jest.Mocked<Repository<CategoryEntity>>;
  let loggerSpy: LoggerSpy;
  let metricsSpy: MetricsSpy;

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
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn(),
      count: jest.fn(),
    } as any;

    testingModule = await Test.createTestingModule({
      providers: [
        {
          provide: TypeormCategoryRepository,
          useFactory: () =>
            new TypeormCategoryRepository(
              mockTypeormRepository,
              loggerSpy,
              metricsSpy,
            ),
        },
      ],
    }).compile();

    repository = testingModule.get(TypeormCategoryRepository);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('create should rethrow non-Error exception and log/metric', async () => {
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
