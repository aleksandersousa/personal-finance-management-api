import {
  EmailVerificationTokenRepository,
  PasswordResetTokenRepository,
  NotificationRepository,
  EntryRepository,
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

export interface MirrorMonthlyRecurringEntriesOptions {
  runDate?: string;
}

export interface MirrorMonthlyRecurringEntriesResult {
  success: boolean;
  createdCount: number;
  skippedCount: number;
  error?: string;
}

export class ScheduledTasksWorker {
  constructor(
    private readonly emailVerificationTokenRepository: EmailVerificationTokenRepository,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    private readonly entryRepository: EntryRepository,
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

  async mirrorMonthlyRecurringEntries(
    options: MirrorMonthlyRecurringEntriesOptions,
  ): Promise<MirrorMonthlyRecurringEntriesResult> {
    let createdCount = 0;
    let skippedCount = 0;

    try {
      const runDate = options.runDate ? new Date(options.runDate) : new Date();
      const previousMonthStart = new Date(
        runDate.getFullYear(),
        runDate.getMonth() - 1,
        1,
        0,
        0,
        0,
      );
      const previousMonthEnd = new Date(
        runDate.getFullYear(),
        runDate.getMonth(),
        0,
        23,
        59,
        59,
      );

      const sourceEntries =
        await this.entryRepository.findMonthlyRecurringEntriesInRange({
          startDate: previousMonthStart,
          endDate: previousMonthEnd,
        });

      for (const entry of sourceEntries) {
        if (!entry.recurrenceId) {
          skippedCount += 1;
          continue;
        }

        const mirroredIssueDate = this.createDateInCurrentMonth(
          runDate,
          entry.issueDate,
        );
        const mirroredDueDate = this.createDateInCurrentMonth(
          runDate,
          entry.dueDate,
        );

        const alreadyExists =
          await this.entryRepository.existsMonthlyMirroredEntry({
            userId: entry.userId,
            recurrenceId: entry.recurrenceId,
            issueDate: mirroredIssueDate,
            amount: entry.amount,
            description: entry.description,
          });

        if (alreadyExists) {
          skippedCount += 1;
          continue;
        }

        await this.entryRepository.create({
          userId: entry.userId,
          categoryId: entry.categoryId,
          recurrenceId: entry.recurrenceId,
          description: entry.description,
          amount: entry.amount,
          issueDate: mirroredIssueDate,
          dueDate: mirroredDueDate,
        });
        createdCount += 1;
      }

      return {
        success: true,
        createdCount,
        skippedCount,
      };
    } catch (error) {
      return {
        success: false,
        createdCount,
        skippedCount,
        error: error.message,
      };
    }
  }

  private createDateInCurrentMonth(
    referenceDate: Date,
    sourceDate: Date,
  ): Date {
    const maxDay = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() + 1,
      0,
    ).getDate();
    const day = Math.min(sourceDate.getDate(), maxDay);

    return new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      day,
      sourceDate.getHours(),
      sourceDate.getMinutes(),
      sourceDate.getSeconds(),
      sourceDate.getMilliseconds(),
    );
  }
}
