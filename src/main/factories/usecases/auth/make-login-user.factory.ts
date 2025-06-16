import type { TokenGenerator, UserRepository, Hasher } from '@/data/protocols';
import { DbLoginUserUseCase } from '@/data/usecases';

export const makeLoginUserFactory = (
  userRepository: UserRepository,
  hasher: Hasher,
  tokenGenerator: TokenGenerator,
) => {
  return new DbLoginUserUseCase(userRepository, hasher, tokenGenerator);
};
