import {
  EmailVerificationTokenRepository,
  PasswordResetTokenRepository,
} from '@data/protocols/repositories';

export interface TokenCleanupOptions {
  tokenType: 'email-verification' | 'password-reset' | 'all';
}

export interface TokenCleanupResult {
  success: boolean;
  cleanedTypes: string[];
  error?: string;
}

export class ScheduledTasksWorker {
  constructor(
    private readonly emailVerificationTokenRepository: EmailVerificationTokenRepository,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
  ) {}

  async cleanupExpiredTokens(
    options: TokenCleanupOptions,
  ): Promise<TokenCleanupResult> {
    const cleanedTypes: string[] = [];

    try {
      if (
        options.tokenType === 'email-verification' ||
        options.tokenType === 'all'
      ) {
        await this.emailVerificationTokenRepository.deleteExpiredTokens();
        cleanedTypes.push('email-verification');
      }

      if (
        options.tokenType === 'password-reset' ||
        options.tokenType === 'all'
      ) {
        await this.passwordResetTokenRepository.deleteExpiredTokens();
        cleanedTypes.push('password-reset');
      }

      return {
        success: true,
        cleanedTypes,
      };
    } catch (error) {
      return {
        success: false,
        cleanedTypes,
        error: error.message,
      };
    }
  }
}
