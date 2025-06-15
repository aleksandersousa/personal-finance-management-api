import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  describe('canActivate', () => {
    it('should call super.canActivate with the execution context', () => {
      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: { authorization: 'Bearer valid-token' },
          }),
        }),
      } as unknown as ExecutionContext;

      const canActivateSpy = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)),
        'canActivate',
      );
      canActivateSpy.mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(canActivateSpy).toHaveBeenCalledWith(mockExecutionContext);
      expect(result).toBe(true);
    });
  });

  describe('handleRequest', () => {
    it('should return user when valid user provided', () => {
      const mockUser = { id: 'user-123', email: 'test@test.com' };

      const result = guard.handleRequest(null, mockUser, null);

      expect(result).toBe(mockUser);
    });

    it('should throw UnauthorizedException when no user provided', () => {
      expect(() => {
        guard.handleRequest(null, null, null);
      }).toThrow(UnauthorizedException);

      expect(() => {
        guard.handleRequest(null, null, null);
      }).toThrow('Invalid or expired token');
    });

    it('should throw UnauthorizedException when user is undefined', () => {
      expect(() => {
        guard.handleRequest(null, undefined, null);
      }).toThrow(UnauthorizedException);

      expect(() => {
        guard.handleRequest(null, undefined, null);
      }).toThrow('Invalid or expired token');
    });

    it('should throw error when error is provided', () => {
      const customError = new Error('Custom auth error');

      expect(() => {
        guard.handleRequest(customError, null, null);
      }).toThrow(customError);
    });

    it('should throw error when both error and user are provided but error takes precedence', () => {
      const mockUser = { id: 'user-123', email: 'test@test.com' };
      const customError = new Error('Custom auth error');

      expect(() => {
        guard.handleRequest(customError, mockUser, null);
      }).toThrow(customError);
    });
  });
});
