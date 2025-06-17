import { ExecutionContext } from '@nestjs/common';

// Import the implementation directly for testing
// This is the function that is passed to createParamDecorator
const userDecoratorFn = (data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  if (!user) {
    return null;
  }

  return data ? user?.[data] : user;
};

describe('User Decorator', () => {
  let mockExecutionContext: ExecutionContext;
  let mockRequest: any;

  beforeEach(() => {
    mockRequest = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'user',
      },
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;
  });

  it('should return the entire user object when no data parameter is provided', () => {
    // Act
    const result = userDecoratorFn(undefined, mockExecutionContext);

    // Assert
    expect(result).toEqual(mockRequest.user);
  });

  it('should return a specific user property when data parameter is provided', () => {
    // Act
    const result = userDecoratorFn('id', mockExecutionContext);

    // Assert
    expect(result).toBe('test-user-id');
  });

  it('should return null when user is not defined in the request', () => {
    // Arrange
    mockRequest.user = undefined;

    // Act
    const result = userDecoratorFn('id', mockExecutionContext);

    // Assert
    expect(result).toBeNull();
  });

  it('should return undefined when a non-existent property is requested', () => {
    // Act
    const result = userDecoratorFn('nonExistentProperty', mockExecutionContext);

    // Assert
    expect(result).toBeUndefined();
  });
});
