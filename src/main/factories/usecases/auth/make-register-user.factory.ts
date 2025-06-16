import type { TokenGenerator, UserRepository, Hasher } from '@/data/protocols';
import { DbRegisterUserUseCase } from '@/data/usecases/db-register-user.usecase';

export const makeRegisterUserFactory = (
  userRepository: UserRepository,
  hasher: Hasher,
  tokenGenerator: TokenGenerator,
) => {
  return new DbRegisterUserUseCase(userRepository, hasher, tokenGenerator);
};
