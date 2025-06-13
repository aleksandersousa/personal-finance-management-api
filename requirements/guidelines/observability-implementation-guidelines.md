# 🔍 Observability Implementation Guidelines

## Overview

Este documento fornece guidelines genéricas para implementação de observabilidade completa em qualquer projeto de API usando NestJS/Node.js com Docker.

## 📊 Architecture Pattern

### Core Components

1. **Metrics Service** - Coleta e exposição de métricas Prometheus
2. **Context-Aware Logger** - Logging estruturado com correlação
3. **Health Check Controller** - Monitoramento de saúde da aplicação
4. **Metrics Interceptor** - Coleta automática de métricas HTTP
5. **Trace Context Middleware** - Rastreamento distribuído

### Technology Stack

- **Metrics**: Prometheus + prom-client
- **Logging**: Winston with structured JSON output
- **Visualization**: Grafana
- **Storage**: Prometheus TSDB
- **Health Checks**: Custom implementation

## 🏗️ Implementation Structure

### Directory Structure

```
src/
├── infra/
│   ├── logging/
│   │   └── context-aware-logger.service.ts
│   ├── metrics/
│   │   └── metrics.service.ts
│   └── middleware/
│       └── trace-context.middleware.ts
├── presentation/
│   ├── controllers/
│   │   ├── health.controller.ts
│   │   └── metrics.controller.ts
│   └── interceptors/
│       └── metrics.interceptor.ts
└── main/
    └── modules/
        └── observability.module.ts
```

### Docker Configuration Structure

```
observability/
├── prometheus.yml                    # Development config
├── prometheus.prod.yml              # Production config
└── grafana/
    ├── provisioning/
    │   ├── datasources/
    │   │   └── datasources.yml
    │   └── dashboards/
    │       └── dashboards.yml
    └── dashboards/
        └── api-overview.json
```

## 🔧 Implementation Guidelines

### 1. Metrics Service Implementation

**Must Have Metrics:**

- `http_requests_total` - Counter for HTTP requests
- `http_request_duration_seconds` - Histogram for request duration
- `api_errors_total` - Counter for API errors
- Application-specific business metrics

**Implementation Pattern:**

```typescript
@Injectable()
export class MetricsService {
  private readonly httpRequestsTotal: Counter<string>;
  private readonly httpRequestDuration: Histogram<string>;

  constructor() {
    register.clear(); // Avoid conflicts
    // Initialize metrics with proper labels
  }

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number
  ) {
    // Record metrics with consistent labeling
  }
}
```

### 2. Structured Logging Guidelines

**Log Levels by Environment:**

- Development: `info`
- Staging: `info`
- Production: `warn`

**Required Log Types:**

- Business Events
- Security Events
- Performance Events
- Error Events

**Log Structure:**

```typescript
interface BusinessEvent {
  event: string;
  userId?: string;
  traceId?: string;
  spanId?: string;
  duration?: number;
  [key: string]: any;
}
```

### 3. Health Check Implementation

**Required Checks:**

- Application status
- Database connectivity
- External services status
- Memory usage
- Uptime

**Response Format:**

```json
{
  "status": "ok|degraded|error",
  "uptime": 3600,
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": { "status": "connected", "responseTime": 15 }
  }
}
```

### 4. Environment-Specific Configurations

#### Development

- Retention: 7 days
- Scrape interval: 15s
- Log level: info
- Console logs: enabled
- Debug metrics: enabled

#### Production

- Retention: 30+ days
- Scrape interval: 30-60s
- Log level: warn
- Console logs: disabled
- Metrics filtering: enabled
- Security hardening: enabled

## 📈 Docker Integration Patterns

### Development Override Pattern

```yaml
# docker-compose.override.yml
services:
  api:
    environment:
      - METRICS_ENABLED=true
      - LOG_LEVEL=info
    networks:
      - observability-network

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./observability/prometheus.yml:/etc/prometheus/prometheus.yml:ro
```

### Production Compose Pattern

```yaml
# docker-compose.prod.observability.yml
services:
  prometheus:
    restart: always
    command:
      - "--storage.tsdb.retention.time=30d"
      - "--log.level=warn"
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:9090/-/healthy"]
```

## 🎯 NPM Scripts Pattern

### Required Scripts Structure

