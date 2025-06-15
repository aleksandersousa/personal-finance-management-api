import { UserRepository } from "@data/protocols/user-repository";
import { UserModel } from "@domain/models/user.model";

/**
 * User Repository Stub for Data Layer Testing
 * Provides controllable implementations for testing business logic
 */
export class UserRepositoryStub implements UserRepository {
  private users: Map<string, UserModel> = new Map();
  private shouldFail = false;
  private errorToThrow: Error | null = null;
  private nextId = 1;

  async create(
    data: Omit<UserModel, "id" | "createdAt" | "updatedAt">
  ): Promise<UserModel> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const user: UserModel = {
      ...data,
      id: `stub-user-${Date.now()}-${this.nextId++}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(user.id, user);
    return user;
  }

  async findById(id: string): Promise<UserModel | null> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }
    return (
      Array.from(this.users.values()).find((user) => user.email === email) ||
      null
    );
  }

  // =================== Test Utility Methods ===================

  /**
   * Clear all users and reset error state
   */
  clear(): void {
    this.users.clear();
    this.shouldFail = false;
    this.errorToThrow = null;
    this.nextId = 1;
  }

  /**
   * Seed the repository with predefined users
   */
  seed(users: UserModel[]): void {
    users.forEach((user) => this.users.set(user.id, user));
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
   * Get the number of users in the stub
   */
  getCount(): number {
    return this.users.size;
  }

  /**
   * Get all users (for testing purposes)
   */
  getAllUsers(): UserModel[] {
    return Array.from(this.users.values());
  }

  /**
   * Check if a user exists by ID
   */
  hasUser(id: string): boolean {
    return this.users.has(id);
  }

  /**
   * Get the last created user
   */
  getLastCreated(): UserModel | null {
    const users = Array.from(this.users.values());
    return users.length > 0 ? users[users.length - 1] : null;
  }

  /**
   * Simulate database constraints or validation errors
   */
  mockConstraintViolation(): void {
    this.mockFailure(new Error("Database constraint violation"));
  }

  /**
   * Simulate connection errors
   */
  mockConnectionError(): void {
    this.mockFailure(new Error("Database connection failed"));
  }

  /**
   * Simulate timeout errors
   */
  mockTimeoutError(): void {
    this.mockFailure(new Error("Database operation timeout"));
  }
}
