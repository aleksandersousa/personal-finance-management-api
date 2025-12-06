import {
  EmailVerificationTokenRepository,
  PasswordResetTokenRepository,
  NotificationRepository,
} from '@data/protocols/repositories';

export interface TokenCleanupOptions {
  tokenType: 'email-verification' | 'password-reset' | 'all';
}

export interface TokenCleanupResult {
  success: boolean;
  cleanedTypes: string[];
  error?: string;
}

export interface NotificationCleanupOptions {
  olderThanDays?: number;
}

export interface NotificationCleanupResult {
  success: boolean;
  deletedCount: number;
  error?: string;
}

export class ScheduledTasksWorker {
  constructor(
    private readonly emailVerificationTokenRepository: EmailVerificationTokenRepository,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    private readonly notificationRepository?: NotificationRepository,
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

  async cleanupCancelledNotifications(
    options: NotificationCleanupOptions,
  ): Promise<NotificationCleanupResult> {
    if (!this.notificationRepository) {
      return {
        success: false,
        deletedCount: 0,
        error: 'NotificationRepository not available',
      };
    }

    try {
      const olderThanDays = options.olderThanDays || 30;
      const deletedCount =
        await this.notificationRepository.deleteCancelledOlderThan(
          olderThanDays,
        );

      return {
        success: true,
        deletedCount,
      };
    } catch (error) {
      return {
        success: false,
        deletedCount: 0,
        error: error.message,
      };
    }
  }
}