```json
{
  "obs:dev": "docker-compose up -d",
  "obs:dev:down": "docker-compose down",
  "obs:dev:logs": "docker-compose logs -f",
  "obs:dev:status": "docker-compose ps",
  "obs:prod": "docker-compose -f docker-compose.yml -f docker-compose.prod.observability.yml up -d",
  "obs:setup": "mkdir -p logs && npm run obs:dev",
  "obs:test": "curl -f http://localhost:3000/api/v1/health",
  "obs:help": "echo 'Observability commands help...'"
}
```

## 🔒 Security Guidelines

### Production Security

- Change default Grafana passwords
- Use environment variables for sensitive configs
- Enable HTTPS for Grafana
- Restrict Prometheus access
- Filter sensitive data from logs
- Implement proper RBAC

### Log Security

- Never log passwords or tokens
- Remove sensitive headers
- Use trace IDs instead of user IDs when possible
- Implement log retention policies

## 📊 Metrics Guidelines

### Business Metrics Pattern

- Use domain-specific metrics names
- Consistent labeling strategy
- Proper metric types (Counter, Gauge, Histogram)
- Cardinality control

### HTTP Metrics Standard

```typescript
// Standard labels for HTTP metrics
{
  method: string,    // GET, POST, PUT
  route: string,     // /api/v1/users/:id
  status_code: string // 200, 404, 500
}
```

## 🎨 Dashboard Guidelines

### Essential Dashboards

1. **API Overview**: Request rate, response time, error rate
2. **Business Metrics**: Domain-specific KPIs
3. **Infrastructure**: CPU, memory, disk usage
4. **Alerts Overview**: Current alerts and incidents

### Dashboard Best Practices

- Use template variables for environment filtering
- Implement proper time ranges
- Add documentation panels
- Use consistent color schemes
- Implement drill-down capabilities

## 📋 Implementation Checklist

### Phase 1: Basic Setup

- [ ] Metrics service implementation
- [ ] Logger service with structured output
- [ ] Health check endpoint
- [ ] Basic Docker configuration

### Phase 2: Advanced Features

- [ ] Trace correlation middleware
- [ ] Metrics interceptor
- [ ] Environment-specific configs
- [ ] Grafana dashboards

### Phase 3: Production Ready

- [ ] Security hardening
- [ ] Alerting rules
- [ ] Backup strategies
- [ ] Documentation
- [ ] NPM scripts automation

### Phase 4: Monitoring & Maintenance

- [ ] Regular metrics review
- [ ] Dashboard optimization
- [ ] Alert tuning
- [ ] Performance monitoring

## 🚀 Quick Start Template

### 1. Install Dependencies

```bash
npm install prom-client winston @nestjs/swagger
```

### 2. Create Basic Structure

```bash
mkdir -p src/infra/{logging,metrics} src/presentation/{controllers,interceptors}
mkdir -p observability/grafana/{provisioning,dashboards}
```

### 3. Implement Core Services

- Copy template files from this implementation
- Adapt business metrics to your domain
- Configure environment variables

### 4. Setup Docker

```bash
# Add observability services to docker-compose
docker-compose up -d
```

### 5. Verify Setup

```bash
curl http://localhost:3000/api/v1/health
curl http://localhost:3000/api/v1/metrics
```

## 🎓 Advanced Patterns

### Custom Metrics Patterns

```typescript
// Business-specific metrics
this.userRegistrations.inc({ source: "web" });
this.orderValue.observe({ region: "US" }, 99.99);
this.activeConnections.set(150);
```

### Error Correlation Pattern

```typescript
this.logger.error("Payment failed", {
  traceId: req.traceId,
  userId: req.user.id,
  orderId: order.id,
  error: error.message,
});

this.metrics.recordError("payment", error.type);
```

### Performance Monitoring Pattern

```typescript
const timer = this.metrics.startTimer();
try {
  const result = await this.expensiveOperation();
  timer({ status: "success" });
  return result;
} catch (error) {
  timer({ status: "error" });
  throw error;
}
```

## 🔄 Maintenance Guidelines

### Regular Tasks

- Weekly: Review dashboard accuracy
- Monthly: Analyze metrics trends
- Quarterly: Update retention policies
- Annually: Security audit

### Troubleshooting Steps

1. Check service health endpoints
2. Verify metrics collection
3. Review log correlation
4. Validate dashboard queries
5. Test alerting rules

This implementation provides a solid foundation for observability in any NestJS/Node.js API project, with patterns that scale from development to production environments.
