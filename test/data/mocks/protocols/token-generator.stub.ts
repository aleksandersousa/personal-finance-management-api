import {
  TokenGenerator,
  TokenPayload,
  TokenPair,
} from '@data/protocols/token-generator';

/**
 * Token Generator Stub for Data Layer Testing
 * Provides controllable implementations for testing business logic
 */
export class TokenGeneratorStub implements TokenGenerator {
  private shouldFail = false;
  private errorToThrow: Error | null = null;
  private accessTokenPrefix = 'access_token_';
  private refreshTokenPrefix = 'refresh_token_';
  private validTokens = new Map<string, TokenPayload>();

  async generateTokens(payload: TokenPayload): Promise<TokenPair> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const accessToken = `${this.accessTokenPrefix}${payload.userId}_${Date.now()}`;
    const refreshToken = `${this.refreshTokenPrefix}${payload.userId}_${Date.now()}`;

    // Store tokens for later verification
    this.validTokens.set(accessToken, payload);
    this.validTokens.set(refreshToken, payload);

    return {
      accessToken,
      refreshToken,
    };
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const payload = this.validTokens.get(token);
    if (!payload || !token.startsWith(this.accessTokenPrefix)) {
      throw new Error('Invalid access token');
    }

    return payload;
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const payload = this.validTokens.get(token);
    if (!payload || !token.startsWith(this.refreshTokenPrefix)) {
      throw new Error('Invalid refresh token');
    }

    return payload;
  }

  // =================== Test Utility Methods ===================

  /**
   * Clear all tokens and reset error state
   */
  clear(): void {
    this.shouldFail = false;
    this.errorToThrow = null;
    this.validTokens.clear();
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
   * Pre-seed a token-payload pair for testing
   */
  seedToken(token: string, payload: TokenPayload): void {
    this.validTokens.set(token, payload);
  }

  /**
   * Get the number of valid tokens
   */
  getTokenCount(): number {
    return this.validTokens.size;
  }

  /**
   * Check if a token exists
   */
  hasToken(token: string): boolean {
    return this.validTokens.has(token);
  }

  /**
   * Simulate token generation errors
   */
  mockTokenGenerationError(): void {
    this.mockFailure(new Error('Token generation failed'));
  }

  /**
   * Simulate token verification errors
   */
  mockTokenVerificationError(): void {
    this.mockFailure(new Error('Token verification failed'));
  }
}
