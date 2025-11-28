import { Test, TestingModule } from '@nestjs/testing';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TypeormCategoryRepository } from '@infra/db/typeorm/repositories/typeorm-category.repository';
import { CategoryEntity } from '@infra/db/typeorm/entities/category.entity';
import { LoggerSpy } from '../../../../mocks/logging/logger.spy';
import { MetricsSpy } from '../../../../mocks/metrics/metrics.spy';
import { CategoryType } from '@domain/models/category.model';

describe('TypeormCategoryRepository - catch branches', () => {
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

  it('findByUserId should log and rethrow on error', async () => {
    mockTypeormRepository.find.mockRejectedValue('err');
    await expect(repository.findByUserId('u')).rejects.toBe('err');
    expect(loggerSpy.getErrorsCount()).toBeGreaterThan(0);
    expect(metricsSpy.hasRecordedMetric('api_errors_total')).toBe(true);
  });

  it('findByUserIdAndType should log and rethrow on error', async () => {
    mockTypeormRepository.find.mockRejectedValue('err');
    await expect(
      repository.findByUserIdAndType('u', CategoryType.INCOME),
    ).rejects.toBe('err');
  });

  it('findByUserIdAndName should log and rethrow on error', async () => {
    mockTypeormRepository.findOne.mockRejectedValue('err');
    await expect(repository.findByUserIdAndName('u', 'n')).rejects.toBe('err');
  });

  it('findWithFilters should log and rethrow on error', async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getRawAndEntities: jest.fn(),
      getCount: jest.fn().mockRejectedValue('err'),
    } as unknown as jest.Mocked<SelectQueryBuilder<CategoryEntity>>;
    (mockTypeormRepository.createQueryBuilder as any).mockReturnValue(qb);

    await expect(
      repository.findWithFilters({
        userId: 'u',
        type: 'all' as any,
        includeStats: false,
      }),
    ).rejects.toBe('err');
  });

  it('delete should log and rethrow on error', async () => {
    mockTypeormRepository.findOne.mockRejectedValue('err');
    await expect(repository.delete('id')).rejects.toBe('err');
  });

  it('softDelete should log and rethrow on error', async () => {
    mockTypeormRepository.softDelete.mockRejectedValue('err');
    await expect(repository.softDelete('id')).rejects.toBe('err');
  });

  it('hasEntriesAssociated should log and rethrow on error', async () => {
    const qb = {
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockRejectedValue('err'),
    } as any;
    (mockTypeormRepository.createQueryBuilder as any).mockReturnValue(qb);
    await expect(repository.hasEntriesAssociated('id')).rejects.toBe('err');
  });
});
