import { MockRequest, MockResponse } from './http.mock';

export class ArgumentsHostMock {
  constructor(
    private request: MockRequest,
    private response: MockResponse,
  ) {}

  switchToHttp() {
    return {
      getRequest: () => this.request as any,
      getResponse: () => this.response as any,
      getNext: () => jest.fn(),
    };
  }
}

export class ArgumentsHostMockFactory {
  static create(
    request: MockRequest,
    response: MockResponse,
  ): ArgumentsHostMock {
    return new ArgumentsHostMock(request, response);
  }

  static createDefault(): ArgumentsHostMock {
    const request = {
      method: 'GET',
      url: '/test',
      headers: { 'user-agent': 'test-agent' },
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      traceContext: { traceId: 'test-trace-id', spanId: 'test-span-id' },
    };

    const response = {
      statusCode: 200,
      jsonData: null,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    return new ArgumentsHostMock(request, response);
  }

  static createWithTracing(
    traceId: string,
    spanId?: string,
  ): ArgumentsHostMock {
    const request = {
      method: 'GET',
      url: '/test',
      headers: { 'user-agent': 'test-agent' },
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      traceContext: { traceId, spanId: spanId || 'test-span-id' },
    };

    const response = {
      statusCode: 200,
      jsonData: null,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    return new ArgumentsHostMock(request, response);
  }

  static createWithoutTracing(): ArgumentsHostMock {
    const request = {
      method: 'GET',
      url: '/test',
      headers: { 'user-agent': 'test-agent' },
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      traceContext: undefined,
    };

    const response = {
      statusCode: 200,
      jsonData: null,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    return new ArgumentsHostMock(request, response);
  }
}
