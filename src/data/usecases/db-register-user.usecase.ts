import {
  RegisterUserRequest,
  RegisterUserResponse,
  RegisterUserUseCase,
} from '@domain/usecases/register-user.usecase';
import {
  UserRepository,
  Hasher,
  TokenGenerator,
  Logger,
  EmailSender,
  AuthEmailTemplateService,
} from '../protocols';

export class DbRegisterUserUseCase implements RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hasher: Hasher,
    private readonly tokenGenerator: TokenGenerator,
    private readonly logger: Logger,
    private readonly emailSender: EmailSender,
    private readonly authEmailTemplates: AuthEmailTemplateService,
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

    // Create user
    const user = await this.userRepository.create({
      name: request.name.trim(),
      email: request.email.toLowerCase(),
      password: hashedPassword,
    });

    // Generate tokens
    const tokens = await this.tokenGenerator.generateTokens({
      userId: user.id,
      email: user.email,
    });

    delete user.password;

    this.sendWelcomeEmail(user).catch(error => {
      this.logger.error(
        'Failed to send welcome email',
        error.stack,
        'DbRegisterUserUseCase',
      );
    });

    this.logger.log(
      `User registered successfully: ${user.id}`,
      'DbRegisterUserUseCase',
    );

    return { user, tokens };
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
          'DbRegisterUserUseCase',
        );
      } else {
        this.logger.error(
          `Failed to send welcome email: ${result.error}`,
          '',
          'DbRegisterUserUseCase',
        );
      }
    } catch (error) {
      this.logger.error(
        'Error rendering welcome email template',
        error.stack,
        'DbRegisterUserUseCase',
      );
      throw error;
    }
  }
}
