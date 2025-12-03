import type {
  UserRepository,
  PasswordResetTokenRepository,
  VerificationTokenGenerator,
  EmailSender,
  AuthEmailTemplateService,
} from '@data/protocols';
import { DbRequestPasswordResetUseCase } from '@/data/usecases/db-request-password-reset.usecase';
import type { ContextAwareLoggerService } from '@/infra/logging/context-aware-logger.service';

export const makeRequestPasswordResetFactory = (
  userRepository: UserRepository,
  passwordResetTokenRepository: PasswordResetTokenRepository,
  verificationTokenGenerator: VerificationTokenGenerator,
  emailSender: EmailSender,
  authEmailTemplates: AuthEmailTemplateService,
  logger: ContextAwareLoggerService,
) => {
  return new DbRequestPasswordResetUseCase(
    userRepository,
    passwordResetTokenRepository,
    verificationTokenGenerator,
    emailSender,
    authEmailTemplates,
    logger,
  );
};
