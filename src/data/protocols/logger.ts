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
  userId?: string;
  entityId?: string;
  traceId?: string;
  clientIp?: string;
  userAgent?: string;
  error?: string;
  [key: string]: any;
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
