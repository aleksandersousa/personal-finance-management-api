import type { TokenGenerator, UserRepository, Hasher } from '@/data/protocols';
import { DbLoginUserUseCase } from '@/data/usecases';
import type { ContextAwareLoggerService } from '@/infra/logging/context-aware-logger.service';

export const makeLoginUserFactory = (
  userRepository: UserRepository,
  hasher: Hasher,
  tokenGenerator: TokenGenerator,
  logger: ContextAwareLoggerService,
) => {
  return new DbLoginUserUseCase(userRepository, hasher, tokenGenerator, logger);
};
