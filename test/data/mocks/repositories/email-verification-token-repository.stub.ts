import { EmailVerificationTokenRepository } from '@/data/protocols/repositories/email-verification-token-repository';
import { EmailVerificationTokenModel } from '@domain/models/email-verification-token.model';

/**
 * EmailVerificationTokenRepository Stub for Data Layer Testing
 * Provides controllable implementations for testing business logic
 */
export class EmailVerificationTokenRepositoryStub
  implements EmailVerificationTokenRepository
{
  private tokens: Map<string, EmailVerificationTokenModel> = new Map();
  private shouldFail = false;
  private errorToThrow: Error | null = null;
  private nextId = 1;

  async create(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<EmailVerificationTokenModel> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const tokenModel: EmailVerificationTokenModel = {
      id: `stub-token-${Date.now()}-${this.nextId++}`,
      userId,
      token,
      expiresAt,
      usedAt: null,
      createdAt: new Date(),
    };

    this.tokens.set(tokenModel.id, tokenModel);
    return tokenModel;
  }

  async findByToken(
    token: string,
  ): Promise<EmailVerificationTokenModel | null> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    return (
      Array.from(this.tokens.values()).find(t => t.token === token) || null
    );
  }

  async findByUserId(
    userId: string,
  ): Promise<EmailVerificationTokenModel | null> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    const userTokens = Array.from(this.tokens.values()).filter(
      t => t.userId === userId && t.usedAt === null,
    );
    return userTokens.length > 0
      ? userTokens.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        )[0]
      : null;
  }

  async markAsUsed(tokenId: string): Promise<void> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    const token = this.tokens.get(tokenId);
    if (token) {
      token.usedAt = new Date();
      this.tokens.set(tokenId, token);
    }
  }

  async deleteExpiredTokens(): Promise<void> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    const now = new Date();
    for (const [id, token] of this.tokens.entries()) {
      if (token.expiresAt < now) {
        this.tokens.delete(id);
      }
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    for (const [id, token] of this.tokens.entries()) {
      if (token.userId === userId && token.usedAt === null) {
        this.tokens.delete(id);
      }
    }
  }

  // =================== Test Utility Methods ===================

  /**
   * Clear all tokens and reset error state
   */
  clear(): void {
    this.tokens.clear();
    this.shouldFail = false;
    this.errorToThrow = null;
    this.nextId = 1;
  }

  /**
   * Seed the repository with predefined tokens
   */
  seed(tokens: EmailVerificationTokenModel[]): void {
    tokens.forEach(token => this.tokens.set(token.id, token));
  }

  /**
   * Configure the stub to throw an error on next operation
   */
  mockFailure(error: Error): void {
    this.shouldFail = true;
    this.errorToThrow = error;
  }

  /**
   * Configure the stub to operate normally
   */
  mockSuccess(): void {
    this.shouldFail = false;
    this.errorToThrow = null;
  }

  /**
   * Get count of tokens
   */
  getCount(): number {
    return this.tokens.size;
  }

  /**
   * Get token by ID
   */
  getTokenById(id: string): EmailVerificationTokenModel | undefined {
    return this.tokens.get(id);
  }

  /**
   * Get all tokens for a user
   */
  getTokensByUserId(userId: string): EmailVerificationTokenModel[] {
    return Array.from(this.tokens.values()).filter(t => t.userId === userId);
  }
}
