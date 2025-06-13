# 🔍 API Observability Guidelines

Estas diretrizes têm como objetivo garantir **transparência**, **rastreamento de erros** e **métricas de performance** no backend da aplicação (API), utilizando ferramentas modernas de observabilidade.

---

## 🌟 Objetivos da Observabilidade

- Monitorar **comportamentos inesperados** e **erros em tempo de execução**
- Obter **métricas de performance** da aplicação
- Implementar **tracing distribuído** para rastrear requisições ponta a ponta
- Garantir que logs, métricas e traces sejam **enviados para ferramentas externas**

---

## 📦 Stack Recomendada

| Categoria      | Ferramenta      | Descrição                            |
| -------------- | --------------- | ------------------------------------ |
| Logs           | Winston         | Logger estruturado em JSON           |
| Métricas       | Prometheus      | Coleta de métricas customizadas      |
| Dashboard      | Grafana         | Visualização das métricas            |
| Tracing        | OpenTelemetry   | Tracing distribuído                  |
| APM (opcional) | Datadog, Sentry | Monitoramento de erros e performance |

---

## 📋 Logging com Winston

### 📁 Estrutura recomendada

```
src/infra/logging/winston-logger.ts
```

### 📌 Exemplo de implementação

```ts
import { LoggerService } from "@nestjs/common";
import { createLogger, format, transports } from "winston";

export class WinstonLogger implements LoggerService {
  private logger = createLogger({
    level: "info",
    format: format.combine(format.timestamp(), format.json()),
    transports: [
      new transports.Console(),
      new transports.File({ filename: "logs/error.log", level: "error" }),
    ],
  });

  log(message: string) {
    this.logger.info({ message });
  }

  error(message: string, trace: string) {
    this.logger.error({ message, trace });
  }

  warn(message: string) {
    this.logger.warn({ message });
  }

  debug(message: string) {
    this.logger.debug({ message });
  }
}
```

### 🔌 Como aplicar globalmente no `main.ts`

```ts
const app = await NestFactory.create(AppModule, {
  logger: new WinstonLogger(),
});
```

---

## 📊 Métricas com Prometheus

### Instalação

```bash
npm install prom-client
```

### Exemplo de uso

```ts
import { Injectable } from "@nestjs/common";
import * as client from "prom-client";

@Injectable()
export class MetricsService {
  private readonly httpRequestDuration = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "Duração das requisições HTTP",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.1, 0.5, 1, 1.5, 2, 5],
  });

  startTimer(labels: Record<string, string>) {
    return this.httpRequestDuration.startTimer(labels);
  }
}
```

### Expondo rota `/metrics`

```ts
@Controller("metrics")
export class MetricsController {
  @Get()
  async getMetrics(@Res() res: Response) {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  }
}
```

---

## 🤭 Tracing com OpenTelemetry (Opcional)

### Instalação

```bash
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
```

### Configuração básica

Crie um arquivo `tracing.ts` no root:

```ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

const sdk = new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

E importe ele no `main.ts`:

```ts
import "./tracing";
```

### Exportação para:

- Jaeger
- OTLP (para Datadog ou outros provedores)
- Console (desenvolvimento)

---

## 🔗 Correlação de Logs e Tracing

Para uma visão holística do sistema financeiro, implemente a correlação entre logs, métricas e traces:

### 1. Middleware de Trace ID

```typescript
// src/infra/middleware/trace-context.middleware.ts
@Injectable()
export class TraceContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Gerar ou preservar traceId
    const traceId = req.headers["x-trace-id"] || randomUUID();
    const spanId = randomUUID().split("-")[0];

    // Disponibilizar no contexto da requisição
    req.traceContext = { traceId, spanId };

    // Adicionar headers para propagação
    res.setHeader("x-trace-id", traceId);

    // Adicionar ao contexto assíncrono para acesso em qualquer ponto do ciclo de vida
    AsyncLocalStorage.getStore()?.set("traceContext", { traceId, spanId });

    next();
  }
}
```

### 2. Logger Melhorado com Contexto

```typescript
// src/infra/logging/context-aware-logger.ts
@Injectable()
export class ContextAwareLogger implements LoggerService {
  private logger = createLogger({
    // ... configuração base
  });

  private getTraceContext() {
    return AsyncLocalStorage.getStore()?.get("traceContext") || {};
  }

  log(message: any, context?: string) {
    const { traceId, spanId } = this.getTraceContext();
    this.logger.info({
      message,
      context,
      traceId,
      spanId,
      timestamp: new Date().toISOString(),
    });
  }

