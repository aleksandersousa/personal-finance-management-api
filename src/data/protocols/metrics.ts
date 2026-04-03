export interface Metrics {
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
  ): void;
  recordAuthEvent(eventType: string, status: string): void;
  recordTransaction(type: string, status: string): void;
  recordApiError(endpoint: string, errorType: string): void;
  recordDbQuery(
    operation: string,
    table: string,
    status: 'success' | 'error',
    duration: number,
  ): void;
  updateActiveUsers(period: string, count: number): void;
  getMetrics(): Promise<string>;
}
