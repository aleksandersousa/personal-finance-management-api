import type { TokenGenerator, UserRepository, Hasher } from '@/data/protocols';
import { DbLoginUserUseCase } from '@/data/usecases';
import type { ContextAwareLoggerService } from '@/infra/logging/context-aware-logger.service';
import type { LoginAttemptTracker } from '@/infra/cache/login-attempt-tracker.service';

export const makeLoginUserFactory = (
  userRepository: UserRepository,
  hasher: Hasher,
  tokenGenerator: TokenGenerator,
  logger: ContextAwareLoggerService,
  loginAttemptTracker: LoginAttemptTracker,
) => {
  return new DbLoginUserUseCase(
    userRepository,
    hasher,
    tokenGenerator,
    logger,
    loginAttemptTracker,
  );
};
