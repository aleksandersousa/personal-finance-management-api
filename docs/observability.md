## Observability Stack Overview

- **Metrics**: Prometheus scraping the API `/metrics` endpoint (powered by `FinancialMetricsService`).
- **Logs**: Loki storing JSON logs shipped by Promtail from `logs/*.log`.
- **Traces**: Tempo receiving OpenTelemetry traces from the NestJS API.
- **Dashboards**: Grafana visualizing metrics, logs, and traces.

### Core Dashboards (to create in Grafana)

- **API Overview**
  - Panels:
    - `rate(http_requests_total[5m])` by `route` and `status_code`.
    - `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))` per `route`.
    - `sum(rate(api_errors_total[5m]))` by `endpoint` and `error_type`.
- **Database Overview**
  - Panels:
    - `rate(db_queries_total[5m])` by `operation` and `table`.
    - `histogram_quantile(0.95, rate(db_query_duration_seconds_bucket[5m]))` by `operation`.
- **Business Metrics**
  - Panels:
    - Financial transaction counters from `financial_transactions_total`.
    - Active users from `financial_active_users`.
- **Logs & Traces**
  - Loki datasource:
    - Explore logs with labels: `app="pfm-api"`, `service="api"`, `env="prod"`.
  - Tempo datasource:
    - Trace view filtered by service `pfm-api` and operation `GET /entries`.

### Example SLOs and Alerts

- **Availability SLO**
  - "99% of `GET /entries` requests return non-5xx over 30 days."
  - PromQL: `1 - (sum(rate(http_requests_total{route="/entries",status_code=~"5.."}[30d])) / sum(rate(http_requests_total{route="/entries"}[30d])))`.
- **Latency SLO**
  - "p95 latency for `GET /entries` < 500ms over 5m."
  - PromQL in panel/alert: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{route="/entries"}[5m]))`.
- **Error Budget Alerts**
  - Trigger if availability SLO drops below 99% in the last 1h.
  - Trigger if p95 latency exceeds 500ms for 10m.

Configure these alerts either in **Prometheus Alertmanager** or **Grafana Alerting**, depending on preference.

### Security and Hardening Notes

- **Restrict Network Access**
  - Expose Prometheus (`9090`), Grafana (`3002`), Loki (`3100`), and Tempo (`3200`) only on private networks or behind a reverse proxy.
  - Use firewall rules (UFW/iptables/cloud security groups) to allow access only from trusted IPs or VPN.
- **Grafana Authentication**
  - Override `GRAFANA_ADMIN_USER` and `GRAFANA_ADMIN_PASSWORD` in `.env` and `.docker/docker-compose.yml`.
  - Optionally enable OAuth or another auth provider in Grafana for team access.
- **Retention and Resource Limits**
  - Loki retention is currently 7 days in `config.yml`; tune `retention_period` based on disk.
  - Tempo retention is currently 24h; adjust `block_retention` as needed.
  - Run all observability services with conservative resource limits in Docker if necessary.

