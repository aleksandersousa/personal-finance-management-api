import {
  ResendVerificationEmailRequest,
  ResendVerificationEmailResponse,
  ResendVerificationEmailUseCase,
} from '@domain/usecases/resend-verification-email.usecase';
import {
  UserRepository,
  EmailVerificationTokenRepository,
  EmailSender,
  AuthEmailTemplateService,
  Logger,
  VerificationTokenGenerator,
} from '../protocols';

export class DbResendVerificationEmailUseCase
  implements ResendVerificationEmailUseCase
{
  private readonly TOKEN_EXPIRY_HOURS = 24;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailVerificationTokenRepository: EmailVerificationTokenRepository,
    private readonly emailSender: EmailSender,
    private readonly authEmailTemplates: AuthEmailTemplateService,
    private readonly logger: Logger,
    private readonly verificationTokenGenerator: VerificationTokenGenerator,
  ) {}

  async execute(
    request: ResendVerificationEmailRequest,
  ): Promise<ResendVerificationEmailResponse> {
    // Find user by email
    const user = await this.userRepository.findByEmail(
      request.email.toLowerCase(),
    );

    if (!user) {
      // Don't reveal if user exists or not for security
      this.logger.log(
        'Resend verification requested for non-existent email',
        request.email,
      );
      return {
        success: true,
        message: 'If the email exists, a verification email has been sent',
      };
    }

    // Check if email is already verified
    if (user.emailVerified) {
      this.logger.log(
        'Resend verification requested for already verified email',
        user.id,
      );
      return {
        success: true,
        message: 'Email is already verified',
      };
    }

    // Delete old unused tokens for this user
    await this.emailVerificationTokenRepository.deleteByUserId(user.id);

    // Generate new token
    const token = this.verificationTokenGenerator.generate();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

    // Create verification token
    await this.emailVerificationTokenRepository.create(
      user.id,
      token,
      expiresAt,
    );

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    const expirationTime = '24 horas';

    try {
      const emailTemplate = await this.authEmailTemplates.getVerifyEmailEmail({
        userName: user.name,
        verificationUrl,
        expirationTime,
      });

      const result = await this.emailSender.send({
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      if (result.success) {
        this.logger.log(
          `Verification email resent to ${user.email}`,
          'DbResendVerificationEmailUseCase',
        );
      } else {
        this.logger.error(
          `Failed to resend verification email: ${result.error}`,
          '',
          'DbResendVerificationEmailUseCase',
        );
        throw new Error('Failed to send verification email');
      }
    } catch (error) {
      this.logger.error(
        'Error rendering verification email template',
        error.stack,
        'DbResendVerificationEmailUseCase',
      );
      throw error;
    }

    return {
      success: true,
      message: 'Verification email sent successfully',
    };
  }
}
