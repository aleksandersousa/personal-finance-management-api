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
        type: "timer",
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
      type: "counter",
      timestamp: new Date(),
    });
  }

  recordGauge(name: string, value: number, labels: any = {}): void {
    this.recordedMetrics.push({
      name,
      value,
      labels,
      type: "gauge",
      timestamp: new Date(),
    });
  }

  recordHistogram(name: string, value: number, labels: any = {}): void {
    this.recordedMetrics.push({
      name,
      value,
      labels,
      type: "histogram",
      timestamp: new Date(),
    });
  }

  recordSummary(name: string, value: number, labels: any = {}): void {
    this.recordedMetrics.push({
      name,
      value,
      labels,
      type: "summary",
      timestamp: new Date(),
    });
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
  getMetrics(name?: string, type?: string): MetricRecord[] {
    let filtered = this.recordedMetrics;

    if (name) {
      filtered = filtered.filter((m) => m.name === name);
    }

    if (type) {
      filtered = filtered.filter((m) => m.type === type);
    }

    return filtered;
  }

  /**
   * Get timers by name
   */
  getTimers(name?: string): TimerRecord[] {
    return name
      ? this.startedTimers.filter((t) => t.name === name)
      : this.startedTimers;
  }

  /**
   * Get the count of metrics with a specific name
   */
  getMetricCount(name: string): number {
    return this.recordedMetrics.filter((m) => m.name === name).length;
  }

  /**
   * Check if a metric was recorded
   */
  hasRecordedMetric(name: string): boolean {
    return this.recordedMetrics.some((m) => m.name === name);
  }

  /**
   * Get the last recorded metric
   */
  getLastMetric(): MetricRecord | null {
    return this.recordedMetrics[this.recordedMetrics.length - 1] || null;
  }

  /**
   * Get the last started timer
   */
  getLastTimer(): TimerRecord | null {
    return this.startedTimers[this.startedTimers.length - 1] || null;
  }

  /**
   * Get metrics by labels
   */
  getMetricsByLabels(labels: any): MetricRecord[] {
    return this.recordedMetrics.filter((m) => {
      return Object.keys(labels).every(
        (key) => m.labels && m.labels[key] === labels[key]
      );
    });
  }

  /**
   * Get total count of all metrics
   */
  getTotalMetricsCount(): number {
    return this.recordedMetrics.length;
  }

  /**
   * Get total count of all timers
   */
  getTotalTimersCount(): number {
    return this.startedTimers.length;
  }

  /**
   * Get metrics within a time range
   */
  getMetricsInRange(startTime: Date, endTime: Date): MetricRecord[] {
    return this.recordedMetrics.filter(
      (m) => m.timestamp >= startTime && m.timestamp <= endTime
    );
  }

  /**
   * Get metrics by status label (for HTTP metrics)
   */
  getMetricsByStatus(status: string): MetricRecord[] {
    return this.recordedMetrics.filter(
      (m) => m.labels && m.labels.status === status
    );
  }

  /**
   * Get successful operation metrics
   */
  getSuccessMetrics(): MetricRecord[] {
    return this.getMetricsByStatus("success");
  }

  /**
   * Get error operation metrics
   */
  getErrorMetrics(): MetricRecord[] {
    return this.getMetricsByStatus("error");
  }
}

// Type definitions for spy metrics
interface MetricRecord {
  name: string;
  value?: number;
  labels?: any;
  type: "counter" | "gauge" | "histogram" | "summary" | "timer";
  timestamp: Date;
}

interface TimerRecord {
  name: string;
  timer: TimerFunction;
  startTime: Date;
}

type TimerFunction = jest.Mock<void, [any]>;
