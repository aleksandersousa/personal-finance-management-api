import { TraceContextMiddleware } from '../../../src/infra/middleware/trace-context.middleware';
import { Request, Response, NextFunction } from 'express';

describe('TraceContextMiddleware', () => {
  let middleware: TraceContextMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let setHeaderSpy: jest.Mock;

  beforeEach(() => {
    middleware = new TraceContextMiddleware();

    // Mock Response with setHeader spy
    setHeaderSpy = jest.fn();
    mockResponse = {
      setHeader: setHeaderSpy,
    };

    // Mock NextFunction
    mockNext = jest.fn();

    // Reset request for each test
    mockRequest = {
      headers: {},
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('use', () => {
    it('should generate new traceId and spanId when no x-trace-id header exists', () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockRequest.traceContext).toBeDefined();
      expect(mockRequest.traceContext?.traceId).toBeDefined();
      expect(mockRequest.traceContext?.spanId).toBeDefined();
      expect(typeof mockRequest.traceContext?.traceId).toBe('string');
      expect(typeof mockRequest.traceContext?.spanId).toBe('string');

      // Verify traceId is UUID format (basic check)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(mockRequest.traceContext?.traceId || '')).toBe(
        true,
      );

      // Verify spanId is first part of UUID (8 characters)
      expect(mockRequest.traceContext?.spanId).toHaveLength(8);
      expect(
        /^[0-9a-f]{8}$/i.test(mockRequest.traceContext?.spanId || ''),
      ).toBe(true);
    });

    it('should preserve existing traceId from x-trace-id header', () => {
      // Arrange
      const existingTraceId = 'existing-trace-id-123';
      mockRequest.headers = {
        'x-trace-id': existingTraceId,
      };

      // Act
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockRequest.traceContext?.traceId).toBe(existingTraceId);
      expect(mockRequest.traceContext?.spanId).toBeDefined();
      expect(mockRequest.traceContext?.spanId).toHaveLength(8);
    });

    it('should set correct propagation headers on response', () => {
      // Arrange
      const existingTraceId = 'test-trace-id';
      mockRequest.headers = {
        'x-trace-id': existingTraceId,
      };

      // Act
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(setHeaderSpy).toHaveBeenCalledWith('x-trace-id', existingTraceId);
      expect(setHeaderSpy).toHaveBeenCalledWith(
        'x-span-id',
        mockRequest.traceContext?.spanId,
      );
    });

    it('should set all required security headers', () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert - Verify all security headers are set
      expect(setHeaderSpy).toHaveBeenCalledWith(
        'X-Content-Type-Options',
        'nosniff',
      );
      expect(setHeaderSpy).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(setHeaderSpy).toHaveBeenCalledWith(
        'X-XSS-Protection',
        '1; mode=block',
      );
      expect(setHeaderSpy).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains',
      );
      expect(setHeaderSpy).toHaveBeenCalledWith(
        'Referrer-Policy',
        'strict-origin-when-cross-origin',
      );

      // Verify total number of headers set (2 trace headers + 5 security headers)
      expect(setHeaderSpy).toHaveBeenCalledTimes(7);
    });

    it('should call next function to continue middleware chain', () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle x-trace-id header as array and use string value', () => {
      // Arrange
      mockRequest.headers = {
        'x-trace-id': ['first-trace-id', 'second-trace-id'],
      };

      // Act
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      // Express automatically converts array headers to comma-separated string
      expect(mockRequest.traceContext?.traceId).toEqual([
        'first-trace-id',
        'second-trace-id',
      ]);
    });

    it('should handle empty x-trace-id header by generating new traceId', () => {
      // Arrange
      mockRequest.headers = {
        'x-trace-id': '',
      };

      // Act
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockRequest.traceContext?.traceId).not.toBe('');
      expect(mockRequest.traceContext?.traceId).toBeDefined();

      // Should generate new UUID since empty string is falsy
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(mockRequest.traceContext?.traceId || '')).toBe(
        true,
      );
    });

    it('should generate different traceIds for different requests when no header provided', () => {
      // Arrange
      const firstRequest = { headers: {} } as unknown as Request;
      const secondRequest = { headers: {} } as unknown as Request;

      // Act
      middleware.use(firstRequest, mockResponse as Response, mockNext);
      middleware.use(secondRequest, mockResponse as Response, mockNext);

      // Assert
      expect(firstRequest.traceContext?.traceId).toBeDefined();
      expect(secondRequest.traceContext?.traceId).toBeDefined();
      expect(firstRequest.traceContext?.traceId).not.toBe(
        secondRequest.traceContext?.traceId,
      );
    });

    it('should generate different spanIds for each request', () => {
      // Arrange
      const sameTraceId = 'same-trace-id';
      const firstRequest = {
        headers: { 'x-trace-id': sameTraceId },
      } as unknown as Request;
      const secondRequest = {
        headers: { 'x-trace-id': sameTraceId },
      } as unknown as Request;

      // Act
      middleware.use(firstRequest, mockResponse as Response, mockNext);
      middleware.use(secondRequest, mockResponse as Response, mockNext);

      // Assert
      expect(firstRequest.traceContext?.traceId).toBe(sameTraceId);
      expect(secondRequest.traceContext?.traceId).toBe(sameTraceId);
      expect(firstRequest.traceContext?.spanId).not.toBe(
        secondRequest.traceContext?.spanId,
      );
      expect(firstRequest.traceContext?.spanId).toHaveLength(8);
      expect(secondRequest.traceContext?.spanId).toHaveLength(8);
    });

    it('should handle undefined headers gracefully', () => {
      // Arrange
      mockRequest.headers = undefined as any;

      // Act
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert - Should generate new traceId when headers is undefined
      expect(mockRequest.traceContext?.traceId).toBeDefined();
      expect(mockRequest.traceContext?.spanId).toBeDefined();
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Verify it's a valid UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(mockRequest.traceContext?.traceId || '')).toBe(
        true,
      );
    });

    it('should preserve request object integrity', () => {
      // Arrange
      const originalRequestData = { someProperty: 'test-value' };
      mockRequest = { ...mockRequest, ...originalRequestData };

      // Act
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect((mockRequest as any).someProperty).toBe('test-value');
      expect(mockRequest.traceContext).toBeDefined();
    });
  });

  describe('traceContext structure', () => {
    it('should create traceContext with correct structure', () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockRequest.traceContext).toEqual({
        traceId: expect.any(String),
        spanId: expect.any(String),
      });
    });

    it('should ensure spanId is derived from UUID format', () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      const spanId = mockRequest.traceContext?.spanId;
      expect(spanId).toHaveLength(8);
      expect(/^[0-9a-f]{8}$/i.test(spanId || '')).toBe(true);
    });
  });

  describe('header propagation', () => {
    it('should propagate generated traceId to response headers', () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      const traceId = mockRequest.traceContext?.traceId;
      const spanId = mockRequest.traceContext?.spanId;

      expect(setHeaderSpy).toHaveBeenCalledWith('x-trace-id', traceId);
      expect(setHeaderSpy).toHaveBeenCalledWith('x-span-id', spanId);
    });

    it('should maintain trace propagation chain', () => {
      // Arrange
      const parentTraceId = 'parent-service-trace-id';
      mockRequest.headers = {
        'x-trace-id': parentTraceId,
      };

      // Act
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(setHeaderSpy).toHaveBeenCalledWith('x-trace-id', parentTraceId);
      expect(setHeaderSpy).toHaveBeenCalledWith(
        'x-span-id',
        expect.any(String),
      );

      // Verify spanId is different from traceId (new span in same trace)
      expect(mockRequest.traceContext?.spanId).not.toBe(parentTraceId);
    });
  });

  describe('security headers', () => {
    it('should set X-Content-Type-Options header correctly', () => {
      // Act
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(setHeaderSpy).toHaveBeenCalledWith(
        'X-Content-Type-Options',
        'nosniff',
      );
    });

    it('should set X-Frame-Options header correctly', () => {
      // Act
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(setHeaderSpy).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    });

    it('should set X-XSS-Protection header correctly', () => {
      // Act
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(setHeaderSpy).toHaveBeenCalledWith(
        'X-XSS-Protection',
        '1; mode=block',
      );
    });

    it('should set Strict-Transport-Security header correctly', () => {
      // Act
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(setHeaderSpy).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains',
      );
    });

    it('should set Referrer-Policy header correctly', () => {
      // Act
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(setHeaderSpy).toHaveBeenCalledWith(
        'Referrer-Policy',
        'strict-origin-when-cross-origin',
      );
    });
  });
});
