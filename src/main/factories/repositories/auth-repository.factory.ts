import { TypeormUserRepository } from '@infra/db/typeorm/repositories/typeorm-user.repository';
import { UserEntity } from '@infra/db/typeorm/entities/user.entity';
import { Repository } from 'typeorm';

// Factory para criar o repositório TypeORM
export const makeUserRepository = (
  repository: Repository<UserEntity>,
): TypeormUserRepository => {
  return new TypeormUserRepository(repository);
};
