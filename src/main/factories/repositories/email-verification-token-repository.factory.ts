import { TypeormEmailVerificationTokenRepository } from '@infra/db/typeorm/repositories/typeorm-email-verification-token.repository';
import { EmailVerificationTokenEntity } from '@infra/db/typeorm/entities/email-verification-token.entity';
import { Repository } from 'typeorm';

export const makeEmailVerificationTokenRepository = (
  repository: Repository<EmailVerificationTokenEntity>,
): TypeormEmailVerificationTokenRepository => {
  return new TypeormEmailVerificationTokenRepository(repository);
};
