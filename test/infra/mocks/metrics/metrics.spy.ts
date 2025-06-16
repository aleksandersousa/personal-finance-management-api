/**
 * Metrics Spy for Infrastructure Layer Testing
 * Observes and controls metrics interactions
 */
export class MetricsSpy {
  public recordedMetrics: MetricRecord[] = [];
  public startedTimers: TimerRecord[] = [];

  startTimer(name: string): TimerFunction {
    const timerFn = jest.fn((labels: any) => {
      this.recordedMetrics.push({
        name,
        labels,
        type: 'timer',
        timestamp: new Date(),
      });
    });

    this.startedTimers.push({
      name,
      timer: timerFn,
      startTime: new Date(),
    });
    return timerFn;
  }

  incrementCounter(name: string, labels: any = {}): void {
    this.recordedMetrics.push({
      name,
      labels,
      type: 'counter',
      timestamp: new Date(),
    });
  }

  recordGauge(name: string, value: number, labels: any = {}): void {
    this.recordedMetrics.push({
      name,
      value,
      labels,
      type: 'gauge',
      timestamp: new Date(),
    });
  }

  recordHistogram(name: string, value: number, labels: any = {}): void {
    this.recordedMetrics.push({
      name,
      value,
      labels,
      type: 'histogram',
      timestamp: new Date(),
    });
  }

  // =================== FinancialMetricsService Compatible Methods ===================

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
  ): void {
    this.recordedMetrics.push({
      name: 'http_requests_total',
      labels: { method, route, status_code: statusCode.toString() },
      type: 'counter',
      timestamp: new Date(),
    });

    this.recordedMetrics.push({
      name: 'http_request_duration_seconds',
      value: duration / 1000,
      labels: { method, route },
      type: 'histogram',
      timestamp: new Date(),
    });
  }

  recordAuthEvent(eventType: string, status: string): void {
    this.recordedMetrics.push({
      name: 'auth_events_total',
      labels: { event_type: eventType, status },
      type: 'counter',
      timestamp: new Date(),
    });
  }

  recordTransaction(type: string, status: string): void {
    this.recordedMetrics.push({
      name: 'financial_transactions_total',
      labels: { type, status },
      type: 'counter',
      timestamp: new Date(),
    });
  }

  recordApiError(endpoint: string, errorType: string): void {
    this.recordedMetrics.push({
      name: 'api_errors_total',
      labels: { endpoint, error_type: errorType },
      type: 'counter',
      timestamp: new Date(),
    });
  }

  updateActiveUsers(period: string, count: number): void {
    this.recordedMetrics.push({
      name: 'financial_active_users',
      value: count,
      labels: { period },
      type: 'gauge',
      timestamp: new Date(),
    });
  }

  async getMetrics(): Promise<string> {
    // Mock implementation that returns a simple metrics string
    const metricsLines = this.recordedMetrics.map(metric => {
      const labels = metric.labels
        ? Object.entries(metric.labels)
            .map(([key, value]) => `${key}="${value}"`)
            .join(',')
        : '';
      const labelsStr = labels ? `{${labels}}` : '';
      const value = metric.value || 1;
      return `${metric.name}${labelsStr} ${value}`;
    });

    return `# Mock metrics\n${metricsLines.join('\n')}`;
  }

  // =================== Test Utility Methods ===================

  /**
   * Clear all recorded metrics and timers
   */
  clear(): void {
    this.recordedMetrics = [];
    this.startedTimers = [];
  }

  /**
   * Get metrics by name and/or type
   */
  getMetricsByFilter(name?: string, type?: string): MetricRecord[] {
    let filtered = this.recordedMetrics;

    if (name) {
      filtered = filtered.filter(m => m.name === name);
    }

    if (type) {
      filtered = filtered.filter(m => m.type === type);
    }

    return filtered;
  }

  /**
   * Get timers by name
   */
  getTimers(name?: string): TimerRecord[] {
    return name
      ? this.startedTimers.filter(t => t.name === name)
      : this.startedTimers;
  }

  /**
   * Get the count of metrics with a specific name
   */
  getMetricCount(name: string): number {
    return this.recordedMetrics.filter(m => m.name === name).length;
  }

  /**
   * Check if a metric was recorded
   */
  hasRecordedMetric(name: string): boolean {
    return this.recordedMetrics.some(m => m.name === name);
  }

  /**
   * Check if HTTP request was recorded
   */
  hasRecordedHttpRequest(
    method: string,
    route: string,
    statusCode?: number,
  ): boolean {
    return this.recordedMetrics.some(
      m =>
        m.name === 'http_requests_total' &&
        m.labels?.method === method &&
        m.labels?.route === route &&
        (statusCode === undefined ||
          m.labels?.status_code === statusCode.toString()),
    );
  }

  /**
   * Check if API error was recorded
   */
  hasRecordedApiError(endpoint: string, errorType?: string): boolean {
    return this.recordedMetrics.some(
      m =>
        m.name === 'api_errors_total' &&
        m.labels?.endpoint === endpoint &&
        (errorType === undefined || m.labels?.error_type === errorType),
    );
  }

  /**
   * Get error operation metrics
   */
  getErrorMetrics(): MetricRecord[] {
    return this.recordedMetrics.filter(
      m => m.labels && m.labels.status === 'error',
    );
  }
}

// Type definitions for spy metrics
interface MetricRecord {
  name: string;
  value?: number;
  labels?: any;
  type: 'counter' | 'gauge' | 'histogram' | 'summary' | 'timer';
  timestamp: Date;
}

interface TimerRecord {
  name: string;
  timer: TimerFunction;
  startTime: Date;
}

type TimerFunction = jest.Mock<void, [any]>;
