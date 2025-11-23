import { JwtStrategy, JwtPayload } from '@presentation/strategies/jwt.strategy';
import { UserModel } from '@domain/models/user.model';

/**
 * JWT Strategy Mock Factory for Presentation Layer Testing
 * Provides controllable implementations for testing authentication flows
 */
export class JwtStrategyMockFactory {
  static createSuccess(user?: UserModel): jest.Mocked<JwtStrategy> {
    const mockUser = user || {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashed-password',
      avatarUrl: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = mockUser;

    return {
      validate: jest.fn().mockResolvedValue(userWithoutPassword),
    } as any;
  }

  static createFailure(error: Error): jest.Mocked<JwtStrategy> {
    return {
      validate: jest.fn().mockRejectedValue(error),
    } as any;
  }

  static createUserNotFound(): jest.Mocked<JwtStrategy> {
    return {
      validate: jest.fn().mockResolvedValue(null),
    } as any;
  }

  static createConditional(
    condition: (payload: JwtPayload) => boolean,
    successUser?: UserModel,
  ): jest.Mocked<JwtStrategy> {
    const mockUser = successUser || {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashed-password',
      avatarUrl: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = mockUser;

    return {
      validate: jest.fn().mockImplementation((payload: JwtPayload) => {
        return condition(payload)
          ? Promise.resolve(userWithoutPassword)
          : Promise.resolve(null);
      }),
    } as any;
  }

  static createSpy(): jest.Mocked<JwtStrategy> {
    return {
      validate: jest.fn(),
    } as any;
  }
}
