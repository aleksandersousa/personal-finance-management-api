import type {
  UserRepository,
  Hasher,
  AuthEmailTemplateService,
  EmailSender,
  EmailVerificationTokenRepository,
  VerificationTokenGenerator,
} from '@/data/protocols';
import { DbRegisterUserUseCase } from '@/data/usecases/db-register-user.usecase';
import type { ContextAwareLoggerService } from '@/infra/logging/context-aware-logger.service';

export const makeRegisterUserFactory = (
  userRepository: UserRepository,
  hasher: Hasher,
  logger: ContextAwareLoggerService,
  emailSender: EmailSender,
  authEmailTemplates: AuthEmailTemplateService,
  emailVerificationTokenRepository: EmailVerificationTokenRepository,
  verificationTokenGenerator: VerificationTokenGenerator,
) => {
  return new DbRegisterUserUseCase(
    userRepository,
    hasher,
    logger,
    emailSender,
    authEmailTemplates,
    emailVerificationTokenRepository,
    verificationTokenGenerator,
  );
};
