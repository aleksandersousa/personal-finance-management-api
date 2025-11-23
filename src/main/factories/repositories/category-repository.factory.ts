import { TypeormCategoryRepository } from '@infra/db/typeorm/repositories';
import { CategoryEntity } from '@infra/db/typeorm/entities';
import { Repository } from 'typeorm';
import type { Logger, Metrics } from '@/data/protocols';

// Factory para criar o repositório de categorias
export const makeCategoryRepository = (
  repository: Repository<CategoryEntity>,
  logger: Logger,
  metrics: Metrics,
): TypeormCategoryRepository => {
  return new TypeormCategoryRepository(repository, logger, metrics);
};
