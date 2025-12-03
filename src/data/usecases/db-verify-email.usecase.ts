import {
  VerifyEmailRequest,
  VerifyEmailResponse,
  VerifyEmailUseCase,
} from '@domain/usecases/verify-email.usecase';
import {
  UserRepository,
  EmailVerificationTokenRepository,
  Logger,
  EmailSender,
  AuthEmailTemplateService,
} from '../protocols';

export class DbVerifyEmailUseCase implements VerifyEmailUseCase {
  constructor(
    private readonly emailVerificationTokenRepository: EmailVerificationTokenRepository,
    private readonly userRepository: UserRepository,
    private readonly logger: Logger,
    private readonly emailSender: EmailSender,
    private readonly authEmailTemplates: AuthEmailTemplateService,
  ) {}

  async execute(request: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    const token = await this.emailVerificationTokenRepository.findByToken(
      request.token,
    );

    if (!token) {
      this.logger.error(
        'Invalid verification token',
        request.token,
        'DbVerifyEmailUseCase',
      );
      throw new Error('Invalid verification token');
    }

    // Check if token is expired
    if (token.expiresAt < new Date()) {
      this.logger.error(
        'Expired verification token',
        token.id,
        'DbVerifyEmailUseCase',
      );
      throw new Error('Verification token has expired');
    }

    // Check if token has already been used
    if (token.usedAt !== null) {
      this.logger.error('Token already used', token.id, 'DbVerifyEmailUseCase');
      throw new Error('Verification token has already been used');
    }

    // Get user
    const user = await this.userRepository.findById(token.userId);
    if (!user) {
      this.logger.error(
        'User not found for token',
        token.userId,
        'DbVerifyEmailUseCase',
      );
      throw new Error('User not found');
    }

    // Check if email is already verified
    if (user.emailVerified) {
      this.logger.log('Email already verified', user.id);
      return {
        success: true,
        message: 'Email is already verified',
      };
    }

    // Mark user email as verified
    const updatedUser = await this.userRepository.update(token.userId, {
      emailVerified: true,
    });

    // Mark token as used
    await this.emailVerificationTokenRepository.markAsUsed(token.id);

    // Delete old unused tokens for this user
    await this.emailVerificationTokenRepository.deleteByUserId(token.userId);

    // Send welcome email after successful verification
    this.sendWelcomeEmail(updatedUser).catch(error => {
      this.logger.error(
        'Failed to send welcome email',
        error.stack,
        'DbVerifyEmailUseCase',
      );
    });

    this.logger.log(
      `Email verified successfully for user: ${user.id}`,
      'DbVerifyEmailUseCase',
    );

    return {
      success: true,
      message: 'E-mail verificado com sucesso!',
    };
  }

  private async sendWelcomeEmail(user: any): Promise<void> {
    try {
      const emailTemplate = await this.authEmailTemplates.getWelcomeEmail({
        userName: user.name,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
      });

      const result = await this.emailSender.send({
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      if (result.success) {
        this.logger.log(
          `Welcome email sent to ${user.email}`,
          'DbVerifyEmailUseCase',
        );
      } else {
        this.logger.error(
          `Failed to send welcome email: ${result.error}`,
          '',
          'DbVerifyEmailUseCase',
        );
      }
    } catch (error) {
      this.logger.error(
        'Error rendering welcome email template',
        error.stack,
        'DbVerifyEmailUseCase',
      );
      throw error;
    }
  }
}