  // Outros métodos (error, warn, debug) seguindo o mesmo padrão
}
```

### 3. Interceptor para Métricas com Trace

```typescript
// src/infra/interceptors/metrics.interceptor.ts
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { traceId } = req.traceContext || {};
    const route = req.route?.path || "unknown";

    // Iniciar timer com trace id
    const timer = this.metricsService.startTimer({
      method: req.method,
      route,
      traceId,
    });

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse();
        // Finalizar timer com status code
        timer({ status_code: res.statusCode });
      })
    );
  }
}
```

---

## 📊 Métricas Específicas para Finanças

Para monitorar aspectos específicos de uma aplicação financeira:

```typescript
// src/infra/metrics/financial-metrics.service.ts
@Injectable()
export class FinancialMetricsService {
  private readonly transactionCounter = new client.Counter({
    name: "financial_transactions_total",
    help: "Contador de transações financeiras",
    labelNames: ["type", "category", "status"],
  });

  private readonly transactionAmount = new client.Gauge({
    name: "financial_transaction_amount",
    help: "Valor das transações financeiras",
    labelNames: ["type", "category"],
  });

  private readonly monthlyBalance = new client.Gauge({
    name: "financial_monthly_balance",
    help: "Saldo mensal por usuário",
    labelNames: ["user_id", "year", "month"],
  });

  private readonly categoryDistribution = new client.Gauge({
    name: "financial_category_distribution",
    help: "Distribuição de gastos por categoria",
    labelNames: ["user_id", "category", "year", "month"],
  });

  // Registra uma nova transação
  recordTransaction(
    type: "INCOME" | "EXPENSE",
    category: string,
    amount: number,
    status: "success" | "failed"
  ) {
    this.transactionCounter.inc({ type, category, status });

    if (status === "success") {
      this.transactionAmount.set({ type, category }, amount);
    }
  }

  // Atualiza saldo mensal
  updateMonthlyBalance(
    userId: string,
    year: number,
    month: number,
    balance: number
  ) {
    this.monthlyBalance.set(
      { user_id: userId, year: String(year), month: String(month) },
      balance
    );
  }

  // Atualiza distribuição por categoria
  updateCategoryDistribution(
    userId: string,
    year: number,
    month: number,
    categoryDistribution: Record<string, number>
  ) {
    Object.entries(categoryDistribution).forEach(([category, amount]) => {
      this.categoryDistribution.set(
        { user_id: userId, category, year: String(year), month: String(month) },
        amount
      );
    });
  }
}
```

### Como usar nas regras de negócio

```typescript
// src/data/usecases/db-add-entry.ts
@Injectable()
export class DbAddEntry implements AddEntry {
  constructor(
    private entryRepository: EntryRepository,
    private financialMetricsService: FinancialMetricsService
  ) {}

  async execute(data: AddEntryParams): Promise<EntryModel> {
    try {
      const entry = await this.entryRepository.create(data);

      // Registrar métrica de transação
      this.financialMetricsService.recordTransaction(
        data.type,
        data.category_id,
        data.amount,
        "success"
      );

      return entry;
    } catch (error) {
      // Registrar falha
      this.financialMetricsService.recordTransaction(
        data.type,
        data.category_id,
        data.amount,
        "failed"
      );
      throw error;
    }
  }
}
```

---

## 🚨 Sistema de Alertas Inteligentes

Para detectar anomalias e problemas operacionais em tempo real:

### 1. Configuração Básica de Alertas no Grafana

Configure alertas para:

- **Transações com Erro:** Mais de 5% de transações falhando em 5 minutos
- **Latência Alta:** API demorando mais de 2 segundos para responder
- **Inconsistência de Saldo:** Discrepância entre saldos calculados e armazenados
- **Picos de Uso:** Aumento súbito de 200% no volume de transações
- **Saúde do Sistema:** CPU > 80%, Memória > 85%, Disk I/O alto

### 2. Alertas Específicos para Negócio Financeiro

```yaml
# Exemplo de configuração para Grafana ou Prometheus Alertmanager

groups:
  - name: financial_alerts
    rules:
      - alert: NegativeBalanceAlert
        expr: financial_monthly_balance < 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Usuário com saldo negativo"
          description: "O usuário {{ $labels.user_id }} está com saldo negativo de {{ $value }} no mês {{ $labels.month }}/{{ $labels.year }}."

      - alert: LargeTransactionAlert
        expr: financial_transaction_amount > 10000
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Transação de alto valor detectada"
          description: "Transação de {{ $value }} na categoria {{ $labels.category }} foi registrada."

      - alert: UnusualActivityAlert
        expr: rate(financial_transactions_total[5m]) > 3 * rate(financial_transactions_total[1h] offset 1h)
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Atividade incomum detectada"
          description: "Aumento súbito de atividade para transações de tipo {{ $labels.type }}."

      - alert: CategorySpendingAnomaly
        expr: financial_category_distribution > historical_avg_by_category * 2
        for: 10m
        labels:
          severity: info
        annotations:
          summary: "Gasto anômalo em categoria"
          description: "O usuário {{ $labels.user_id }} está gastando mais que o dobro da média histórica na categoria {{ $labels.category }}."
