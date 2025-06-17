import { LoggerProtocol, SecurityEvent } from '@data/protocols/logger';

export class LoggerProtocolMock implements LoggerProtocol {
  public loggedErrors: Array<{
    message: string;
    stack?: string;
    context?: string;
  }> = [];

  public loggedSecurityEvents: SecurityEvent[] = [];

  error(message: string, stack?: string, context?: string): void {
    this.loggedErrors.push({ message, stack, context });
  }

  logSecurityEvent(event: SecurityEvent): void {
    this.loggedSecurityEvents.push(event);
  }

  // Test utility methods
  clear(): void {
    this.loggedErrors = [];
    this.loggedSecurityEvents = [];
  }

  getLastError(): { message: string; stack?: string; context?: string } | null {
    return this.loggedErrors[this.loggedErrors.length - 1] || null;
  }

  getLastSecurityEvent(): SecurityEvent | null {
    return (
      this.loggedSecurityEvents[this.loggedSecurityEvents.length - 1] || null
    );
  }

  getSecurityEventsByType(eventType: string): SecurityEvent[] {
    return this.loggedSecurityEvents.filter(event => event.event === eventType);
  }

  getSecurityEventsBySeverity(severity: string): SecurityEvent[] {
    return this.loggedSecurityEvents.filter(
      event => event.severity === severity,
    );
  }

  hasLoggedError(message: string): boolean {
    return this.loggedErrors.some(error => error.message.includes(message));
  }

  hasLoggedSecurityEvent(eventType: string): boolean {
    return this.loggedSecurityEvents.some(event => event.event === eventType);
  }

  getErrorsCount(): number {
    return this.loggedErrors.length;
  }

  getSecurityEventsCount(): number {
    return this.loggedSecurityEvents.length;
  }
}

export class LoggerProtocolMockFactory {
  static create(): LoggerProtocolMock {
    return new LoggerProtocolMock();
  }

  static createWithPrefilledEvents(): LoggerProtocolMock {
    const mock = new LoggerProtocolMock();
    mock.logSecurityEvent({
      event: 'test_event',
      severity: 'medium',
      message: 'Test security event',
    });
    return mock;
  }
}
