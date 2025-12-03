import type {
  EmailVerificationTokenRepository,
  UserRepository,
  EmailSender,
  AuthEmailTemplateService,
} from '@data/protocols';
import { DbVerifyEmailUseCase } from '@/data/usecases/db-verify-email.usecase';
import type { ContextAwareLoggerService } from '@/infra/logging/context-aware-logger.service';

export const makeVerifyEmailFactory = (
  emailVerificationTokenRepository: EmailVerificationTokenRepository,
  userRepository: UserRepository,
  logger: ContextAwareLoggerService,
  emailSender: EmailSender,
  authEmailTemplates: AuthEmailTemplateService,
) => {
  return new DbVerifyEmailUseCase(
    emailVerificationTokenRepository,
    userRepository,
    logger,
    emailSender,
    authEmailTemplates,
  );
};
