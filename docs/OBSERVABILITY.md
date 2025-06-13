# 🔍 Observability & Monitoring Guide

Este documento detalha a infraestrutura de observabilidade implementada na API de Gestão Financeira, seguindo as melhores práticas estabelecidas no documento `observability-requirements.md`.

## 🌟 Visão Geral

A API possui uma infraestrutura completa de observabilidade que inclui:

- **Logging estruturado** com correlação de traces
- **Métricas Prometheus** para monitoramento de performance
- **Health checks** abrangentes
- **Tracing distribuído** para rastreamento de requisições
- **Alertas inteligentes** baseados em regras de negócio

## 📊 Arquitetura de Observabilidade

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Application   │───▶│  Metrics Service │───▶│   Prometheus    │
│    Requests     │    │                  │    │   (Optional)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Context Logger  │    │ Trace Middleware │    │     Grafana     │
│   (Winston)     │    │                  │    │   (Optional)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│   Log Files     │    │  Trace Headers   │
│ logs/error.log  │    │   x-trace-id     │
│ logs/combined.log│    │   x-span-id      │
└─────────────────┘    └──────────────────┘
```

## 🚀 Funcionalidades Implementadas

### 1. Logging Estruturado

**Serviço:** `ContextAwareLoggerService`
**Localização:** `src/infra/logging/context-aware-logger.service.ts`

#### Características:

- Logs em formato JSON estruturado
- Correlação automática com trace ID
- Diferentes níveis de log (info, warn, error, debug)
- Logs específicos para eventos de negócio e segurança
- Rotação automática de arquivos

#### Tipos de Eventos:

```typescript
// Eventos de Negócio
logger.logBusinessEvent({
  event: "entry_create_success",
  userId: "uuid",
  amount: 1500.0,
  type: "INCOME",
  traceId: "trace-123",
  duration: 145,
});

// Eventos de Segurança
logger.logSecurityEvent({
  event: "failed_login_attempt",
  severity: "medium",
  email: "user@example.com",
  clientIp: "192.168.1.1",
  traceId: "trace-123",
});

// Eventos de Performance
logger.logPerformanceEvent({
  event: "slow_query_detected",
  duration: 2500,
  endpoint: "/entries/list",
  traceId: "trace-123",
});
```

### 2. Métricas Prometheus

**Serviço:** `FinancialMetricsService`
**Localização:** `src/infra/metrics/financial-metrics.service.ts`
**Endpoint:** `GET /api/v1/metrics`

#### Métricas Disponíveis:

##### HTTP e Aplicação:

- `http_requests_total` - Total de requisições HTTP
- `http_request_duration_seconds` - Duração das requisições
- `app_info` - Informações da aplicação

##### Autenticação:

- `auth_events_total` - Eventos de autenticação
- `user_registrations_total` - Total de registros de usuário

##### Financeiro:

- `financial_transactions_total` - Total de transações
- `financial_transaction_amount` - Valores das transações
- `financial_monthly_balance` - Saldo mensal por usuário
- `financial_category_distribution` - Distribuição por categoria
- `financial_active_users` - Usuários ativos

##### Erros e Regras de Negócio:

- `api_errors_total` - Total de erros da API
- `business_rules_total` - Execuções de regras de negócio

### 3. Tracing Distribuído

**Middleware:** `TraceContextMiddleware`
**Localização:** `src/infra/middleware/trace-context.middleware.ts`

#### Headers de Tracing:

- `x-trace-id` - ID único da requisição (gerado automaticamente)
- `x-span-id` - ID do span atual

#### Correlação:

- Todos os logs incluem trace ID e span ID
- Headers propagados automaticamente para clientes
- Contexto preservado através de toda a stack

### 4. Health Checks

**Controller:** `HealthController`
**Endpoint:** `GET /api/v1/health`

#### Verificações:

- Status da aplicação (ok/degraded/error)
- Conectividade com banco de dados
- Uso de memória e recursos
- Tempo de resposta dos serviços

#### Exemplo de Resposta:

```json
{
  "status": "ok",
  "uptime": 3600,
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "database": {
      "status": "connected",
      "responseTime": 15
    }
  },
  "metrics": {
    "memoryUsage": {
      "used": 128,
      "total": 512,
      "percentage": 25
    }
  }
}
```

### 5. Interceptors de Métricas

**Interceptor:** `MetricsInterceptor`
**Aplicação:** Automática em todos os controllers

#### Funcionalidades:

- Coleta automática de métricas de requisição
- Medição de duração e status
- Correlação com trace ID
- Zero configuração necessária

## 🛠️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` baseado no `env.example.observability`:

