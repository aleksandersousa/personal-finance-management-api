import type { TokenGenerator, UserRepository, Hasher } from '@/data/protocols';
import { DbRegisterUserUseCase } from '@/data/usecases/db-register-user.usecase';
import type { ContextAwareLoggerService } from '@/infra/logging/context-aware-logger.service';

export const makeRegisterUserFactory = (
  userRepository: UserRepository,
  hasher: Hasher,
  tokenGenerator: TokenGenerator,
  logger: ContextAwareLoggerService,
) => {
  return new DbRegisterUserUseCase(
    userRepository,
    hasher,
    tokenGenerator,
    logger,
  );
};
