/**
 * Request Mock Factory for Presentation Layer Testing
 * Provides controllable HTTP request mocks
 */

export const mockRequest = {
  user: {
    id: "test-user-123",
    email: "test@example.com",
    role: "user",
  },
  traceId: "trace-123",
  headers: {
    authorization: "Bearer mock-jwt-token",
    "content-type": "application/json",
  },
  ip: "127.0.0.1",
  method: "POST",
  url: "/api/v1/test",
};

export class RequestMockFactory {
  static create(overrides: any = {}): any {
    return { ...mockRequest, ...overrides };
  }

  static createWithUser(
    userId: string,
    email: string = "test@example.com"
  ): any {
    return this.create({
      user: { id: userId, email, role: "user" },
    });
  }

  static createWithAdmin(userId: string = "admin-123"): any {
    return this.create({
      user: { id: userId, email: "admin@example.com", role: "admin" },
    });
  }

  static createUnauthorized(): any {
    return this.create({
      user: null,
      headers: { ...mockRequest.headers, authorization: undefined },
    });
  }

  static createWithTraceId(traceId: string): any {
    return this.create({ traceId });
  }

  static createWithMethod(method: string): any {
    return this.create({ method });
  }

  static createWithHeaders(headers: any): any {
    return this.create({
      headers: { ...mockRequest.headers, ...headers },
    });
  }

  static createForEntry(): any {
    return this.create({
      url: "/api/v1/entries",
      method: "POST",
    });
  }

  static createForAuth(): any {
    return this.create({
      url: "/api/v1/auth/login",
      method: "POST",
      user: null,
      headers: {
        "content-type": "application/json",
      },
    });
  }
}
