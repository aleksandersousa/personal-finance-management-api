import {
  BusinessEvent,
  PerformanceEvent,
  SecurityEvent,
} from '@data/protocols/logger';

export class LoggerSpy {
  public loggedEvents: any[] = [];
  public loggedBusinessEvents: BusinessEvent[] = [];
  public loggedSecurityEvents: SecurityEvent[] = [];
  public loggedErrors: ErrorEvent[] = [];

  log(message: any, context?: string): void {
    this.loggedEvents.push({
      level: 'info',
      message,
      context,
      timestamp: new Date(),
    });
  }

  error(message: string, stack?: string): void {
    this.loggedErrors.push({
      message,
      stack,
      timestamp: new Date(),
    });
  }

  warn(message: any, context?: string): void {
    this.loggedEvents.push({
      level: 'warn',
      message,
      context,
      timestamp: new Date(),
    });
  }

  debug(message: any, context?: string): void {
    this.loggedEvents.push({
      level: 'debug',
      message,
      context,
      timestamp: new Date(),
    });
  }

  verbose(message: any, context?: string): void {
    this.loggedEvents.push({
      level: 'verbose',
      message,
      context,
      timestamp: new Date(),
    });
  }

  logBusinessEvent(event: BusinessEvent): void {
    this.loggedBusinessEvents.push({
      ...event,
      timestamp: new Date(),
    });
  }

  logSecurityEvent(event: SecurityEvent): void {
    this.loggedSecurityEvents.push(event);
  }

  logPerformanceEvent(event: PerformanceEvent): void {
    this.loggedEvents.push({
      level: 'info',
      type: 'performance_event',
      ...event,
      timestamp: new Date(),
    });
  }

  // =================== Test Utility Methods ===================

  /**
   * Clear all logged events
   */
  clear(): void {
    this.loggedEvents = [];
    this.loggedBusinessEvents = [];
    this.loggedSecurityEvents = [];
    this.loggedErrors = [];
  }

  /**
   * Get business events by event name
   */
  getBusinessEvents(eventName?: string): BusinessEvent[] {
    return eventName
      ? this.loggedBusinessEvents.filter(e => e.event === eventName)
      : this.loggedBusinessEvents;
  }

  /**
   * Get security events by severity
   */
  getSecurityEvents(severity?: string): SecurityEvent[] {
    return severity
      ? this.loggedSecurityEvents.filter(e => e.severity === severity)
      : this.loggedSecurityEvents;
  }

  /**
   * Get count of logged errors
   */
  getErrorsCount(): number {
    return this.loggedErrors.length;
  }

  /**
   * Check if a specific event was logged
   */
  hasLoggedEvent(eventName: string): boolean {
    return this.loggedBusinessEvents.some(e => e.event === eventName);
  }
}

// Type definitions
interface ErrorEvent {
  message: string;
  stack?: string;
  timestamp: Date;
}
