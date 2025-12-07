import {
  RegisterUserRequest,
  RegisterUserResponse,
  RegisterUserUseCase,
} from '@domain/usecases/register-user.usecase';
import {
  UserRepository,
  Hasher,
  Logger,
  EmailSender,
  AuthEmailTemplateService,
  EmailVerificationTokenRepository,
  VerificationTokenGenerator,
} from '../protocols';

export class DbRegisterUserUseCase implements RegisterUserUseCase {
  private readonly TOKEN_EXPIRY_HOURS = 24;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly hasher: Hasher,
    private readonly logger: Logger,
    private readonly emailSender: EmailSender,
    private readonly authEmailTemplates: AuthEmailTemplateService,
    private readonly emailVerificationTokenRepository: EmailVerificationTokenRepository,
    private readonly verificationTokenGenerator: VerificationTokenGenerator,
  ) {}

  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email)) {
      this.logger.error(
        'Invalid email format',
        request.email,
        'DbRegisterUserUseCase',
      );
      throw new Error('Invalid email format');
    }

    // Validate password strength
    if (request.password.length < 6) {
      this.logger.error(
        'Password must be at least 6 characters long',
        request.password,
        'DbRegisterUserUseCase',
      );
      throw new Error('Password must be at least 6 characters long');
    }

    // Validate name
    if (!request.name || request.name.trim().length === 0) {
      this.logger.error(
        'Name is required',
        request.name,
        'DbRegisterUserUseCase',
      );
      throw new Error('Name is required');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      this.logger.error(
        'User already exists with this email',
        request.email,
        'DbRegisterUserUseCase',
      );
      throw new Error('User already exists with this email');
    }

    // Hash password
    const hashedPassword = await this.hasher.hash(request.password);

    // Create user (emailVerified defaults to false, timezone defaults to America/SaoPaulo)
    const user = await this.userRepository.create({
      name: request.name.trim(),
      email: request.email.toLowerCase(),
      password: hashedPassword,
    });

    // Generate verification token
    const token = this.verificationTokenGenerator.generate();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

    // Create verification token
    await this.emailVerificationTokenRepository.create(
      user.id,
      token,
      expiresAt,
    );

    delete user.password;

    this.sendVerificationEmail(user, token).catch(error => {
      this.logger.error(
        'Failed to send verification email',
        error.stack,
        'DbRegisterUserUseCase',
      );
    });

    this.logger.log(
      `User registered successfully: ${user.id}`,
      'DbRegisterUserUseCase',
    );

    return {
      user,
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  private async sendVerificationEmail(user: any, token: string): Promise<void> {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
      const expirationTime = '24 horas';

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
          `Verification email sent to ${user.email}`,
          'DbRegisterUserUseCase',
        );
      } else {
        this.logger.error(
          `Failed to send verification email: ${result.error}`,
          '',
          'DbRegisterUserUseCase',
        );
      }
    } catch (error) {
      this.logger.error(
        'Error rendering verification email template',
        error.stack,
        'DbRegisterUserUseCase',
      );
      throw error;
    }
  }
}
