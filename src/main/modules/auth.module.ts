import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from '@presentation/controllers';
import { UserEntity } from '@infra/db/typeorm/entities/user.entity';
import { makeUserRepository } from '@/main/factories/repositories';
import { BcryptHasher } from '@infra/implementations/bcrypt-hasher';
import { JwtTokenGenerator } from '@infra/implementations/jwt-token-generator';
import { JwtStrategy } from '@presentation/strategies/jwt.strategy';
import {
  makeJwtStrategyFactory,
  makeLoginUserFactory,
  makeRefreshTokenFactory,
  makeRegisterUserFactory,
} from '../factories';
import { ContextAwareLoggerService } from '@/infra/logging/context-aware-logger.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: 'UserRepository',
      useFactory: makeUserRepository,
      inject: [getRepositoryToken(UserEntity)],
    },
    {
      provide: 'Hasher',
      useClass: BcryptHasher,
    },
    {
      provide: 'TokenGenerator',
      useClass: JwtTokenGenerator,
    },
    {
      provide: 'Logger',
      useClass: ContextAwareLoggerService,
    },
    {
      provide: 'RegisterUserUseCase',
      useFactory: makeRegisterUserFactory,
      inject: ['UserRepository', 'Hasher', 'TokenGenerator', 'Logger'],
    },
    {
      provide: 'LoginUserUseCase',
      useFactory: makeLoginUserFactory,
      inject: ['UserRepository', 'Hasher', 'TokenGenerator', 'Logger'],
    },
    {
      provide: 'RefreshTokenUseCase',
      useFactory: makeRefreshTokenFactory,
      inject: ['TokenGenerator', 'UserRepository'],
    },
    {
      provide: JwtStrategy,
      useFactory: makeJwtStrategyFactory,
      inject: [ConfigService, 'UserRepository'],
    },
  ],
  exports: [
    'RegisterUserUseCase',
    'LoginUserUseCase',
    'RefreshTokenUseCase',
    JwtStrategy,
    'UserRepository',
  ],
})
export class AuthModule {}
