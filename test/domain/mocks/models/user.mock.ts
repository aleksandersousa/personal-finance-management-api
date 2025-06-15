import { UserModel } from "@domain/models/user.model";

const mockUser: UserModel = {
  id: "user-123",
  name: "Test User",
  email: "test@example.com",
  password: "hashed-password",
  avatarUrl: null,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
};

/**
 * Factory for creating User mock instances with variations
 */
export class MockUserFactory {
  static create(overrides: Partial<UserModel> = {}): UserModel {
    return { ...mockUser, ...overrides };
  }

  static createMany(
    count: number,
    overrides: Partial<UserModel> = {}
  ): UserModel[] {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        ...overrides,
        id: `user-${index + 1}`,
        name: `User ${index + 1}`,
        email: `user${index + 1}@example.com`,
      })
    );
  }
}
