import { Test, TestingModule } from '@nestjs/testing';
import { FinancialMetricsService } from '../../../src/infra/metrics/financial-metrics.service';
import { Counter, Gauge, Histogram, register } from 'prom-client';

// Mock prom-client
jest.mock('prom-client', () => ({
  register: {
    clear: jest.fn(),
    registerMetric: jest.fn(),
    metrics: jest.fn(() => '# Mock metrics'),
  },
  Counter: jest.fn().mockImplementation(() => ({
    inc: jest.fn(),
  })),
  Histogram: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
  })),
  Gauge: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
  })),
}));

describe('FinancialMetricsService', () => {
  let service: FinancialMetricsService;
  let mockCounter: any;
  let mockHistogram: any;
  let mockGauge: any;

  beforeEach(async () => {
    mockCounter = {
      inc: jest.fn(),
    };
    mockHistogram = {
      observe: jest.fn(),
    };
    mockGauge = {
      set: jest.fn(),
    };

    (Counter as jest.Mock).mockReturnValue(mockCounter);
    (Histogram as jest.Mock).mockReturnValue(mockHistogram);
    (Gauge as jest.Mock).mockReturnValue(mockGauge);

    const module: TestingModule = await Test.createTestingModule({
      providers: [FinancialMetricsService],
    }).compile();

    service = module.get<FinancialMetricsService>(FinancialMetricsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should clear existing metrics registry', () => {
      expect(register.clear).toHaveBeenCalled();
    });

    it('should create HTTP metrics', () => {
      expect(Counter).toHaveBeenCalledWith({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status_code'],
      });

      expect(Histogram).toHaveBeenCalledWith({
        name: 'http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route'],
        buckets: [0.1, 0.5, 1, 2, 5],
      });
    });

    it('should create authentication metrics', () => {
      expect(Counter).toHaveBeenCalledWith({
        name: 'auth_events_total',
        help: 'Total number of authentication events',
        labelNames: ['event_type', 'status'],
      });
    });

    it('should create financial metrics', () => {
      expect(Counter).toHaveBeenCalledWith({
        name: 'financial_transactions_total',
        help: 'Total number of financial transactions',
        labelNames: ['type', 'status'],
      });
    });

    it('should create error metrics', () => {
      expect(Counter).toHaveBeenCalledWith({
        name: 'api_errors_total',
        help: 'Total number of API errors',
        labelNames: ['endpoint', 'error_type'],
      });
    });

    it('should create active users gauge', () => {
      expect(Gauge).toHaveBeenCalledWith({
        name: 'financial_active_users',
        help: 'Number of active users',
        labelNames: ['period'],
      });
    });

    it('should register all metrics', () => {
      expect(register.registerMetric).toHaveBeenCalledTimes(6);
    });
  });

  describe('recordHttpRequest', () => {
    it('should record HTTP request metrics', () => {
      const method = 'GET';
      const route = '/api/entries';
      const statusCode = 200;
      const duration = 1500; // milliseconds

      service.recordHttpRequest(method, route, statusCode, duration);

      expect(mockCounter.inc).toHaveBeenCalledWith({
        method,
        route,
        status_code: '200',
      });

      expect(mockHistogram.observe).toHaveBeenCalledWith(
        { method, route },
        1.5, // converted to seconds
      );
    });

    it('should handle different HTTP methods and status codes', () => {
      service.recordHttpRequest('POST', '/api/auth/login', 401, 500);

      expect(mockCounter.inc).toHaveBeenCalledWith({
        method: 'POST',
        route: '/api/auth/login',
        status_code: '401',
      });

      expect(mockHistogram.observe).toHaveBeenCalledWith(
        { method: 'POST', route: '/api/auth/login' },
        0.5,
      );
    });
  });

  describe('recordAuthEvent', () => {
    it('should record authentication events', () => {
      const eventType = 'login';
      const status = 'success';

      service.recordAuthEvent(eventType, status);

      expect(mockCounter.inc).toHaveBeenCalledWith({
        event_type: eventType,
        status,
      });
    });

    it('should handle different auth event types', () => {
      service.recordAuthEvent('register', 'failed');

      expect(mockCounter.inc).toHaveBeenCalledWith({
        event_type: 'register',
        status: 'failed',
      });
    });
  });

  describe('recordTransaction', () => {
    it('should record financial transactions', () => {
      const type = 'INCOME';
      const status = 'success';

      service.recordTransaction(type, status);

      expect(mockCounter.inc).toHaveBeenCalledWith({
        type,
        status,
      });
    });

    it('should handle expense transactions', () => {
      service.recordTransaction('EXPENSE', 'failed');

      expect(mockCounter.inc).toHaveBeenCalledWith({
        type: 'EXPENSE',
        status: 'failed',
      });
    });
  });

  describe('recordApiError', () => {
    it('should record API errors', () => {
      const endpoint = '/api/entries';
      const errorType = 'ValidationError';

      service.recordApiError(endpoint, errorType);

      expect(mockCounter.inc).toHaveBeenCalledWith({
        endpoint,
        error_type: errorType,
      });
    });

    it('should handle different error types', () => {
      service.recordApiError('/api/auth/login', 'UnauthorizedError');

      expect(mockCounter.inc).toHaveBeenCalledWith({
        endpoint: '/api/auth/login',
        error_type: 'UnauthorizedError',
      });
    });
  });

  describe('updateActiveUsers', () => {
    it('should update active users gauge', () => {
      const period = 'current';
      const count = 42;

      service.updateActiveUsers(period, count);

      expect(mockGauge.set).toHaveBeenCalledWith({ period }, count);
    });

    it('should handle different periods', () => {
      service.updateActiveUsers('daily', 150);

      expect(mockGauge.set).toHaveBeenCalledWith({ period: 'daily' }, 150);
    });
  });

  describe('getMetrics', () => {
    it('should return metrics from registry', async () => {
      const mockMetrics = '# Mock metrics data';
      (register.metrics as jest.Mock).mockReturnValue(mockMetrics);

      const result = await service.getMetrics();

      expect(result).toBe(mockMetrics);
      expect(register.metrics).toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete HTTP request lifecycle', () => {
      // Simulate a successful API request
      service.recordHttpRequest('POST', '/api/entries', 201, 800);
      service.recordTransaction('INCOME', 'success');

      expect(mockCounter.inc).toHaveBeenCalledWith({
        method: 'POST',
        route: '/api/entries',
        status_code: '201',
      });

      expect(mockCounter.inc).toHaveBeenCalledWith({
        type: 'INCOME',
        status: 'success',
      });
    });

    it('should handle authentication flow', () => {
      // Simulate login attempt and success
      service.recordAuthEvent('login', 'attempt');
      service.recordHttpRequest('POST', '/api/auth/login', 200, 300);
      service.recordAuthEvent('login', 'success');

      expect(mockCounter.inc).toHaveBeenCalledTimes(3); // 2 auth events + 1 HTTP request
    });

    it('should handle error scenarios', () => {
      // Simulate failed request
      service.recordHttpRequest('POST', '/api/entries', 400, 200);
      service.recordApiError('/api/entries', 'BadRequestException');
      service.recordTransaction('INCOME', 'failed');

      expect(mockCounter.inc).toHaveBeenCalledWith({
        method: 'POST',
        route: '/api/entries',
        status_code: '400',
      });

      expect(mockCounter.inc).toHaveBeenCalledWith({
        endpoint: '/api/entries',
        error_type: 'BadRequestException',
      });

      expect(mockCounter.inc).toHaveBeenCalledWith({
        type: 'INCOME',
        status: 'failed',
      });
    });
  });
});
