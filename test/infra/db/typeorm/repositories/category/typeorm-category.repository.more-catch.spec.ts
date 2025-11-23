import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { TypeormCategoryRepository } from '@infra/db/typeorm/repositories/typeorm-category.repository';
import { CategoryEntity } from '@infra/db/typeorm/entities/category.entity';
import { LoggerSpy } from '../../../../mocks/logging/logger.spy';
import { MetricsSpy } from '../../../../mocks/metrics/metrics.spy';

describe('TypeormCategoryRepository - remaining catch branches', () => {
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

  it('update catch path when findOne throws after update', async () => {
    repo.update.mockResolvedValue({ affected: 1 } as any);
    repo.findOne.mockRejectedValue(new Error('db err'));
    await expect(repository.update('id', { name: 'n' })).rejects.toThrow(
      'db err',
    );
  });

  it('delete catch path when delete throws after found', async () => {
    repo.findOne.mockResolvedValue({ id: 'id', userId: 'u' } as any);
    repo.delete.mockRejectedValue('oops');
    await expect(repository.delete('id')).rejects.toBe('oops');
  });
});
