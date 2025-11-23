export interface BusinessEvent {
  event: string;
  userId?: string;
  entityId?: string;
  traceId?: string;
  spanId?: string;
  duration?: number;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface SecurityEvent {
  event: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  statusCode?: number;
  message: string;
  endpoint?: string;
  userAgent?: string;
  clientIp?: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  entityId?: string;
  error?: string;
  details?: {
    exceptionType?: string;
    stack?: string;
    [key: string]: any;
  };
}

export interface PerformanceEvent {
  event: string;
  duration: number;
  endpoint?: string;
  traceId?: string;
  [key: string]: any;
}

export interface Logger {
  log(message: any, context?: string): void;
  error(message: any, trace?: string, context?: string): void;
  warn(message: any, context?: string): void;
  debug(message: any, context?: string): void;
  verbose?(message: any, context?: string): void;
  logBusinessEvent(event: BusinessEvent): void;
  logSecurityEvent(event: SecurityEvent): void;
  logPerformanceEvent?(event: PerformanceEvent): void;
}

export interface LoggerProtocol {
  error(message: string, stack?: string, context?: string): void;
  logSecurityEvent(event: SecurityEvent): void;
}