```bash
# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE_ENABLED=true

# Métricas
METRICS_ENABLED=true
METRICS_PATH=/metrics

# Health Checks
HEALTH_CHECK_MEMORY_THRESHOLD=85

# Performance
SLOW_QUERY_THRESHOLD=1000
SLOW_REQUEST_THRESHOLD=2000
```

### Estrutura de Logs

```
logs/
├── error.log      # Apenas erros
├── combined.log   # Todos os logs
└── access.log     # Logs de acesso (futuro)
```

## 📈 Monitoramento em Produção

### 1. Prometheus Setup (Opcional)

```yaml
# prometheus.yml
scrape_configs:
  - job_name: "financial-api"
    static_configs:
      - targets: ["localhost:3000"]
    metrics_path: "/api/v1/metrics"
    scrape_interval: 30s
```

### 2. Grafana Dashboards (Opcional)

**Dashboards Recomendados:**

- **API Performance:** Latência, throughput, taxa de erro
- **Financial Metrics:** Transações, saldos, categorias
- **System Health:** CPU, memória, disk I/O
- **User Activity:** Registros, logins, atividade

### 3. Alertas Recomendados

```yaml
# Exemplo de alertas no Grafana/Prometheus
groups:
  - name: financial_api
    rules:
      - alert: HighErrorRate
        expr: rate(api_errors_total[5m]) > 0.1
        labels:
          severity: critical
        annotations:
          summary: "Taxa de erro alta na API"

      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 2
        labels:
          severity: warning
        annotations:
          summary: "Tempo de resposta lento"

      - alert: DatabaseConnectionFailed
        expr: up{job="financial-api"} == 0
        labels:
          severity: critical
        annotations:
          summary: "API indisponível"
```

## 🔧 Desenvolvimento

### Executar com Observabilidade

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp env.example.observability .env

# Executar em modo desenvolvimento
npm run start:dev

# Acessar endpoints
curl http://localhost:3000/api/v1/health
curl http://localhost:3000/api/v1/metrics
```

### Visualizar Logs

```bash
# Logs em tempo real
tail -f logs/combined.log | jq '.'

# Filtrar por evento
grep "entry_create_success" logs/combined.log | jq '.'

# Filtrar por trace ID
grep "trace-123" logs/combined.log | jq '.'
```

### Métricas de Desenvolvimento

```bash
# Ver métricas formatadas
curl http://localhost:3000/api/v1/metrics | grep financial_

# Contar transações
curl http://localhost:3000/api/v1/metrics | grep financial_transactions_total

# Ver distribuição por categoria
curl http://localhost:3000/api/v1/metrics | grep financial_category_distribution
```

## 🎯 Casos de Uso Observados

### UC-01 a UC-04: Registro de Entradas

- **Logs:** Tentativas, sucessos, erros de validação
- **Métricas:** Contadores por tipo (INCOME/EXPENSE), valores
- **Traces:** Correlação através de toda a operação

### UC-05: Listagem de Entradas

- **Logs:** Consultas lentas, filtros aplicados
- **Métricas:** Performance de queries, resultados retornados
- **Traces:** Rastreamento de paginação complexa

### UC-06/UC-07: Atualização/Exclusão

- **Logs:** Alterações de dados, validações de propriedade
- **Métricas:** Operações de modificação
- **Traces:** Auditoria completa de mudanças

### UC-08: Sumário Mensal

- **Logs:** Cálculos complexos, tempo de processamento
- **Métricas:** Saldos mensais, distribuição por categoria
- **Traces:** Performance de agregações

### UC-09: Previsão de Cash Flow

- **Logs:** Algoritmos de previsão, tendências detectadas
- **Métricas:** Acurácia das previsões, uso da funcionalidade
- **Traces:** Cálculos de projeção complexos

## 🔒 Segurança dos Logs

- **Dados Sensíveis:** Nunca logados (senhas, tokens JWT)
- **PII:** Email e ID de usuário apenas em contexto necessário
- **Sanitização:** Headers de autorização removidos automaticamente
- **Retenção:** Configurável via variáveis de ambiente

## 📋 Checklist de Produção

- [ ] Variáveis de ambiente configuradas
- [ ] Logs rotacionando corretamente
- [ ] Métricas sendo coletadas
- [ ] Health checks respondendo
- [ ] Alertas configurados
- [ ] Dashboards funcionando
- [ ] Traces correlacionados
- [ ] Performance dentro dos limites

## 🚀 Próximos Passos

1. **OpenTelemetry:** Implementar tracing distribuído completo
2. **APM:** Integração com DataDog ou New Relic
3. **Alerting:** Sistema de notificações automáticas
4. **Chaos Engineering:** Testes de resiliência
5. **SLI/SLO:** Definição de objetivos de nível de serviço
