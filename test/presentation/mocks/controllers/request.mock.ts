/**
 * Request Mock Factory for Presentation Layer Testing
 * Provides controllable HTTP request mocks
 */

export const mockRequest = {
  user: {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    email: 'test@example.com',
  },
  traceId: 'trace-123',
  headers: {
    authorization: 'Bearer mock-jwt-token',
    'content-type': 'application/json',
  },
  ip: '127.0.0.1',
  method: 'DELETE',
  url: '/api/v1/entries/entry-123',
  params: {
    id: 'entry-123',
  },
};

export class RequestMockFactory {
  static create(overrides: any = {}): any {
    return { ...mockRequest, ...overrides };
  }

  static createWithUser(
    userId: string,
    email: string = 'test@example.com',
  ): any {
    return this.create({
      user: { id: userId, email },
    });
  }

  static createWithAdmin(userId: string = 'admin-123'): any {
    return this.create({
      user: { id: userId, email: 'admin@example.com' },
    });
  }

  static createUnauthorized(): any {
    return this.create({
      user: null,
      headers: { ...mockRequest.headers, authorization: undefined },
    });
  }

  static createWithParams(params: any): any {
    return this.create({ params });
  }
}
