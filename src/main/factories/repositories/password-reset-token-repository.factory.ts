import { TypeormPasswordResetTokenRepository } from '@infra/db/typeorm/repositories/typeorm-password-reset-token.repository';
import { PasswordResetTokenEntity } from '@infra/db/typeorm/entities/password-reset-token.entity';
import { Repository } from 'typeorm';

export const makePasswordResetTokenRepository = (
  repository: Repository<PasswordResetTokenEntity>,
): TypeormPasswordResetTokenRepository => {
  return new TypeormPasswordResetTokenRepository(repository);
};
