import { BaseJobData } from '@domain/contracts';

export interface TokenCleanupJobData extends BaseJobData {
  tokenType: 'email-verification' | 'password-reset' | 'all';
}
