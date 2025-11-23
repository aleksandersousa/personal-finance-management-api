import { Test, TestingModule } from '@nestjs/testing';
import { ContextAwareLoggerService } from '../../../src/infra/logging/context-aware-logger.service';
import * as winston from 'winston';

// Mock winston
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  })),
  format: {
    combine: jest.fn(() => 'combined-format'),
    timestamp: jest.fn(() => 'timestamp'),
    errors: jest.fn(() => 'errors'),
    json: jest.fn(() => 'json'),
    colorize: jest.fn(() => 'colorize'),
    simple: jest.fn(() => 'simple'),
  },
  transports: {
    Console: jest.fn(() => ({ type: 'console' })),
    File: jest.fn(() => ({ type: 'file' })),
  },
}));

describe('ContextAwareLoggerService', () => {
  let service: ContextAwareLoggerService;
  let mockLogger: any;

  beforeEach(async () => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    // Reset the mock to return our mockLogger
    (winston.createLogger as jest.Mock).mockReturnValue(mockLogger);

    const module: TestingModule = await Test.createTestingModule({
      providers: [ContextAwareLoggerService],
    }).compile();

    service = module.get<ContextAwareLoggerService>(ContextAwareLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should call winston logger info method', () => {
      const message = 'Test message';
      const context = 'TestContext';

      service.log(message, context);

      expect(mockLogger.info).toHaveBeenCalledWith(message, { context });
    });

    it('should handle object messages', () => {
      const message = { event: 'test', data: 'value' };

      service.log(message);

      expect(mockLogger.info).toHaveBeenCalledWith(message, {
        context: undefined,
      });
    });
  });

  describe('error', () => {
    it('should call winston logger error method', () => {
      const message = 'Error message';
      const trace = 'Error trace';
      const context = 'ErrorContext';

      service.error(message, trace, context);

      expect(mockLogger.error).toHaveBeenCalledWith(message, {
        trace,
        context,
      });
    });
  });

  describe('warn', () => {
    it('should call winston logger warn method', () => {
      const message = 'Warning message';
      const context = 'WarnContext';

      service.warn(message, context);

      expect(mockLogger.warn).toHaveBeenCalledWith(message, { context });
    });
  });

  describe('debug', () => {
    it('should call winston logger debug method', () => {
      const message = 'Debug message';
      const context = 'DebugContext';

      service.debug(message, context);

      expect(mockLogger.debug).toHaveBeenCalledWith(message, { context });
    });
  });

  describe('verbose', () => {
    it('should call winston logger verbose method', () => {
      const message = 'Verbose message';
      const context = 'VerboseContext';

      service.verbose(message, context);

      expect(mockLogger.verbose).toHaveBeenCalledWith(message, { context });
    });
  });

  describe('logBusinessEvent', () => {
    it('should log business event with proper structure', () => {
      const event = {
        event: 'user_login',
        userId: '123',
        traceId: 'trace-123',
        duration: 150,
      };

      service.logBusinessEvent(event);

      expect(mockLogger.info).toHaveBeenCalledWith({
        type: 'business_event',
        timestamp: expect.any(String),
        ...event,
      });
    });

    it('should handle minimal business event', () => {
      const event = {
        event: 'simple_event',
      };

      service.logBusinessEvent(event);

      expect(mockLogger.info).toHaveBeenCalledWith({
        type: 'business_event',
        timestamp: expect.any(String),
        ...event,
      });
    });
  });

  describe('logSecurityEvent', () => {
    it('should log security event with proper structure', () => {
      const event = {
        event: 'failed_login',
        severity: 'medium' as const,
        message: 'Login attempt failed',
        traceId: 'trace-123',
        clientIp: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      service.logSecurityEvent(event);

      expect(mockLogger.warn).toHaveBeenCalledWith({
        type: 'security_event',
        timestamp: expect.any(String),
        ...event,
      });
    });

    it('should handle critical security event', () => {
      const event = {
        event: 'unauthorized_access',
        severity: 'critical' as const,
        message: 'Unauthorized access attempt detected',
      };

      service.logSecurityEvent(event);

      expect(mockLogger.warn).toHaveBeenCalledWith({
        type: 'security_event',
        timestamp: expect.any(String),
        ...event,
      });
    });
  });

  describe('logPerformanceEvent', () => {
    it('should log performance event with proper structure', () => {
      const event = {
        event: 'slow_query',
        duration: 2500,
        endpoint: '/api/entries',
        traceId: 'trace-123',
      };

      service.logPerformanceEvent(event);

      expect(mockLogger.info).toHaveBeenCalledWith({
        type: 'performance_event',
        timestamp: expect.any(String),
        ...event,
      });
    });

    it('should handle minimal performance event', () => {
      const event = {
        event: 'request_processed',
        duration: 100,
      };

      service.logPerformanceEvent(event);

      expect(mockLogger.info).toHaveBeenCalledWith({
        type: 'performance_event',
        timestamp: expect.any(String),
        ...event,
      });
    });
  });

  describe('winston initialization', () => {
    it('should create winston logger during service initialization', () => {
      expect(winston.createLogger).toHaveBeenCalled();
    });

    it('should call winston format methods', () => {
      expect(winston.format.combine).toHaveBeenCalled();
    });
  });
});
