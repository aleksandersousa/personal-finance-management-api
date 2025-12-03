import {
  RequestPasswordResetRequest,
  RequestPasswordResetResponse,
  RequestPasswordResetUseCase,
} from '@domain/usecases/request-password-reset.usecase';
import {
  UserRepository,
  PasswordResetTokenRepository,
  VerificationTokenGenerator,
  EmailSender,
  AuthEmailTemplateService,
  Logger,
} from '../protocols';

export class DbRequestPasswordResetUseCase
  implements RequestPasswordResetUseCase
{
  private readonly TOKEN_EXPIRY_HOURS = 1;
  private readonly RATE_LIMIT_HOURS = 1;
  private readonly MAX_REQUESTS_PER_HOUR = 3;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    private readonly verificationTokenGenerator: VerificationTokenGenerator,
    private readonly emailSender: EmailSender,
    private readonly authEmailTemplates: AuthEmailTemplateService,
    private readonly logger: Logger,
  ) {}

  async execute(
    request: RequestPasswordResetRequest,
  ): Promise<RequestPasswordResetResponse> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email)) {
      this.logger.error(
        'Invalid email format',
        request.email,
        'DbRequestPasswordResetUseCase',
      );
      // Don't reveal if email exists or not
      return {
        success: true,
        message:
          'Se o email existe e está verificado, um link de redefinição de senha foi enviado.',
      };
    }

    // Find user by email
    const user = await this.userRepository.findByEmail(
      request.email.toLowerCase(),
    );

    if (!user) {
      // Don't reveal if user exists or not for security
      this.logger.log(
        'Password reset requested for non-existent email',
        request.email,
      );
      return {
        success: true,
        message:
          'Se o email existe e está verificado, um link de redefinição de senha foi enviado.',
      };
    }

    // Check if email is verified
    if (!user.emailVerified) {
      this.logger.error(
        'Password reset requested for unverified email',
        user.id,
        'DbRequestPasswordResetUseCase',
      );
      throw new Error(
        'Email não verificado. Por favor, verifique seu email antes de redefinir sua senha.',
      );
    }

    // Check rate limiting: find tokens created in last hour
    const recentTokens =
      await this.passwordResetTokenRepository.findRecentByUserId(
        user.id,
        this.RATE_LIMIT_HOURS,
      );

    if (recentTokens.length >= this.MAX_REQUESTS_PER_HOUR) {
      this.logger.error(
        `Rate limit exceeded for password reset: ${recentTokens.length} requests in last hour`,
        user.id,
        'DbRequestPasswordResetUseCase',
      );
      throw new Error(
        'Muitas requisições de redefinição de senha. Por favor, tente novamente mais tarde.',
      );
    }

    // Delete all unused tokens for user (invalidate old tokens)
    await this.passwordResetTokenRepository.deleteByUserId(user.id);

    // Generate reset token
    const token = this.verificationTokenGenerator.generate();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

    // Create token in repository
    await this.passwordResetTokenRepository.create(user.id, token, expiresAt);

    // Send password reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const expirationTime = '1 hora';

    try {
      const emailTemplate = await this.authEmailTemplates.getPasswordResetEmail(
        {
          userName: user.name,
          resetUrl,
          expirationTime,
        },
      );

      const result = await this.emailSender.send({
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      if (result.success) {
        this.logger.log(
          `Password reset email sent to ${user.email}`,
          'DbRequestPasswordResetUseCase',
        );
      } else {
        this.logger.error(
          `Failed to send password reset email: ${result.error}`,
          '',
          'DbRequestPasswordResetUseCase',
        );
        throw new Error('Failed to send password reset email');
      }
    } catch (error) {
      this.logger.error(
        'Error rendering password reset email template',
        error.stack,
        'DbRequestPasswordResetUseCase',
      );
      throw error;
    }

    return {
      success: true,
      message:
        'Se o email existe e está verificado, um link de redefinição de senha foi enviado.',
    };
  }
}
