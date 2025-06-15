/**
 * Auth Guard Mock Factory for Presentation Layer Testing
 * Provides controllable authentication guard mocks
 */

export const mockJwtAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

export class AuthGuardMockFactory {
  static createAuthorized(): any {
    return {
      canActivate: jest.fn().mockReturnValue(true),
    };
  }

  static createUnauthorized(): any {
    return {
      canActivate: jest.fn().mockReturnValue(false),
    };
  }

  static createConditional(condition: boolean): any {
    return {
      canActivate: jest.fn().mockReturnValue(condition),
    };
  }

  static createSpy(): any {
    return {
      canActivate: jest.fn().mockReturnValue(true),
    };
  }

  static createWithContext(): any {
    return {
      canActivate: jest.fn((context) => {
        const request = context.switchToHttp().getRequest();
        return !!request.user;
      }),
    };
  }

  static createAsync(): any {
    return {
      canActivate: jest.fn().mockResolvedValue(true),
    };
  }

  static createAsyncUnauthorized(): any {
    return {
      canActivate: jest.fn().mockResolvedValue(false),
    };
  }

  static createThrowingError(error: Error): any {
    return {
      canActivate: jest.fn().mockRejectedValue(error),
    };
  }

  static createAdminGuard(): any {
    return {
      canActivate: jest.fn((context) => {
        const request = context.switchToHttp().getRequest();
        return request.user && request.user.role === "admin";
      }),
    };
  }
}
