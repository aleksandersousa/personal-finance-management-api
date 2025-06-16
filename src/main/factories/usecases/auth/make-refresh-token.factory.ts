import type { TokenGenerator, UserRepository } from '@/data/protocols';
import { DbRefreshTokenUseCase } from '@/data/usecases';

export const makeRefreshTokenFactory = (
  tokenGenerator: TokenGenerator,
  userRepository: UserRepository,
) => {
  return new DbRefreshTokenUseCase(tokenGenerator, userRepository);
};
