import { Injectable } from "@nestjs/common";
import { register, Counter, Histogram, Gauge } from "prom-client";

@Injectable()
export class FinancialMetricsService {
  private readonly httpRequestsTotal: Counter<string>;
  private readonly httpRequestDuration: Histogram<string>;
  private readonly authEventsTotal: Counter<string>;
  private readonly financialTransactionsTotal: Counter<string>;
  private readonly apiErrorsTotal: Counter<string>;
  private readonly activeUsersGauge: Gauge<string>;

  constructor() {
    // Clear existing metrics to avoid conflicts
    register.clear();

    // HTTP Metrics
    this.httpRequestsTotal = new Counter({
      name: "http_requests_total",
      help: "Total number of HTTP requests",
      labelNames: ["method", "route", "status_code"],
    });

    this.httpRequestDuration = new Histogram({
      name: "http_request_duration_seconds",
      help: "Duration of HTTP requests in seconds",
      labelNames: ["method", "route"],
      buckets: [0.1, 0.5, 1, 2, 5],
    });

    // Authentication Metrics
    this.authEventsTotal = new Counter({
      name: "auth_events_total",
      help: "Total number of authentication events",
      labelNames: ["event_type", "status"],
    });

    // Financial Metrics
    this.financialTransactionsTotal = new Counter({
      name: "financial_transactions_total",
      help: "Total number of financial transactions",
      labelNames: ["type", "status"],
    });

    // Error Metrics
    this.apiErrorsTotal = new Counter({
      name: "api_errors_total",
      help: "Total number of API errors",
      labelNames: ["endpoint", "error_type"],
    });

    // Active Users
    this.activeUsersGauge = new Gauge({
      name: "financial_active_users",
      help: "Number of active users",
      labelNames: ["period"],
    });

    // Register all metrics
    register.registerMetric(this.httpRequestsTotal);
    register.registerMetric(this.httpRequestDuration);
    register.registerMetric(this.authEventsTotal);
    register.registerMetric(this.financialTransactionsTotal);
    register.registerMetric(this.apiErrorsTotal);
    register.registerMetric(this.activeUsersGauge);
  }

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number
  ) {
    this.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode.toString(),
    });
    this.httpRequestDuration.observe({ method, route }, duration / 1000);
  }

  recordAuthEvent(eventType: string, status: string) {
    this.authEventsTotal.inc({ event_type: eventType, status });
  }

  recordTransaction(type: string, status: string) {
    this.financialTransactionsTotal.inc({ type, status });
  }

  recordApiError(endpoint: string, errorType: string) {
    this.apiErrorsTotal.inc({ endpoint, error_type: errorType });
  }

  updateActiveUsers(period: string, count: number) {
    this.activeUsersGauge.set({ period }, count);
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }
}
