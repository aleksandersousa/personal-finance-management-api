import { Response } from 'express';

export interface MockRequest {
  method?: string;
  url?: string;
  headers?: { [key: string]: any };
  traceContext?: {
    traceId?: string;
    spanId?: string;
  };
  ip?: string;
  connection?: {
    remoteAddress?: string;
  };
}

export interface MockResponse extends Partial<Response> {
  statusCode?: number;
  jsonData?: any;
}

export class HttpMockFactory {
  static createRequest(overrides: Partial<MockRequest> = {}): MockRequest {
    return {
      method: 'GET',
      url: '/test',
      headers: {
        'user-agent': 'test-agent',
      },
      ip: '127.0.0.1',
      connection: {
        remoteAddress: '127.0.0.1',
      },
      traceContext: {
        traceId: 'test-trace-id',
        spanId: 'test-span-id',
      },
      ...overrides,
    };
  }

  static createResponse(): MockResponse {
    const response = {
      statusCode: 200,
      jsonData: null,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as MockResponse;

    response.status = jest.fn().mockImplementation((code: number) => {
      response.statusCode = code;
      return response;
    });

    response.json = jest.fn().mockImplementation((data: any) => {
      response.jsonData = data;
      return response;
    });

    return response;
  }

  static createRequestWithTracing(
    traceId: string,
    spanId?: string,
  ): MockRequest {
    return this.createRequest({
      traceContext: {
        traceId,
        spanId: spanId || 'test-span-id',
      },
    });
  }

  static createRequestWithoutTracing(): MockRequest {
    return this.createRequest({
      traceContext: undefined,
    });
  }

  static createRequestWithMethod(method: string, url: string): MockRequest {
    return this.createRequest({
      method,
      url,
    });
  }

  static createRequestWithUserAgent(userAgent: string): MockRequest {
    return this.createRequest({
      headers: {
        'user-agent': userAgent,
      },
    });
  }

  static createRequestWithIp(ip: string): MockRequest {
    return this.createRequest({
      ip,
      connection: {
        remoteAddress: ip,
      },
    });
  }
}
