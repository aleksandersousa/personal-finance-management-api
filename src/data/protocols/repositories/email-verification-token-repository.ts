import { EmailVerificationTokenModel } from '@domain/models/email-verification-token.model';

export interface EmailVerificationTokenRepository {
  create(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<EmailVerificationTokenModel>;
  findByToken(token: string): Promise<EmailVerificationTokenModel | null>;
  findByUserId(userId: string): Promise<EmailVerificationTokenModel | null>;
  markAsUsed(tokenId: string): Promise<void>;
  deleteExpiredTokens(): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}
