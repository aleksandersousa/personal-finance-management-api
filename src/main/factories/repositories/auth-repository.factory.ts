import { TypeormUserRepository } from '@infra/db/typeorm/repositories/typeorm-user.repository';
import { UserEntity } from '@infra/db/typeorm/entities/user.entity';
import { UserSettingEntity } from '@infra/db/typeorm/entities/user-setting.entity';
import { Repository } from 'typeorm';

export const makeUserRepository = (
  userRepository: Repository<UserEntity>,
  userSettingRepository: Repository<UserSettingEntity>,
): TypeormUserRepository => {
  return new TypeormUserRepository(userRepository, userSettingRepository);
};
