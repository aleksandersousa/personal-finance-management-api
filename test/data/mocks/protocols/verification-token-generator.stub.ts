import { VerificationTokenGenerator } from '@data/protocols/verification-token-generator';

/**
 * VerificationTokenGenerator Stub for Data Layer Testing
 * Provides controllable implementations for testing business logic
 */
export class VerificationTokenGeneratorStub
  implements VerificationTokenGenerator
{
  private tokens: string[] = [];
  private nextTokenIndex = 0;
  private shouldFail = false;
  private errorToThrow: Error | null = null;

  generate(): string {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    if (this.nextTokenIndex < this.tokens.length) {
      return this.tokens[this.nextTokenIndex++];
    }

    // Generate a predictable token if none provided
    const token = `mock-token-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    this.tokens.push(token);
    this.nextTokenIndex++;
    return token;
  }

  // =================== Test Utility Methods ===================

  /**
   * Clear all state and reset error state
   */
  clear(): void {
    this.tokens = [];
    this.nextTokenIndex = 0;
    this.shouldFail = false;
    this.errorToThrow = null;
  }

  /**
   * Seed tokens to be returned in order
   */
  seedTokens(tokens: string[]): void {
    this.tokens = [...tokens];
    this.nextTokenIndex = 0;
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
   * Get count of generated tokens
   */
  getTokenCount(): number {
    return this.nextTokenIndex;
  }
}
