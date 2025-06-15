import { IdGenerator } from "@data/protocols/id-generator";

/**
 * IdGenerator Stub for Data Layer Testing
 * Provides controllable implementations for testing business logic
 */
export class IdGeneratorStub implements IdGenerator {
  private shouldFail = false;
  private errorToThrow: Error | null = null;
  private nextId = 1;
  private prefix = "stub-id";

  generate(): string {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    return `${this.prefix}-${Date.now()}-${this.nextId++}`;
  }

  // =================== Test Utility Methods ===================

  /**
   * Reset error state and id counter
   */
  clear(): void {
    this.shouldFail = false;
    this.errorToThrow = null;
    this.nextId = 1;
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
   * Set a custom prefix for generated IDs
   */
  setPrefix(prefix: string): void {
    this.prefix = prefix;
  }

  /**
   * Generate a specific ID for testing
   */
  mockSpecificId(id: string): void {
    const originalGenerate = this.generate;
    this.generate = jest.fn().mockReturnValueOnce(id);

    // Restore original behavior after one call
    setTimeout(() => {
      this.generate = originalGenerate;
    }, 0);
  }

  /**
   * Get the next ID that would be generated (for testing)
   */
  peekNextId(): string {
    return `${this.prefix}-${Date.now()}-${this.nextId}`;
  }
}
