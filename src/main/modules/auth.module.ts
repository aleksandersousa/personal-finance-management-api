import { Module } from "@nestjs/common";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "@presentation/controllers/auth.controller";
import { UserEntity } from "@infra/db/typeorm/entities/user.entity";
import { makeUserRepository } from "@main/factories/auth.factory";
import { BcryptHasher } from "@infra/implementations/bcrypt-hasher";
import { JwtTokenGenerator } from "@infra/implementations/jwt-token-generator";
import { DbRegisterUserUseCase } from "@data/usecases/db-register-user.usecase";
import { DbLoginUserUseCase } from "@data/usecases/db-login-user.usecase";
import { DbRefreshTokenUseCase } from "@data/usecases/db-refresh-token.usecase";
import { JwtStrategy } from "@presentation/strategies/jwt.strategy";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_ACCESS_SECRET"),
        signOptions: { expiresIn: configService.get<string>("JWT_EXPIRES_IN") },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: "UserRepository",
      useFactory: (repository) => makeUserRepository(repository),
      inject: [getRepositoryToken(UserEntity)],
    },
    {
      provide: "Hasher",
      useClass: BcryptHasher,
    },
    {
      provide: "TokenGenerator",
      useClass: JwtTokenGenerator,
    },
    {
      provide: "RegisterUserUseCase",
      useFactory: (userRepository, hasher, tokenGenerator) =>
        new DbRegisterUserUseCase(userRepository, hasher, tokenGenerator),
      inject: ["UserRepository", "Hasher", "TokenGenerator"],
    },
    {
      provide: "LoginUserUseCase",
      useFactory: (userRepository, hasher, tokenGenerator) =>
        new DbLoginUserUseCase(userRepository, hasher, tokenGenerator),
      inject: ["UserRepository", "Hasher", "TokenGenerator"],
    },
    {
      provide: "RefreshTokenUseCase",
      useFactory: (tokenGenerator, userRepository) =>
        new DbRefreshTokenUseCase(tokenGenerator, userRepository),
      inject: ["TokenGenerator", "UserRepository"],
    },
    {
      provide: JwtStrategy,
      useFactory: (configService, userRepository) =>
        new JwtStrategy(configService, userRepository),
      inject: [ConfigService, "UserRepository"],
    },
  ],
  exports: [
    "RegisterUserUseCase",
    "LoginUserUseCase",
    "RefreshTokenUseCase",
    JwtStrategy,
    "UserRepository",
  ],
})
export class AuthModule {}
