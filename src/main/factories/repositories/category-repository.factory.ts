import { TypeormCategoryRepository } from '@infra/db/typeorm/repositories';
import { CategoryEntity } from '@infra/db/typeorm/entities';
import { Repository } from 'typeorm';

// Factory para criar o repositório de entradas
export const makeCategoryRepository = (
  repository: Repository<CategoryEntity>,
): TypeormCategoryRepository => {
  return new TypeormCategoryRepository(repository);
};
