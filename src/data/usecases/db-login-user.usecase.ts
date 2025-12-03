import {
  LoginUserRequest,
  LoginUserResponse,
  LoginUserUseCase,
} from '@domain/usecases/login-user.usecase';
import { UserRepository } from '../protocols/repositories';
import { Hasher } from '../protocols/hasher';
import { TokenGenerator } from '../protocols/token-generator';
import { Logger } from '../protocols';
import { LoginAttemptTracker } from '@infra/cache/login-attempt-tracker.service';

export class DbLoginUserUseCase implements LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hasher: Hasher,
    private readonly tokenGenerator: TokenGenerator,
    private readonly logger: Logger,
    private readonly loginAttemptTracker: LoginAttemptTracker,
  ) {}

  async execute(request: LoginUserRequest): Promise<LoginUserResponse> {
    // Validate input
    if (!request.email || !request.password) {
      this.logger.error(
        'Invalid credentials',
        request.email,
        'DbLoginUserUseCase',
      );
      throw new Error('Invalid credentials');
    }

    const email = request.email.toLowerCase();
    const ipAddress = request.ipAddress || 'unknown';

    // Check if user/IP is currently in delay period
    const delayCheck = await this.loginAttemptTracker.checkDelay(
      email,
      ipAddress,
    );
    if (delayCheck.isDelayed) {
      this.logger.error(
        `Login attempt blocked due to delay: ${delayCheck.key}`,
        email,
        'DbLoginUserUseCase',
      );
      const error: any = new Error('Too many attempts, please try again later');
      error.remainingDelayMs = delayCheck.remainingDelayMs;
      throw error;
    }

    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.password) {
      // Increment attempt counters for failed login (user not found)
      await this.loginAttemptTracker.incrementAttempts(email, ipAddress);
      this.logger.error('Invalid credentials', email, 'DbLoginUserUseCase');
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.hasher.compare(
      request.password,
      user.password,
    );
    if (!isPasswordValid) {
      // Increment attempt counters for failed login (wrong password)
      await this.loginAttemptTracker.incrementAttempts(email, ipAddress);
      this.logger.error('Invalid credentials', email, 'DbLoginUserUseCase');
      throw new Error('Invalid credentials');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      this.logger.error('Email not verified', user.id, 'DbLoginUserUseCase');
      throw new Error(
        'Email not verified. Please check your email and verify your account.',
      );
    }

    // Reset attempt counters on successful login
    await this.loginAttemptTracker.resetAllAttempts(email, ipAddress);

    // Generate tokens
    const tokens = await this.tokenGenerator.generateTokens({
      userId: user.id,
      email: user.email,
    });

    // Return response without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    this.logger.log(
      `User logged in successfully: ${user.id}`,
      'DbLoginUserUseCase',
    );

    return {
      user: userWithoutPassword,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }
}
