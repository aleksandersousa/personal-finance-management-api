import { UserModel } from "@domain/models/user.model";

export const mockUser: UserModel = {
  id: "user-123",
  name: "John Doe",
  email: "john@example.com",
  createdAt: new Date("2025-06-01T10:00:00Z"),
  updatedAt: new Date("2025-06-01T10:00:00Z"),
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

  static createValid(): UserModel {
    return this.create();
  }

  static createWithEmail(email: string): UserModel {
    return this.create({ email });
  }

  static createWithId(id: string): UserModel {
    return this.create({ id });
  }

  static createWithName(name: string): UserModel {
    return this.create({ name });
  }
}
