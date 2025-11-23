import {
  BusinessEvent,
  Logger,
  PerformanceEvent,
  SecurityEvent,
} from '@data/protocols/logger';

interface LoggedMessage {
  level: 'info' | 'warn' | 'debug' | 'verbose';
  message: any;
  context?: string;
  timestamp: Date;
}

interface LoggedError {
  message: any;
  trace?: string;
  context?: string;
  timestamp: Date;
}

/**
 * Logger Stub for Data Layer Testing
 * Provides controllable implementations for testing business logic
 */
export class LoggerStub implements Logger {
  private shouldFail = false;
  private errorToThrow: Error | null = null;
  private loggedMessages: LoggedMessage[] = [];
  private loggedErrors: LoggedError[] = [];
  private loggedBusinessEvents: BusinessEvent[] = [];
  private loggedSecurityEvents: SecurityEvent[] = [];
  private loggedPerformanceEvents: PerformanceEvent[] = [];

  log(message: any, context?: string): void {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    this.loggedMessages.push({
      level: 'info',
      message,
      context,
      timestamp: new Date(),
    });
  }

  error(message: any, trace?: string, context?: string): void {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    this.loggedErrors.push({
      message,
      trace,
      context,
      timestamp: new Date(),
    });
  }

  warn(message: any, context?: string): void {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    this.loggedMessages.push({
      level: 'warn',
      message,
      context,
      timestamp: new Date(),
    });
  }

  debug(message: any, context?: string): void {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    this.loggedMessages.push({
      level: 'debug',
      message,
      context,
      timestamp: new Date(),
    });
  }

  verbose(message: any, context?: string): void {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    this.loggedMessages.push({
      level: 'verbose',
      message,
      context,
      timestamp: new Date(),
    });
  }

  logBusinessEvent(event: BusinessEvent): void {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    this.loggedBusinessEvents.push({
      ...event,
      timestamp: new Date(),
    } as BusinessEvent & { timestamp: Date });
  }

  logSecurityEvent(event: SecurityEvent): void {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    this.loggedSecurityEvents.push(event);
  }

  logPerformanceEvent(event: PerformanceEvent): void {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    this.loggedPerformanceEvents.push(event);
  }

  // =================== Test Utility Methods ===================

  /**
   * Clear all logged data and reset error state
   */
  clear(): void {
    this.shouldFail = false;
    this.errorToThrow = null;
    this.loggedMessages = [];
    this.loggedErrors = [];
    this.loggedBusinessEvents = [];
    this.loggedSecurityEvents = [];
    this.loggedPerformanceEvents = [];
  }

  /**
   * Configure the stub to throw an error on next operation
   */
  mockFailure(error: Error): void {
    this.shouldFail = true;
    this.errorToThrow = error;
  }

  /**
   * Configure the stub to operate normally
   */
  mockSuccess(): void {
    this.shouldFail = false;
    this.errorToThrow = null;
  }

  /**
   * Get all logged messages
   */
  getLoggedMessages(): LoggedMessage[] {
    return this.loggedMessages;
  }

  /**
   * Get all logged errors
   */
  getLoggedErrors(): LoggedError[] {
    return this.loggedErrors;
  }

  /**
   * Get all logged business events
   */
  getLoggedBusinessEvents(): BusinessEvent[] {
    return this.loggedBusinessEvents;
  }

  /**
   * Get all logged security events
   */
  getLoggedSecurityEvents(): SecurityEvent[] {
    return this.loggedSecurityEvents;
  }

  /**
   * Get all logged performance events
   */
  getLoggedPerformanceEvents(): PerformanceEvent[] {
    return this.loggedPerformanceEvents;
  }

  /**
   * Get messages by level
   */
  getMessagesByLevel(
    level: 'info' | 'warn' | 'debug' | 'verbose',
  ): LoggedMessage[] {
    return this.loggedMessages.filter(msg => msg.level === level);
  }

  /**
   * Get business events by event name
   */
  getBusinessEventsByEventName(eventName: string): BusinessEvent[] {
    return this.loggedBusinessEvents.filter(event => event.event === eventName);
  }

  /**
   * Get security events by severity
   */
  getSecurityEventsBySeverity(
    severity: 'low' | 'medium' | 'high' | 'critical',
  ): SecurityEvent[] {
    return this.loggedSecurityEvents.filter(
      event => event.severity === severity,
    );
  }

  /**
   * Get count of logged errors
   */
  getErrorsCount(): number {
    return this.loggedErrors.length;
  }

  /**
   * Get count of logged messages
   */
  getMessagesCount(): number {
    return this.loggedMessages.length;
  }

  /**
   * Check if a specific message was logged
   */
  hasLoggedMessage(message: string): boolean {
    return this.loggedMessages.some(msg =>
      String(msg.message).includes(message),
    );
  }

  /**
   * Check if a specific error was logged
   */
  hasLoggedError(message: string): boolean {
    return this.loggedErrors.some(err => String(err.message).includes(message));
  }

  /**
   * Check if a specific business event was logged
   */
  hasLoggedBusinessEvent(eventName: string): boolean {
    return this.loggedBusinessEvents.some(event => event.event === eventName);
  }

  /**
   * Simulate logging errors
   */
  mockLoggingError(): void {
    this.mockFailure(new Error('Logging failed'));
  }
}
