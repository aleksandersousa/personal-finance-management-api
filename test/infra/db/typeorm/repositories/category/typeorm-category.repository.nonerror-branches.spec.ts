import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { TypeormCategoryRepository } from '@infra/db/typeorm/repositories/typeorm-category.repository';
import { CategoryEntity } from '@infra/db/typeorm/entities/category.entity';
import { LoggerSpy } from '../../../../mocks/logging/logger.spy';
import { MetricsSpy } from '../../../../mocks/metrics/metrics.spy';

describe('TypeormCategoryRepository - non-Error branches for findById and update', () => {
  let repository: TypeormCategoryRepository;
  let testingModule: TestingModule;
  let repo: jest.Mocked<Repository<CategoryEntity>>;
  let logger: LoggerSpy;
  let metrics: MetricsSpy;

  beforeEach(async () => {
    logger = new LoggerSpy();
    metrics = new MetricsSpy();
    repo = {
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
            new TypeormCategoryRepository(repo, logger, metrics),
        },
      ],
    }).compile();

    repository = testingModule.get(TypeormCategoryRepository);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('findById should handle non-Error rejection', async () => {
    (repo.findOne as any).mockRejectedValue('fail');
    await expect(repository.findById('x')).rejects.toBe('fail');
  });

  it('update should handle non-Error rejection from update call', async () => {
    (repo.update as any).mockRejectedValue('boom');
    await expect(repository.update('id', { name: 'n' })).rejects.toBe('boom');
  });
});
