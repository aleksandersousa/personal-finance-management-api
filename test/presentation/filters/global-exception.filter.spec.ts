import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { GlobalExceptionFilter } from '../../../src/presentation/filters/global-exception.filter';
import { LoggerProtocolMock } from '../mocks/filters/logger.mock';
import { ArgumentsHostMockFactory } from '../mocks/filters/arguments-host.mock';
import { HttpMockFactory } from '../mocks/filters/http.mock';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let loggerMock: LoggerProtocolMock;
  let defaultLoggerSpy: jest.SpyInstance;

  beforeEach(() => {
    loggerMock = new LoggerProtocolMock();
    filter = new GlobalExceptionFilter(loggerMock);

    // Spy on default logger
    defaultLoggerSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation();

    jest.clearAllMocks();
  });

  afterEach(() => {
    loggerMock.clear();
    defaultLoggerSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should create filter with custom logger', () => {
      // Act
      const filterWithLogger = new GlobalExceptionFilter(loggerMock);

      // Assert
      expect(filterWithLogger).toBeDefined();
      expect(filterWithLogger).toBeInstanceOf(GlobalExceptionFilter);
    });

    it('should create filter without custom logger', () => {
      // Act
      const filterWithoutLogger = new GlobalExceptionFilter();

      // Assert
      expect(filterWithoutLogger).toBeDefined();
      expect(filterWithoutLogger).toBeInstanceOf(GlobalExceptionFilter);
    });
  });

  describe('catch - HttpException handling', () => {
    it('should handle HttpException with string response', () => {
      // Arrange
      const exception = new HttpException(
        'Bad Request',
        HttpStatus.BAD_REQUEST,
      );
      const mockRequest = HttpMockFactory.createRequestWithTracing('trace-123');
      const mockResponse = HttpMockFactory.createResponse();
      const host = ArgumentsHostMockFactory.create(mockRequest, mockResponse);

      // Act
      filter.catch(exception, host as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        timestamp: expect.any(String),
        path: '/test',
        method: 'GET',
        message: 'Bad Request',
        error: 'BAD_REQUEST',
        traceId: 'trace-123',
      });

      // Verify security event logging
      expect(loggerMock.getSecurityEventsCount()).toBe(1);
      const securityEvent = loggerMock.getLastSecurityEvent();
      expect(securityEvent).toMatchObject({
        event: 'http_exception',
        severity: 'medium',
        statusCode: 400,
        message: 'Bad Request',
        endpoint: 'GET /test',
        traceId: 'trace-123',
        details: {
          exceptionType: 'HttpException',
          stack: expect.any(String),
        },
      });
    });

    it('should handle HttpException with object response', () => {
      // Arrange
      const exceptionResponse = {
        message: ['Field is required', 'Invalid format'],
        error: 'Validation Error',
      };
      const exception = new HttpException(
        exceptionResponse,
        HttpStatus.BAD_REQUEST,
      );
      const mockRequest = HttpMockFactory.createRequestWithTracing('trace-456');
      const mockResponse = HttpMockFactory.createResponse();
      const host = ArgumentsHostMockFactory.create(mockRequest, mockResponse);

      // Act
      filter.catch(exception, host as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        timestamp: expect.any(String),
        path: '/test',
        method: 'GET',
        message: ['Field is required', 'Invalid format'],
        error: 'Validation Error',
        traceId: 'trace-456',
      });

      // Verify security event logging with joined message
      const securityEvent = loggerMock.getLastSecurityEvent();
      expect(securityEvent?.message).toBe('Field is required, Invalid format');
    });

    it('should handle HttpException with different severity levels', () => {
      // Arrange - Test 500 level (high severity)
      const serverException = new HttpException(
        'Internal Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      const mockRequest = HttpMockFactory.createRequest();
      const mockResponse = HttpMockFactory.createResponse();
      const host = ArgumentsHostMockFactory.create(mockRequest, mockResponse);

      // Act
      filter.catch(serverException, host as any);

      // Assert
      let securityEvent = loggerMock.getLastSecurityEvent();
      expect(securityEvent?.severity).toBe('high');

      // Arrange - Test 400 level (medium severity)
      loggerMock.clear();
      const clientException = new HttpException(
        'Bad Request',
        HttpStatus.BAD_REQUEST,
      );

      // Act
      filter.catch(clientException, host as any);

      // Assert
      securityEvent = loggerMock.getLastSecurityEvent();
      expect(securityEvent?.severity).toBe('medium');

      // Arrange - Test 300 level (low severity)
      loggerMock.clear();
      const redirectException = new HttpException(
        'Moved',
        HttpStatus.MOVED_PERMANENTLY,
      );

      // Act
      filter.catch(redirectException, host as any);

      // Assert
      securityEvent = loggerMock.getLastSecurityEvent();
      expect(securityEvent?.severity).toBe('low');
    });

    it('should include all request context in security event', () => {
      // Arrange
      const exception = new HttpException(
        'Unauthorized',
        HttpStatus.UNAUTHORIZED,
      );
      const mockRequest = HttpMockFactory.createRequest({
        method: 'POST',
        url: '/api/auth/login',
        headers: {
          'user-agent': 'Mozilla/5.0 Custom Browser',
        },
        ip: '192.168.1.100',
        traceContext: {
          traceId: 'auth-trace-789',
          spanId: 'auth-span-123',
        },
      });
      const mockResponse = HttpMockFactory.createResponse();
      const host = ArgumentsHostMockFactory.create(mockRequest, mockResponse);

      // Act
      filter.catch(exception, host as any);

      // Assert
      const securityEvent = loggerMock.getLastSecurityEvent();
      expect(securityEvent).toMatchObject({
        event: 'http_exception',
        severity: 'medium',
        statusCode: 401,
        message: 'Unauthorized',
        endpoint: 'POST /api/auth/login',
        userAgent: 'Mozilla/5.0 Custom Browser',
        clientIp: '192.168.1.100',
        traceId: 'auth-trace-789',
        details: {
          exceptionType: 'HttpException',
          stack: expect.any(String),
        },
      });
    });
  });

  describe('catch - Unexpected error handling', () => {
    it('should handle unexpected Error instances', () => {
      // Arrange
      const error = new Error('Database connection failed');
      error.stack = 'Error: Database connection failed\n    at test.js:1:1';
      const mockRequest = HttpMockFactory.createRequestWithTracing(
        'error-trace-123',
        'error-span-456',
      );
      const mockResponse = HttpMockFactory.createResponse();
      const host = ArgumentsHostMockFactory.create(mockRequest, mockResponse);

      // Act
      filter.catch(error, host as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 500,
        timestamp: expect.any(String),
        path: '/test',
        method: 'GET',
        message: 'Internal server error occurred',
        error: 'Internal Server Error',
        traceId: 'error-trace-123',
      });

      // Verify security event logging
      const securityEvent = loggerMock.getLastSecurityEvent();
      expect(securityEvent).toMatchObject({
        event: 'unexpected_error',
        severity: 'critical',
        statusCode: 500,
        message: 'Database connection failed',
        endpoint: 'GET /test',
        traceId: 'error-trace-123',
        spanId: 'error-span-456',
        details: {
          stack: 'Error: Database connection failed\n    at test.js:1:1',
          exceptionType: 'Error',
        },
      });
    });

    it('should handle non-Error unexpected exceptions', () => {
      // Arrange
      const unexpectedException = 'String error thrown';
      const mockRequest = HttpMockFactory.createRequest();
      const mockResponse = HttpMockFactory.createResponse();
      const host = ArgumentsHostMockFactory.create(mockRequest, mockResponse);

      // Act
      filter.catch(unexpectedException, host as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 500,
        timestamp: expect.any(String),
        path: '/test',
        method: 'GET',
        message: 'Internal server error occurred',
        error: 'Internal Server Error',
        traceId: 'test-trace-id',
      });

      // Verify security event logging
      const securityEvent = loggerMock.getLastSecurityEvent();
      expect(securityEvent).toMatchObject({
        event: 'unexpected_error',
        severity: 'critical',
        statusCode: 500,
        message: 'String error thrown',
        details: {
          stack: undefined,
          exceptionType: 'String',
        },
      });
    });

    it('should handle null/undefined exceptions', () => {
      // Arrange
      const nullException = null;
      const mockRequest = HttpMockFactory.createRequest();
      const mockResponse = HttpMockFactory.createResponse();
      const host = ArgumentsHostMockFactory.create(mockRequest, mockResponse);

      // Act
      filter.catch(nullException, host as any);

      // Assert
      const securityEvent = loggerMock.getLastSecurityEvent();
      expect(securityEvent?.message).toBe('null');
      expect(securityEvent?.details?.exceptionType).toBe('object');

      // Test undefined
      loggerMock.clear();
      filter.catch(undefined, host as any);

      const undefinedEvent = loggerMock.getLastSecurityEvent();
      expect(undefinedEvent?.message).toBe('undefined');
      expect(undefinedEvent?.details?.exceptionType).toBe('undefined');
    });
  });

  describe('catch - Context extraction', () => {
    it('should handle request without trace context', () => {
      // Arrange
      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
      const mockRequest = HttpMockFactory.createRequestWithoutTracing();
      const mockResponse = HttpMockFactory.createResponse();
      const host = ArgumentsHostMockFactory.create(mockRequest, mockResponse);

      // Act
      filter.catch(exception, host as any);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 404,
        timestamp: expect.any(String),
        path: '/test',
        method: 'GET',
        message: 'Not Found',
        error: 'NOT_FOUND',
        // No traceId should be included
      });

      // Verify security event has undefined traceId
      const securityEvent = loggerMock.getLastSecurityEvent();
      expect(securityEvent?.traceId).toBeUndefined();
    });

    it('should handle request with missing IP information', () => {
      // Arrange
      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      const mockRequest = HttpMockFactory.createRequest({
        ip: undefined,
        connection: undefined,
      });
      const mockResponse = HttpMockFactory.createResponse();
      const host = ArgumentsHostMockFactory.create(mockRequest, mockResponse);

      // Act
      filter.catch(exception, host as any);

      // Assert
      const securityEvent = loggerMock.getLastSecurityEvent();
      expect(securityEvent?.clientIp).toBeUndefined();
    });

    it('should extract IP from connection when request.ip is missing', () => {
      // Arrange
      const exception = new HttpException(
        'Method Not Allowed',
        HttpStatus.METHOD_NOT_ALLOWED,
      );
      const mockRequest = HttpMockFactory.createRequest({
        ip: undefined,
        connection: {
          remoteAddress: '10.0.0.1',
        },
      });
      const mockResponse = HttpMockFactory.createResponse();
      const host = ArgumentsHostMockFactory.create(mockRequest, mockResponse);

      // Act
      filter.catch(exception, host as any);

      // Assert
      const securityEvent = loggerMock.getLastSecurityEvent();
      expect(securityEvent?.clientIp).toBe('10.0.0.1');
    });
  });

  describe('catch - Default logger fallback', () => {
    it('should use default logger when custom logger is not provided', () => {
      // Arrange
      const filterWithoutLogger = new GlobalExceptionFilter();
      const exception = new HttpException(
        'Service Unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
      const mockRequest = HttpMockFactory.createRequest();
      const mockResponse = HttpMockFactory.createResponse();
      const host = ArgumentsHostMockFactory.create(mockRequest, mockResponse);

      // Act
      filterWithoutLogger.catch(exception, host as any);

      // Assert
      expect(defaultLoggerSpy).toHaveBeenCalledWith(
        'HTTP 503: "Service Unavailable"',
        expect.any(String),
        'GET /test',
      );
      expect(loggerMock.getSecurityEventsCount()).toBe(0);
    });

    it('should use default logger for unexpected errors when custom logger is not provided', () => {
      // Arrange
      const filterWithoutLogger = new GlobalExceptionFilter();
      const error = new Error('Unexpected system error');
      const mockRequest = HttpMockFactory.createRequest();
      const mockResponse = HttpMockFactory.createResponse();
      const host = ArgumentsHostMockFactory.create(mockRequest, mockResponse);

      // Act
      filterWithoutLogger.catch(error, host as any);

      // Assert
      expect(defaultLoggerSpy).toHaveBeenCalledWith(
        'Unexpected error: Error: Unexpected system error',
        expect.any(String),
        'GET /test',
      );
    });

    it('should use default logger for non-Error unexpected exceptions with undefined stack', () => {
      // Arrange
      const filterWithoutLogger = new GlobalExceptionFilter();
      const nonErrorException = 'String error without stack trace';
      const mockRequest = HttpMockFactory.createRequest();
      const mockResponse = HttpMockFactory.createResponse();
      const host = ArgumentsHostMockFactory.create(mockRequest, mockResponse);

      // Act
      filterWithoutLogger.catch(nonErrorException, host as any);

      // Assert
      expect(defaultLoggerSpy).toHaveBeenCalledWith(
        'Unexpected error: String error without stack trace',
        undefined, // This specifically tests the undefined branch of the ternary
        'GET /test',
      );
    });
  });

  describe('response formatting', () => {
    it('should format response with all required fields', () => {
      // Arrange
      const exception = new HttpException('Conflict', HttpStatus.CONFLICT);
      const mockRequest = HttpMockFactory.createRequestWithMethod(
        'PUT',
        '/api/users/123',
      );
      const mockResponse = HttpMockFactory.createResponse();
      const host = ArgumentsHostMockFactory.create(mockRequest, mockResponse);

      // Act
      filter.catch(exception, host as any);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 409,
        timestamp: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        path: '/api/users/123',
        method: 'PUT',
        message: 'Conflict',
        error: 'CONFLICT',
        traceId: 'test-trace-id',
      });
    });

    it('should format timestamp correctly', () => {
      // Arrange
      const exception = new HttpException('OK', HttpStatus.OK);
      const mockRequest = HttpMockFactory.createRequest();
      const mockResponse = HttpMockFactory.createResponse();
      const host = ArgumentsHostMockFactory.create(mockRequest, mockResponse);

      const beforeTime = Date.now();

      // Act
      filter.catch(exception, host as any);

      // Assert
      const afterTime = Date.now();
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      const timestamp = responseCall.timestamp;
      const timestampMs = new Date(timestamp).getTime();

      expect(timestampMs).toBeGreaterThanOrEqual(beforeTime);
      expect(timestampMs).toBeLessThanOrEqual(afterTime);
      expect(timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });
  });

  describe('edge cases', () => {
    it('should handle HttpException without proper status', () => {
      // Arrange
      const malformedHttpException = new HttpException(
        'Malformed',
        999 as HttpStatus,
      );
      const mockRequest = HttpMockFactory.createRequest();
      const mockResponse = HttpMockFactory.createResponse();
      const host = ArgumentsHostMockFactory.create(mockRequest, mockResponse);

      // Act
      filter.catch(malformedHttpException, host as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(999);
      const securityEvent = loggerMock.getLastSecurityEvent();
      expect(securityEvent?.statusCode).toBe(999);
    });

    it('should handle HttpException with complex nested response', () => {
      // Arrange
      const complexResponse = {
        message: {
          field1: 'error1',
          field2: ['error2', 'error3'],
        },
        error: 'Complex Validation Error',
        statusCode: 422,
      };
      const exception = new HttpException(
        complexResponse,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      const mockRequest = HttpMockFactory.createRequest();
      const mockResponse = HttpMockFactory.createResponse();
      const host = ArgumentsHostMockFactory.create(mockRequest, mockResponse);

      // Act
      filter.catch(exception, host as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(422);
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.message).toBe(complexResponse.message);
      expect(responseCall.error).toBe('Complex Validation Error');
    });

    it('should handle missing user-agent header', () => {
      // Arrange
      const exception = new HttpException(
        'Bad Gateway',
        HttpStatus.BAD_GATEWAY,
      );
      const mockRequest = HttpMockFactory.createRequest({
        headers: {}, // No user-agent
      });
      const mockResponse = HttpMockFactory.createResponse();
      const host = ArgumentsHostMockFactory.create(mockRequest, mockResponse);

      // Act
      filter.catch(exception, host as any);

      // Assert
      const securityEvent = loggerMock.getLastSecurityEvent();
      expect(securityEvent?.userAgent).toBeUndefined();
    });

    it('should handle HttpException with object response but no message', () => {
      // Arrange
      const exceptionResponse = {
        statusCode: 400,
        error: 'Custom Error',
        // No message property
      };
      const exception = new HttpException(
        exceptionResponse,
        HttpStatus.BAD_REQUEST,
      );
      const mockRequest = HttpMockFactory.createRequest();
      const mockResponse = HttpMockFactory.createResponse();
      const host = ArgumentsHostMockFactory.create(mockRequest, mockResponse);

      // Act
      filter.catch(exception, host as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.message).toBe('Http Exception'); // Fallback to exception.message (which is the string representation)
      expect(responseCall.error).toBe('Custom Error');
    });

    it('should handle HttpException with object response but no error', () => {
      // Arrange
      const exceptionResponse = {
        message: 'Custom message',
        statusCode: 400,
        // No error property
      };
      const exception = new HttpException(
        exceptionResponse,
        HttpStatus.BAD_REQUEST,
      );
      const mockRequest = HttpMockFactory.createRequest();
      const mockResponse = HttpMockFactory.createResponse();
      const host = ArgumentsHostMockFactory.create(mockRequest, mockResponse);

      // Act
      filter.catch(exception, host as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.message).toBe('Custom message');
      expect(responseCall.error).toBe('BAD_REQUEST'); // Fallback to HttpStatus[status]
    });

    it('should not include traceId in response when not present', () => {
      // Arrange
      const exception = new HttpException('Test Error', HttpStatus.BAD_REQUEST);
      const mockRequest = HttpMockFactory.createRequestWithoutTracing();
      const mockResponse = HttpMockFactory.createResponse();
      const host = ArgumentsHostMockFactory.create(mockRequest, mockResponse);

      // Act
      filter.catch(exception, host as any);

      // Assert
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall).not.toHaveProperty('traceId');
      expect(Object.keys(responseCall)).toEqual([
        'statusCode',
        'timestamp',
        'path',
        'method',
        'message',
        'error',
      ]);
    });

    it('should handle HttpException with undefined HttpStatus mapping', () => {
      // Arrange
      const exceptionResponse = {
        message: 'Custom message',
        // No error property and HttpStatus[999] will be undefined
      };
      const exception = new HttpException(exceptionResponse, 999 as any);
      const mockRequest = HttpMockFactory.createRequest();
      const mockResponse = HttpMockFactory.createResponse();
      const host = ArgumentsHostMockFactory.create(mockRequest, mockResponse);

      // Act
      filter.catch(exception, host as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(999);
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.message).toBe('Custom message');
      expect(responseCall.error).toBe('HTTP Exception'); // Fallback to 'HTTP Exception' when HttpStatus[status] is undefined
    });

    it('should handle HttpException string response with undefined HttpStatus mapping', () => {
      // Arrange
      const exception = new HttpException('Custom error message', 999 as any);
      const mockRequest = HttpMockFactory.createRequest();
      const mockResponse = HttpMockFactory.createResponse();
      const host = ArgumentsHostMockFactory.create(mockRequest, mockResponse);

      // Act
      filter.catch(exception, host as any);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(999);
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.message).toBe('Custom error message');
      expect(responseCall.error).toBe('HTTP Exception'); // Fallback to 'HTTP Exception' when HttpStatus[status] is undefined
    });

    it('should conditionally include traceId in response when present', () => {
      // Arrange
      const exception = new HttpException('Test Error', HttpStatus.BAD_REQUEST);
      const mockRequest =
        HttpMockFactory.createRequestWithTracing('test-trace-456');
      const mockResponse = HttpMockFactory.createResponse();
      const host = ArgumentsHostMockFactory.create(mockRequest, mockResponse);

      // Act
      filter.catch(exception, host as any);

      // Assert
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall).toHaveProperty('traceId', 'test-trace-456');
      expect(Object.keys(responseCall)).toContain('traceId');
    });

    it('should not include traceId in response when traceId is empty string', () => {
      // Arrange
      const exception = new HttpException('Test Error', HttpStatus.BAD_REQUEST);
      const mockRequest = HttpMockFactory.createRequestWithTracing(''); // Empty string
      const mockResponse = HttpMockFactory.createResponse();
      const host = ArgumentsHostMockFactory.create(mockRequest, mockResponse);

      // Act
      filter.catch(exception, host as any);

      // Assert
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall).not.toHaveProperty('traceId');
      expect(Object.keys(responseCall)).toEqual([
        'statusCode',
        'timestamp',
        'path',
        'method',
        'message',
        'error',
      ]);
    });
  });
});
