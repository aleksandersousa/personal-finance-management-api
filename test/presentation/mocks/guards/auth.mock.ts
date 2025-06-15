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
}
