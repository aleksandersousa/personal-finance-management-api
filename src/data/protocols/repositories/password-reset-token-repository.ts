import { PasswordResetTokenModel } from '@domain/models/password-reset-token.model';

export interface PasswordResetTokenRepository {
  create(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<PasswordResetTokenModel>;
  findByToken(token: string): Promise<PasswordResetTokenModel | null>;
  findByUserId(userId: string): Promise<PasswordResetTokenModel | null>;
  findRecentByUserId(
    userId: string,
    hours: number,
  ): Promise<PasswordResetTokenModel[]>;
  markAsUsed(tokenId: string): Promise<void>;
  deleteExpiredTokens(): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}
