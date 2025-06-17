export const mockForecastRequest = {
  user: {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    email: 'test@example.com',
    role: 'user',
  },
  traceId: 'trace-forecast-123',
  headers: {
    authorization: 'Bearer mock-jwt-token',
    'content-type': 'application/json',
  },
  ip: '127.0.0.1',
  method: 'GET',
  url: '/forecast',
  query: {
    months: '6',
    includeFixed: 'true',
    includeRecurring: 'false',
  },
};

export class ForecastRequestMockFactory {
  static create(overrides: any = {}): any {
    return { ...mockForecastRequest, ...overrides };
  }

  static createWithUser(
    userId: string,
    email: string = 'test@example.com',
  ): any {
    return this.create({
      user: { id: userId, email, role: 'user' },
    });
  }

  static createWithQuery(queryParams: any): any {
    return this.create({
      query: { ...mockForecastRequest.query, ...queryParams },
    });
  }

  static createWithDefaultParams(): any {
    return this.create({
      query: {
        months: undefined,
        includeFixed: undefined,
        includeRecurring: undefined,
      },
    });
  }

  static createWithCustomMonths(months: string): any {
    return this.create({
      query: { ...mockForecastRequest.query, months },
    });
  }

  static createWithInvalidMonths(): any {
    return this.create({
      query: { ...mockForecastRequest.query, months: '15' },
    });
  }

  static createWithBooleanParams(
    includeFixed: string,
    includeRecurring: string,
  ): any {
    return this.create({
      query: {
        ...mockForecastRequest.query,
        includeFixed,
        includeRecurring,
      },
    });
  }

  static createUnauthorized(): any {
    return this.create({
      user: null,
      headers: { ...mockForecastRequest.headers, authorization: undefined },
    });
  }
}
