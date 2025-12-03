import type {
  PasswordResetTokenRepository,
  UserRepository,
  Hasher,
} from '@data/protocols';
import { DbResetPasswordUseCase } from '@/data/usecases/db-reset-password.usecase';
import type { ContextAwareLoggerService } from '@/infra/logging/context-aware-logger.service';

export const makeResetPasswordFactory = (
  passwordResetTokenRepository: PasswordResetTokenRepository,
  userRepository: UserRepository,
  hasher: Hasher,
  logger: ContextAwareLoggerService,
) => {
  return new DbResetPasswordUseCase(
    passwordResetTokenRepository,
    userRepository,
    hasher,
    logger,
  );
};
