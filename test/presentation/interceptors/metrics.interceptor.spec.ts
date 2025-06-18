import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { MetricsInterceptor } from '../../../src/presentation/interceptors/metrics.interceptor';
import { MetricsSpy } from '../../infra/mocks/metrics/metrics.spy';

describe('MetricsInterceptor', () => {
  let interceptor: MetricsInterceptor;
  let metricsSpy: MetricsSpy;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    metricsSpy = new MetricsSpy();
    interceptor = new MetricsInterceptor(metricsSpy);

    // Mock request object
    mockRequest = {
      method: 'POST',
      path: '/api/v1/entries',
      route: {
        path: '/entries',
      },
    };

    // Mock response object
    mockResponse = {
      statusCode: 201,
    };

    // Mock ExecutionContext
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    };

    // Mock CallHandler
    mockCallHandler = {
      handle: jest.fn(),
    };
  });

  afterEach(() => {
    metricsSpy.clear();
    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('should record HTTP request metrics on successful execution', done => {
      // Arrange
      const expectedDuration = 100;
      const responseData = { id: '123', message: 'success' };

      mockCallHandler.handle.mockReturnValue(
        new Observable(subscriber => {
          // Simulate async operation duration
          setTimeout(() => {
            subscriber.next(responseData);
            subscriber.complete();
          }, expectedDuration);
        }),
      );

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: data => {
          expect(data).toEqual(responseData);
        },
        complete: () => {
          // Verify HTTP request metrics were recorded
          expect(metricsSpy.hasRecordedMetric('http_requests_total')).toBe(
            true,
          );
          expect(
            metricsSpy.hasRecordedMetric('http_request_duration_seconds'),
          ).toBe(true);

          // Verify specific HTTP request was recorded
          expect(
            metricsSpy.hasRecordedHttpRequest('POST', '/entries', 201),
          ).toBe(true);

          // Verify duration was recorded (allowing for some variance due to timing)
          const durationMetrics = metricsSpy.getMetricsByFilter(
            'http_request_duration_seconds',
          );
          expect(durationMetrics).toHaveLength(1);
          expect(durationMetrics[0].value).toBeGreaterThanOrEqual(
            expectedDuration / 1000,
          );

          done();
        },
        error: done,
      });
    });

    it('should record HTTP request metrics with correct method and route', done => {
      // Arrange
      mockRequest.method = 'GET';
      mockRequest.route.path = '/users';
      mockResponse.statusCode = 200;

      mockCallHandler.handle.mockReturnValue(of({ users: [] }));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        complete: () => {
          expect(metricsSpy.hasRecordedHttpRequest('GET', '/users', 200)).toBe(
            true,
          );

          const requestMetrics = metricsSpy.getMetricsByFilter(
            'http_requests_total',
          );
          expect(requestMetrics).toHaveLength(1);
          expect(requestMetrics[0].labels).toEqual({
            method: 'GET',
            route: '/users',
            status_code: '200',
          });

          done();
        },
        error: done,
      });
    });

    it('should handle request without route and use path fallback', done => {
      // Arrange
      mockRequest.route = undefined;
      mockRequest.path = '/api/v1/health';

      mockCallHandler.handle.mockReturnValue(of({ status: 'ok' }));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        complete: () => {
          expect(
            metricsSpy.hasRecordedHttpRequest('POST', '/api/v1/health', 201),
          ).toBe(true);
          done();
        },
        error: done,
      });
    });

    it('should handle request without route and path using "unknown" fallback', done => {
      // Arrange
      mockRequest.route = undefined;
      mockRequest.path = undefined;

      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        complete: () => {
          expect(
            metricsSpy.hasRecordedHttpRequest('POST', 'unknown', 201),
          ).toBe(true);
          done();
        },
        error: done,
      });
    });

    it('should not record metrics when handler throws error immediately', done => {
      // Arrange
      const error = new Error('Handler error');
      mockResponse.statusCode = 500;

      mockCallHandler.handle.mockReturnValue(throwError(() => error));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: () => {
          done.fail('Should not emit next value when error occurs');
        },
        error: err => {
          expect(err).toBe(error);

          // When the observable errors immediately, tap is not executed
          // so metrics are not recorded, which is the expected behavior
          expect(metricsSpy.hasRecordedMetric('http_requests_total')).toBe(
            false,
          );
          expect(
            metricsSpy.hasRecordedMetric('http_request_duration_seconds'),
          ).toBe(false);

          done();
        },
      });
    });

    it('should record metrics when handler completes successfully after delay', done => {
      // Arrange
      const simulatedDelay = 200;

      mockCallHandler.handle.mockReturnValue(
        new Observable(subscriber => {
          setTimeout(() => {
            subscriber.next({ data: 'delayed response' });
            subscriber.complete();
          }, simulatedDelay);
        }),
      );

      const startTime = Date.now();

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        complete: () => {
          const actualDuration = Date.now() - startTime;

          const durationMetrics = metricsSpy.getMetricsByFilter(
            'http_request_duration_seconds',
          );
          expect(durationMetrics).toHaveLength(1);

          const recordedDurationMs = durationMetrics[0].value! * 1000;

          // Allow for 50ms variance due to timing precision
          expect(recordedDurationMs).toBeGreaterThanOrEqual(
            simulatedDelay - 50,
          );
          expect(recordedDurationMs).toBeLessThanOrEqual(actualDuration + 50);

          done();
        },
        error: done,
      });
    });

    it('should handle different HTTP methods correctly', done => {
      // Arrange
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      let completedRequests = 0;

      methods.forEach((method, index) => {
        // Create fresh mocks for each iteration to avoid state pollution
        const currentRequest = {
          method: method,
          path: `/test-${method.toLowerCase()}`,
          route: { path: `/test-${method.toLowerCase()}` },
        };
        const currentResponse = { statusCode: 200 + index };

        const currentContext = {
          switchToHttp: jest.fn().mockReturnValue({
            getRequest: jest.fn().mockReturnValue(currentRequest),
            getResponse: jest.fn().mockReturnValue(currentResponse),
          }),
          getClass: jest.fn(),
          getHandler: jest.fn(),
          getArgs: jest.fn(),
          getArgByIndex: jest.fn(),
          switchToRpc: jest.fn(),
          switchToWs: jest.fn(),
          getType: jest.fn(),
        };

        const currentHandler = {
          handle: jest.fn().mockReturnValue(of({ method })),
        };

        // Act
        const result$ = interceptor.intercept(
          currentContext as any,
          currentHandler,
        );

        // Assert
        result$.subscribe({
          complete: () => {
            completedRequests++;

            expect(
              metricsSpy.hasRecordedHttpRequest(
                method,
                `/test-${method.toLowerCase()}`,
                200 + index,
              ),
            ).toBe(true);

            // Check if all methods were processed
            if (completedRequests === methods.length) {
              const allMetrics = metricsSpy.getMetricsByFilter(
                'http_requests_total',
              );
              expect(allMetrics).toHaveLength(methods.length);

              methods.forEach((m, i) => {
                const methodMetric = allMetrics.find(
                  metric => metric.labels.method === m,
                );
                expect(methodMetric).toBeDefined();
                expect(methodMetric!.labels.status_code).toBe(
                  (200 + i).toString(),
                );
              });

              done();
            }
          },
          error: done,
        });
      });
    });

    it('should handle successful HTTP status codes', done => {
      // Arrange - Test only successful status codes since tap doesn't execute on errors
      const successStatusCodes = [200, 201, 202, 204];
      let completedRequests = 0;

      successStatusCodes.forEach(statusCode => {
        // Create fresh mocks for each status code
        const currentRequest = {
          method: 'POST',
          path: `/test-status-${statusCode}`,
          route: { path: `/test-status-${statusCode}` },
        };
        const currentResponse = { statusCode };

        const currentContext = {
          switchToHttp: jest.fn().mockReturnValue({
            getRequest: jest.fn().mockReturnValue(currentRequest),
            getResponse: jest.fn().mockReturnValue(currentResponse),
          }),
          getClass: jest.fn(),
          getHandler: jest.fn(),
          getArgs: jest.fn(),
          getArgByIndex: jest.fn(),
          switchToRpc: jest.fn(),
          switchToWs: jest.fn(),
          getType: jest.fn(),
        };

        const currentHandler = {
          handle: jest.fn().mockReturnValue(of({ status: statusCode })),
        };

        // Act
        const result$ = interceptor.intercept(
          currentContext as any,
          currentHandler,
        );

        // Assert
        result$.subscribe({
          complete: () => {
            completedRequests++;

            expect(
              metricsSpy.hasRecordedHttpRequest(
                'POST',
                `/test-status-${statusCode}`,
                statusCode,
              ),
            ).toBe(true);

            if (completedRequests === successStatusCodes.length) {
              // Verify all status codes were recorded
              const allMetrics = metricsSpy.getMetricsByFilter(
                'http_requests_total',
              );
              expect(allMetrics).toHaveLength(successStatusCodes.length);

              done();
            }
          },
          error: done,
        });
      });
    });

    it('should preserve original observable behavior', done => {
      // Arrange
      const expectedData = { id: '123', name: 'test', value: 42 };

      mockCallHandler.handle.mockReturnValue(of(expectedData));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: data => {
          expect(data).toEqual(expectedData);
        },
        complete: () => {
          // Verify that handler was called exactly once
          expect(mockCallHandler.handle).toHaveBeenCalledTimes(1);
          expect(mockCallHandler.handle).toHaveBeenCalledWith();

          done();
        },
        error: done,
      });
    });

    it('should not interfere with observable errors', done => {
      // Arrange
      const expectedError = new Error('Custom handler error');

      mockCallHandler.handle.mockReturnValue(throwError(() => expectedError));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: () => {
          done.fail('Should not emit next value when error occurs');
        },
        complete: () => {
          done.fail('Should not complete when error occurs');
        },
        error: error => {
          expect(error).toBe(expectedError);

          // When error occurs immediately, tap is not executed, so no metrics are recorded
          expect(metricsSpy.getMetricCount('http_requests_total')).toBe(0);
          expect(
            metricsSpy.getMetricCount('http_request_duration_seconds'),
          ).toBe(0);

          done();
        },
      });
    });

    it('should record metrics with response status when observable succeeds with different response codes', done => {
      // Arrange
      const testCases = [
        { statusCode: 200, shouldSucceed: true },
        { statusCode: 201, shouldSucceed: true },
        { statusCode: 204, shouldSucceed: true },
      ];

      let completedTests = 0;

      testCases.forEach(testCase => {
        // Create fresh context for each test case
        const currentRequest = {
          method: 'GET',
          path: `/status-${testCase.statusCode}`,
          route: { path: `/status-${testCase.statusCode}` },
        };
        const currentResponse = { statusCode: testCase.statusCode };

        const currentContext = {
          switchToHttp: jest.fn().mockReturnValue({
            getRequest: jest.fn().mockReturnValue(currentRequest),
            getResponse: jest.fn().mockReturnValue(currentResponse),
          }),
          getClass: jest.fn(),
          getHandler: jest.fn(),
          getArgs: jest.fn(),
          getArgByIndex: jest.fn(),
          switchToRpc: jest.fn(),
          switchToWs: jest.fn(),
          getType: jest.fn(),
        };

        const currentHandler = {
          handle: jest
            .fn()
            .mockReturnValue(of({ data: `success-${testCase.statusCode}` })),
        };

        // Act
        const result$ = interceptor.intercept(
          currentContext as any,
          currentHandler,
        );

        // Assert
        result$.subscribe({
          complete: () => {
            completedTests++;

            // Verify metrics recorded with correct status code
            expect(
              metricsSpy.hasRecordedHttpRequest(
                'GET',
                `/status-${testCase.statusCode}`,
                testCase.statusCode,
              ),
            ).toBe(true);

            if (completedTests === testCases.length) {
              done();
            }
          },
          error: done,
        });
      });
    });
  });

  describe('constructor', () => {
    it('should initialize with metrics service', () => {
      // Arrange & Act
      const newInterceptor = new MetricsInterceptor(metricsSpy);

      // Assert
      expect(newInterceptor).toBeDefined();
      expect(newInterceptor).toBeInstanceOf(MetricsInterceptor);
    });
  });
});
