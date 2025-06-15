import { Hasher } from '@data/protocols/hasher';

/**
 * Hasher Stub for Data Layer Testing
 * Provides controllable implementations for testing business logic
 */
export class HasherStub implements Hasher {
  private shouldFail = false;
  private errorToThrow: Error | null = null;
  private hashPrefix = 'hashed_';
  private validPasswords = new Map<string, string>();

  async hash(value: string): Promise<string> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const hashedValue = `${this.hashPrefix}${value}`;
    this.validPasswords.set(value, hashedValue);
    return hashedValue;
  }

  async compare(value: string, hash: string): Promise<boolean> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    // Check if we have a seeded password-hash pair
    const seededHash = this.validPasswords.get(value);
    if (seededHash !== undefined) {
      return seededHash === hash;
    }

    // If no explicit seeding was done, return false (password doesn't match)
    // This forces explicit seeding for tests, making them more predictable
    return false;
  }

  // =================== Test Utility Methods ===================

  /**
   * Clear all state and reset error state
   */
  clear(): void {
    this.shouldFail = false;
    this.errorToThrow = null;
    this.validPasswords.clear();
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
   * Pre-seed a password-hash pair for testing
   */
  seedPasswordHash(password: string, hash: string): void {
    this.validPasswords.set(password, hash);
  }

  /**
   * Simulate hashing errors
   */
  mockHashingError(): void {
    this.mockFailure(new Error('Hashing failed'));
  }

  /**
   * Simulate comparison errors
   */
  mockComparisonError(): void {
    this.mockFailure(new Error('Password comparison failed'));
  }
}
