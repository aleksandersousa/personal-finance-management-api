import type {
  UserRepository,
  EmailVerificationTokenRepository,
  EmailSender,
  AuthEmailTemplateService,
  VerificationTokenGenerator,
} from '@/data/protocols';
import { DbResendVerificationEmailUseCase } from '@/data/usecases/db-resend-verification-email.usecase';
import type { ContextAwareLoggerService } from '@/infra/logging/context-aware-logger.service';

export const makeResendVerificationEmailFactory = (
  userRepository: UserRepository,
  emailVerificationTokenRepository: EmailVerificationTokenRepository,
  emailSender: EmailSender,
  authEmailTemplates: AuthEmailTemplateService,
  logger: ContextAwareLoggerService,
  verificationTokenGenerator: VerificationTokenGenerator,
) => {
  return new DbResendVerificationEmailUseCase(
    userRepository,
    emailVerificationTokenRepository,
    emailSender,
    authEmailTemplates,
    logger,
    verificationTokenGenerator,
  );
};