```

### 3. Integração com Canais de Comunicação

Roteie alertas para os canais apropriados:

- **Slack:** Alertas operacionais para equipe de desenvolvimento
- **Email:** Resumo diário para equipe de produto
- **SMS/PagerDuty:** Alertas críticos que demandam ação imediata
- **Dashboard:** Visualização em tempo real para monitoramento contínuo

### 4. Automatização de Resposta a Incidentes

```typescript
// src/infra/monitoring/incident-response.service.ts
@Injectable()
export class IncidentResponseService {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly logger: LoggerService,
    private readonly notificationService: NotificationService
  ) {}

  // Resposta automatizada para incidentes
  async handleTransactionFailureSpike(details: any) {
    // 1. Registrar incidente
    this.logger.error(
      `Spike de falhas de transação detectado: ${JSON.stringify(details)}`
    );

    // 2. Coletar dados adicionais para diagnóstico
    const diagnosticData = await this.collectDiagnosticData();

    // 3. Notificar equipe
    await this.notificationService.notifyTeam("ops", {
      title: "Alerta de falhas em transações",
      message: `Taxa de falha acima de 5% nos últimos 5 minutos`,
      diagnosticLink: `/dashboard/transaction-failures?from=${
        details.time - 3600000
      }&to=${details.time}`,
    });

    // 4. Tentar ação corretiva automática, se aplicável
    if (details.possibleCause === "database_connection") {
      await this.attemptDatabaseConnectionReset();
    }

    return { status: "incident_registered", incident_id: randomUUID() };
  }

  private async collectDiagnosticData() {
    // Coleta métricas, logs e traces relevantes para o diagnóstico
    // ...
  }

  private async attemptDatabaseConnectionReset() {
    // Tenta ação corretiva automática
    // ...
  }
}
```

---

## 🚦 Boas práticas

- Use logs estruturados e padronizados
- Correlacione logs com `requestId` (use middleware para gerar)
- Não logar dados sensíveis (como tokens ou senhas)
- Crie dashboards no Grafana para:

  - Latência por rota
  - Erros por serviço
  - Uptime
  - Entradas/saldos acumulados (customizado)

---

## 📀 Exemplos de métricas customizadas

- `monthly_entry_count`
- `monthly_expense_total`
- `daily_user_sessions`
- `forecast_accuracy_rate`

---

## 📊 Dashboards Financeiros Recomendados

Para visualização eficaz dos dados financeiros, implemente dashboards específicos:

### 1. Dashboard de Saúde Operacional

- Taxa de sucesso de transações
- Latência média por tipo de operação
- Contagem de erros por categoria
- Uso de recursos de sistema

### 2. Dashboard de Indicadores Financeiros

- Distribuição de gastos por categoria (gráfico de pizza)
- Evolução do saldo mensal (linha temporal)
- Top 5 categorias de despesa (gráfico de barras)
- Comparativo de receitas x despesas (gráfico empilhado)

### 3. Dashboard de Análise de Usuários

- Número de usuários ativos por dia
- Média de transações por usuário
- Distribuição de valores de transação
- Horários de pico de uso

### Exemplo de Configuração no Grafana

```json
{
  "dashboard": {
    "id": null,
    "title": "Indicadores Financeiros",
    "tags": ["finance", "metrics"],
    "timezone": "browser",
    "panels": [
      {
        "title": "Saldo Mensal",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "sum(financial_monthly_balance) by (month, year)",
            "legendFormat": "{{month}}/{{year}}"
          }
        ]
      },
      {
        "title": "Distribuição por Categoria",
        "type": "pie",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "sum(financial_category_distribution{year='2025', month='06'}) by (category)",
            "legendFormat": "{{category}}"
          }
        ]
      }
    ],
    "refresh": "5m"
  }
}
```

---

## 🔐 Segurança dos Logs

- **Nunca** salve tokens JWT ou senhas
- Remova headers como `authorization` dos logs
- Gere `traceId` e `requestId` por requisição (middleware de rastreamento)

---

## 📍 Rota para Health Check

Implemente uma rota simples para verficação de disponibilidade:

```ts
@Controller("health")
export class HealthController {
  @Get()
  health() {
    return { status: "ok", uptime: process.uptime() };
  }
}
```

---

## 🔄 Monitoramento Contínuo e Refinamento

Para garantir que sua observabilidade evolua com a aplicação:

1. **Revisões Trimestrais:** Avalie métricas e logs para identificar oportunidades de melhoria
2. **Feedback dos Incidentes:** Após cada incidente, avalie se as métricas existentes foram suficientes para diagnóstico
3. **Exercícios de Caos:** Simule falhas controladas para testar a eficácia do monitoramento
4. **Documentação de Métricas:** Mantenha um catálogo atualizado de métricas e seus significados para a equipe
