import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from '@presentation/controllers';
import { UserEntity } from '@infra/db/typeorm/entities/user.entity';
import { EmailVerificationTokenEntity } from '@infra/db/typeorm/entities/email-verification-token.entity';
import {
  makeUserRepository,
  makeEmailVerificationTokenRepository,
} from '@/main/factories/repositories';
import { BcryptHasher } from '@infra/implementations/bcrypt-hasher';
import { JwtTokenGenerator } from '@infra/implementations/jwt-token-generator';
import { CryptoVerificationTokenGenerator } from '@infra/implementations/verification-token-generator';
import { JwtStrategy } from '@presentation/strategies/jwt.strategy';
import {
  makeJwtStrategyFactory,
  makeLoginUserFactory,
  makeRefreshTokenFactory,
  makeRegisterUserFactory,
  makeVerifyEmailFactory,
  makeResendVerificationEmailFactory,
} from '../factories';
import { ContextAwareLoggerService } from '@/infra/logging/context-aware-logger.service';
import { AuthEmailTemplateService } from '@/infra/email/services';
import { MailgunEmailSender } from '@/infra/implementations/mailgun-email-sender';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, EmailVerificationTokenEntity]),
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
      provide: 'EmailVerificationTokenRepository',
      useFactory: makeEmailVerificationTokenRepository,
      inject: [getRepositoryToken(EmailVerificationTokenEntity)],
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
      provide: 'VerificationTokenGenerator',
      useClass: CryptoVerificationTokenGenerator,
    },
    {
      provide: 'Logger',
      useClass: ContextAwareLoggerService,
    },
    {
      provide: 'EmailSender',
      useClass: MailgunEmailSender,
    },
    {
      provide: 'AuthEmailTemplateService',
      useClass: AuthEmailTemplateService,
    },
    {
      provide: 'RegisterUserUseCase',
      useFactory: makeRegisterUserFactory,
      inject: [
        'UserRepository',
        'Hasher',
        'Logger',
        'EmailSender',
        'AuthEmailTemplateService',
        'EmailVerificationTokenRepository',
        'VerificationTokenGenerator',
      ],
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
    {
      provide: 'VerifyEmailUseCase',
      useFactory: makeVerifyEmailFactory,
      inject: [
        'EmailVerificationTokenRepository',
        'UserRepository',
        'Logger',
        'EmailSender',
        'AuthEmailTemplateService',
      ],
    },
    {
      provide: 'ResendVerificationEmailUseCase',
      useFactory: makeResendVerificationEmailFactory,
      inject: [
        'UserRepository',
        'EmailVerificationTokenRepository',
        'EmailSender',
        'AuthEmailTemplateService',
        'Logger',
        'VerificationTokenGenerator',
      ],
    },
  ],
  exports: [
    'RegisterUserUseCase',
    'LoginUserUseCase',
    'RefreshTokenUseCase',
    'VerifyEmailUseCase',
    'ResendVerificationEmailUseCase',
    JwtStrategy,
    'UserRepository',
  ],
})
export class AuthModule {}
