import { DbRegisterUserUseCase } from "@data/usecases/db-register-user.usecase";
import { DbLoginUserUseCase } from "@data/usecases/db-login-user.usecase";
import { DbRefreshTokenUseCase } from "@data/usecases/db-refresh-token.usecase";
import { TypeormUserRepository } from "@infra/db/typeorm/repositories/typeorm-user.repository";
import { BcryptHasher } from "@infra/implementations/bcrypt-hasher";
import { JwtTokenGenerator } from "@infra/implementations/jwt-token-generator";
import { AuthController } from "@presentation/controllers/auth.controller";
import { JwtStrategy } from "@presentation/strategies/jwt.strategy";
import { getRepositoryToken } from "@nestjs/typeorm";
import { UserEntity } from "@infra/db/typeorm/entities/user.entity";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

// Factory para criar o caso de uso RegisterUser
export const makeRegisterUserUseCase = (
  userRepository: TypeormUserRepository,
  hasher: BcryptHasher,
  tokenGenerator: JwtTokenGenerator
): DbRegisterUserUseCase => {
  return new DbRegisterUserUseCase(userRepository, hasher, tokenGenerator);
};

// Factory para criar o caso de uso LoginUser
export const makeLoginUserUseCase = (
  userRepository: TypeormUserRepository,
  hasher: BcryptHasher,
  tokenGenerator: JwtTokenGenerator
): DbLoginUserUseCase => {
  return new DbLoginUserUseCase(userRepository, hasher, tokenGenerator);
};

// Factory para criar o caso de uso RefreshToken
export const makeRefreshTokenUseCase = (
  tokenGenerator: JwtTokenGenerator,
  userRepository: TypeormUserRepository
): DbRefreshTokenUseCase => {
  return new DbRefreshTokenUseCase(tokenGenerator, userRepository);
};

// Factory para criar o repositório TypeORM
export const makeUserRepository = (
  repository: Repository<UserEntity>
): TypeormUserRepository => {
  return new TypeormUserRepository(repository);
};

// Factory para criar o hasher
export const makeHasher = (): BcryptHasher => {
  return new BcryptHasher();
};

// Factory para criar o token generator
export const makeTokenGenerator = (
  jwtService: JwtService,
  configService: ConfigService
): JwtTokenGenerator => {
  return new JwtTokenGenerator(jwtService, configService);
};

// Factory para criar o controller Auth
export const makeAuthController = (
  registerUserUseCase: DbRegisterUserUseCase,
  loginUserUseCase: DbLoginUserUseCase,
  refreshTokenUseCase: DbRefreshTokenUseCase
): AuthController => {
  return new AuthController(
    registerUserUseCase,
    loginUserUseCase,
    refreshTokenUseCase
  );
};

// Factory para criar a estratégia JWT
export const makeJwtStrategy = (
  configService: ConfigService,
  userRepository: TypeormUserRepository
): JwtStrategy => {
  return new JwtStrategy(configService, userRepository);
};

// Provider completo para uso no módulo NestJS
export const authProviders = [
  {
    provide: "UserRepository",
    useFactory: (repository: Repository<UserEntity>) => {
      return makeUserRepository(repository);
    },
    inject: [getRepositoryToken(UserEntity)],
  },
  {
    provide: "Hasher",
    useValue: makeHasher(),
  },
  {
    provide: "TokenGenerator",
    useFactory: (jwtService: JwtService, configService: ConfigService) => {
      return makeTokenGenerator(jwtService, configService);
    },
    inject: [JwtService, ConfigService],
  },
  {
    provide: DbRegisterUserUseCase,
    useFactory: (
      userRepository: TypeormUserRepository,
      hasher: BcryptHasher,
      tokenGenerator: JwtTokenGenerator
    ) => {
      return new DbRegisterUserUseCase(userRepository, hasher, tokenGenerator);
    },
    inject: ["UserRepository", "Hasher", "TokenGenerator"],
  },
  {
    provide: DbLoginUserUseCase,
    useFactory: (
      userRepository: TypeormUserRepository,
      hasher: BcryptHasher,
      tokenGenerator: JwtTokenGenerator
    ) => {
      return new DbLoginUserUseCase(userRepository, hasher, tokenGenerator);
    },
    inject: ["UserRepository", "Hasher", "TokenGenerator"],
  },
  {
    provide: DbRefreshTokenUseCase,
    useFactory: (
      tokenGenerator: JwtTokenGenerator,
      userRepository: TypeormUserRepository
    ) => {
      return new DbRefreshTokenUseCase(tokenGenerator, userRepository);
    },
    inject: ["TokenGenerator", "UserRepository"],
  },
  {
    provide: JwtStrategy,
    useFactory: (
      configService: ConfigService,
      userRepository: TypeormUserRepository
    ) => {
      return makeJwtStrategy(configService, userRepository);
    },
    inject: [ConfigService, "UserRepository"],
  },
];

// Função utilitária para obter todas as dependências
export const makeAuthDependencies = () => {
  return {
    repository: TypeormUserRepository,
    registerUseCase: DbRegisterUserUseCase,
    loginUseCase: DbLoginUserUseCase,
    refreshTokenUseCase: DbRefreshTokenUseCase,
    controller: AuthController,
    hasher: BcryptHasher,
    tokenGenerator: JwtTokenGenerator,
    strategy: JwtStrategy,
  };
};
