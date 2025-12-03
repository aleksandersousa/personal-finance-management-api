import {
  ResetPasswordRequest,
  ResetPasswordResponse,
  ResetPasswordUseCase,
} from '@domain/usecases/reset-password.usecase';
import {
  PasswordResetTokenRepository,
  UserRepository,
  Hasher,
  Logger,
} from '../protocols';

export class DbResetPasswordUseCase implements ResetPasswordUseCase {
  constructor(
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    private readonly userRepository: UserRepository,
    private readonly hasher: Hasher,
    private readonly logger: Logger,
  ) {}

  async execute(request: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    // Validate token exists
    const token = await this.passwordResetTokenRepository.findByToken(
      request.token,
    );

    if (!token) {
      this.logger.error(
        'Invalid password reset token',
        request.token,
        'DbResetPasswordUseCase',
      );
      throw new Error('Invalid or expired password reset token');
    }

    // Check token not expired
    if (token.expiresAt < new Date()) {
      this.logger.error(
        'Expired password reset token',
        token.id,
        'DbResetPasswordUseCase',
      );
      throw new Error('Password reset token has expired');
    }

    // Check token not already used
    if (token.usedAt !== null) {
      this.logger.error(
        'Password reset token already used',
        token.id,
        'DbResetPasswordUseCase',
      );
      throw new Error('Password reset token has already been used');
    }

    // Find user by token's userId
    const user = await this.userRepository.findById(token.userId);
    if (!user) {
      this.logger.error(
        'User not found for password reset token',
        token.userId,
        'DbResetPasswordUseCase',
      );
      throw new Error('User not found');
    }

    // Validate new password (min 6 characters, same as registration)
    if (request.newPassword.length < 6) {
      this.logger.error(
        'Password must be at least 6 characters long',
        user.id,
        'DbResetPasswordUseCase',
      );
      throw new Error('Password must be at least 6 characters long');
    }

    // Hash new password
    const hashedPassword = await this.hasher.hash(request.newPassword);

    // Update user password
    await this.userRepository.update(token.userId, {
      password: hashedPassword,
    });

    // Mark token as used
    await this.passwordResetTokenRepository.markAsUsed(token.id);

    // Delete all unused tokens for user
    await this.passwordResetTokenRepository.deleteByUserId(token.userId);

    this.logger.log(
      `Password reset successfully for user: ${user.id}`,
      'DbResetPasswordUseCase',
    );

    return {
      success: true,
      message: 'Password reset successfully',
    };
  }
}
