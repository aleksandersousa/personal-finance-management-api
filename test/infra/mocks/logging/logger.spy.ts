/**
 * Logger Spy for Infrastructure Layer Testing
 * Observes and controls logging interactions
 */
export class LoggerSpy {
  public loggedEvents: LogEvent[] = [];
  public loggedBusinessEvents: BusinessEvent[] = [];
  public loggedSecurityEvents: SecurityEvent[] = [];
  public loggedErrors: ErrorEvent[] = [];

  log(message: string, ...args: any[]): void {
    this.loggedEvents.push({
      level: "log",
      message,
      args,
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

  warn(message: string): void {
    this.loggedEvents.push({
      level: "warn",
      message,
      timestamp: new Date(),
    });
  }

  debug(message: string): void {
    this.loggedEvents.push({
      level: "debug",
      message,
      timestamp: new Date(),
    });
  }

  info(message: string): void {
    this.loggedEvents.push({
      level: "info",
      message,
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
    this.loggedSecurityEvents.push({
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
   * Get business events by type
   */
  getBusinessEvents(eventType?: string): BusinessEvent[] {
    return eventType
      ? this.loggedBusinessEvents.filter((e) => e.event === eventType)
      : this.loggedBusinessEvents;
  }

  /**
   * Get security events by severity
   */
  getSecurityEvents(severity?: string): SecurityEvent[] {
    return severity
      ? this.loggedSecurityEvents.filter((e) => e.severity === severity)
      : this.loggedSecurityEvents;
  }

  /**
   * Get the number of errors logged
   */
  getErrorsCount(): number {
    return this.loggedErrors.length;
  }

  /**
   * Get the last business event
   */
  getLastBusinessEvent(): BusinessEvent | null {
    return (
      this.loggedBusinessEvents[this.loggedBusinessEvents.length - 1] || null
    );
  }

  /**
   * Check if a specific business event was logged
   */
  hasLoggedEvent(eventType: string): boolean {
    return this.loggedBusinessEvents.some((e) => e.event === eventType);
  }

  /**
   * Get all events by level
   */
  getEventsByLevel(level: string): LogEvent[] {
    return this.loggedEvents.filter((e) => e.level === level);
  }

  /**
   * Get the last logged error
   */
  getLastError(): ErrorEvent | null {
    return this.loggedErrors[this.loggedErrors.length - 1] || null;
  }

  /**
   * Check if any errors were logged
   */
  hasErrors(): boolean {
    return this.loggedErrors.length > 0;
  }

  /**
   * Get events within a time range
   */
  getEventsInRange(startTime: Date, endTime: Date): LogEvent[] {
    return this.loggedEvents.filter(
      (e) => e.timestamp >= startTime && e.timestamp <= endTime
    );
  }

  /**
   * Get business events for a specific user
   */
  getBusinessEventsForUser(userId: string): BusinessEvent[] {
    return this.loggedBusinessEvents.filter((e) => e.userId === userId);
  }
}

// Type definitions for spy events
interface LogEvent {
  level: string;
  message: string;
  args?: any[];
  timestamp: Date;
}

interface BusinessEvent {
  event: string;
  entityId?: string;
  userId?: string;
  traceId?: string;
  metadata?: any;
  timestamp?: Date;
}

interface SecurityEvent {
  event: string;
  severity: string;
  userId?: string;
  error?: string;
  traceId?: string;
  metadata?: any;
  timestamp?: Date;
}

interface ErrorEvent {
  message: string;
  stack?: string;
  timestamp: Date;
}
