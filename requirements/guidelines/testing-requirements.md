# 🧪 Testing Guidelines (Backend)

## File Structure

```
tests/
├── data/
│   ├── mocks/           # Stubs and spies for data layer
│   │   ├── repositories/
│   │   └── protocols/
│   └── usecases/
│       └── add-entry.spec.ts
├── domain/
│   └── mocks/           # Domain models and use case mocks
│       ├── models/
│       └── usecases/
├── infra/
│   ├── mocks/           # Infrastructure stubs and spies
│   │   ├── db/
│   │   ├── logging/
│   │   └── metrics/
│   └── db/
│       └── typeorm/
│           └── repositories/
├── presentation/
│   ├── mocks/           # Controller and middleware mocks
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   └── guards/
│   └── controllers/
└── main/
    └── mocks/           # Factory and module mocks
```

Tests must mirror the project folder structure. For example, tests for `src/data/usecases/add-entry.ts` must be placed in `tests/data/usecases/add-entry.spec.ts`.

## Test Types & Mock Strategy

- **Unit Tests:**  
  Test individual use case implementations and repository interfaces in isolation using **mocks** for dependencies.  
  Focus on domain and data layers with complete isolation.

- **Integration Tests:**  
  Test controllers integrated with the database and use cases using **stubs** for external services.  
  Use an isolated test database to verify request-response cycles.

- **End-to-End (E2E) Tests:**  
  Use **spies** to monitor real system interactions while using Supertest for HTTP calls.  
  Cover full API flow from request to database persistence.

## 🎭 Mocks, Stubs, and Spies Strategy

### Terminology & Usage

- **Mocks**: Complete fake implementations for isolated unit testing
- **Stubs**: Simplified implementations that provide predictable responses
- **Spies**: Wrappers around real implementations to observe interactions

### Layer-Specific Mock Organization

#### Domain Layer Mocks (`tests/domain/mocks/`)

```typescript
// tests/domain/mocks/models/entry.mock.ts
export const mockEntry: Entry = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  userId: "user-123",
  description: "Test Entry",
  amount: 10000, // 100.00 in cents
  category: "Food",
  type: "EXPENSE",
  isFixed: false,
  date: new Date("2025-06-01"),
  createdAt: new Date("2025-06-01T10:00:00Z"),
  updatedAt: new Date("2025-06-01T10:00:00Z"),
};

export const mockEntryCreateData: EntryCreateData = {
  userId: "user-123",
  description: "Test Entry",
  amount: 10000,
  category: "Food",
  type: "EXPENSE",
  isFixed: false,
  date: new Date("2025-06-01"),
};

export class MockEntryFactory {
  static create(overrides: Partial<Entry> = {}): Entry {
    return { ...mockEntry, ...overrides };
  }

  static createMany(count: number, overrides: Partial<Entry> = {}): Entry[] {
    return Array.from({ length: count }, (_, index) =>
      this.create({ ...overrides, id: `entry-${index + 1}` })
    );
  }
}
```

```typescript
// tests/domain/mocks/usecases/add-entry.mock.ts
export const mockAddEntryUseCase: jest.Mocked<AddEntryUseCase> = {
  execute: jest.fn(),
};

export class AddEntryUseCaseMockFactory {
  static createSuccess(entry: Entry = mockEntry): jest.Mocked<AddEntryUseCase> {
    return {
      execute: jest.fn().mockResolvedValue(entry),
    };
  }

  static createFailure(error: Error): jest.Mocked<AddEntryUseCase> {
    return {
      execute: jest.fn().mockRejectedValue(error),
    };
  }
}
```

#### Data Layer Stubs (`tests/data/mocks/`)

```typescript
// tests/data/mocks/repositories/entry-repository.stub.ts
export class EntryRepositoryStub implements EntryRepository {
  private entries: Map<string, Entry> = new Map();

  async create(data: EntryCreateData): Promise<Entry> {
    const entry: Entry = {
      ...data,
      id: `stub-entry-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.entries.set(entry.id, entry);
    return entry;
  }

  async findById(id: string): Promise<Entry | null> {
    return this.entries.get(id) || null;
  }

  async findByUserId(userId: string): Promise<Entry[]> {
    return Array.from(this.entries.values()).filter(
      (entry) => entry.userId === userId
    );
  }

  async update(id: string, data: EntryUpdateData): Promise<Entry> {
    const existing = this.entries.get(id);
    if (!existing) throw new Error("Entry not found");

    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.entries.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.entries.delete(id);
  }

  // Test utility methods
  clear(): void {
    this.entries.clear();
  }

  seed(entries: Entry[]): void {
    entries.forEach((entry) => this.entries.set(entry.id, entry));
  }
}
```

```typescript
// tests/data/mocks/protocols/validation.stub.ts
export class ValidationStub implements ValidationProtocol<any> {
  private shouldFail = false;
  private errors: ValidationError[] = [];

  validate(data: any): ValidationResult {
    return {
      isValid: !this.shouldFail,
      errors: this.errors,
    };
  }

  // Test utility methods
  mockValidationSuccess(): void {
    this.shouldFail = false;
    this.errors = [];
  }

  mockValidationFailure(errors: ValidationError[]): void {
    this.shouldFail = true;
    this.errors = errors;
  }
}
```

#### Infrastructure Layer Spies (`tests/infra/mocks/`)

```typescript
// tests/infra/mocks/logging/logger.spy.ts
export class LoggerSpy implements ContextAwareLoggerService {
  public loggedEvents: any[] = [];
  public loggedBusinessEvents: any[] = [];
  public loggedSecurityEvents: any[] = [];
  public loggedErrors: any[] = [];

  log(message: string, ...args: any[]): void {
    this.loggedEvents.push({ level: "log", message, args });
  }

  error(message: string, stack?: string): void {
    this.loggedErrors.push({ message, stack });
  }

  warn(message: string): void {
    this.loggedEvents.push({ level: "warn", message });
  }

  debug(message: string): void {
    this.loggedEvents.push({ level: "debug", message });
  }

  logBusinessEvent(event: any): void {
    this.loggedBusinessEvents.push(event);
  }

  logSecurityEvent(event: any): void {
    this.loggedSecurityEvents.push(event);
  }

  // Test utility methods
  clear(): void {
    this.loggedEvents = [];
    this.loggedBusinessEvents = [];
    this.loggedSecurityEvents = [];
    this.loggedErrors = [];
  }

  getBusinessEvents(eventType?: string): any[] {
    return eventType
      ? this.loggedBusinessEvents.filter((e) => e.event === eventType)
      : this.loggedBusinessEvents;
  }

  getSecurityEvents(severity?: string): any[] {
    return severity
      ? this.loggedSecurityEvents.filter((e) => e.severity === severity)
      : this.loggedSecurityEvents;
  }
}
```

```typescript
// tests/infra/mocks/metrics/metrics.spy.ts
export class MetricsSpy implements MetricsService {
  public recordedMetrics: any[] = [];
  public startedTimers: any[] = [];

  startTimer(name: string): any {
    const timerFn = jest.fn((labels: any) => {
      this.recordedMetrics.push({ name, labels, type: "timer" });
    });

    this.startedTimers.push({ name, timer: timerFn });
    return timerFn;
  }

  incrementCounter(name: string, labels: any = {}): void {
    this.recordedMetrics.push({ name, labels, type: "counter" });
  }

  recordGauge(name: string, value: number, labels: any = {}): void {
    this.recordedMetrics.push({ name, value, labels, type: "gauge" });
  }

  recordHistogram(name: string, value: number, labels: any = {}): void {
    this.recordedMetrics.push({ name, value, labels, type: "histogram" });
  }

  // Test utility methods
  clear(): void {
    this.recordedMetrics = [];
    this.startedTimers = [];
  }

  getMetrics(name?: string): any[] {
    return name
      ? this.recordedMetrics.filter((m) => m.name === name)
      : this.recordedMetrics;
  }

  getTimers(name?: string): any[] {
    return name
      ? this.startedTimers.filter((t) => t.name === name)
      : this.startedTimers;
  }
}
```

#### Presentation Layer Mocks (`tests/presentation/mocks/`)

```typescript
// tests/presentation/mocks/guards/auth.mock.ts
export const mockJwtAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

export class AuthGuardMockFactory {
  static createAuthorized(): any {
    return {
      canActivate: jest.fn().mockReturnValue(true),
    };
  }

  static createUnauthorized(): any {
    return {
      canActivate: jest.fn().mockReturnValue(false),
    };
  }
}
```

```typescript
// tests/presentation/mocks/controllers/request.mock.ts
export const mockRequest = {
  user: {
    userId: "user-123",
    email: "test@example.com",
  },
  traceId: "trace-123",
  headers: {
    authorization: "Bearer mock-token",
  },
};

export class RequestMockFactory {
  static create(overrides: any = {}): any {
    return { ...mockRequest, ...overrides };
  }

  static createWithUser(
    userId: string,
    email: string = "test@example.com"
  ): any {
    return this.create({
      user: { userId, email },
    });
  }
}
```

## Tools

- **Jest:** Test runner and assertion library for unit and integration tests.
- **Supertest:** HTTP assertions for E2E API testing.
- **TypeORM Test Utils:** For managing test database connection and cleanup.
- **Jest Mocks:** For creating mocks, stubs, and spies with full type safety.

## Test Guidelines

- Each use case must have at least one unit test verifying all core logic and edge cases using **mocks**.
- Controller tests must verify HTTP request handling, validation, and error management using **stubs**.
- Use **spies** for integration tests to observe real system interactions.
- Organize mocks by architectural layer in dedicated `mocks/` folders.
- Use factory patterns for creating test data with variations.
- Use descriptive test names and group related tests with `describe` blocks.
- Coverage should target 80%+ of critical code paths.
- Clean up test state between tests using mock utilities.

## Mock Guidelines by Test Type

### Unit Tests - Use Mocks

- **Purpose**: Complete isolation of unit under test
- **When**: Testing business logic, use cases, validators
- **Implementation**: Full mock implementations with Jest mocks
- **Benefits**: Fast execution, predictable behavior, complete control

### Integration Tests - Use Stubs

- **Purpose**: Test component interactions with predictable external dependencies
- **When**: Testing repository patterns, service integration
- **Implementation**: Simplified real implementations
- **Benefits**: Faster than real dependencies, controllable responses

### E2E Tests - Use Spies

- **Purpose**: Monitor real system behavior while maintaining observability
- **When**: Full API testing, system behavior verification
- **Implementation**: Wrap real services with observation capabilities
- **Benefits**: Real behavior validation, interaction monitoring

## Example: AddEntry Use Case Unit Test Structure

```ts
// tests/data/usecases/add-entry.spec.ts
import { AddEntryUseCase } from "../../../src/data/usecases/add-entry.usecase";
import { EntryRepositoryStub } from "../mocks/repositories/entry-repository.stub";
import { ValidationStub } from "../mocks/protocols/validation.stub";
import { MockEntryFactory } from "../../domain/mocks/models/entry.mock";

describe("AddEntry Use Case", () => {
  let useCase: AddEntryUseCase;
  let repositoryStub: EntryRepositoryStub;
  let validationStub: ValidationStub;

  beforeEach(() => {
    repositoryStub = new EntryRepositoryStub();
    validationStub = new ValidationStub();
    useCase = new AddEntryUseCase(repositoryStub, validationStub);
  });

  afterEach(() => {
    repositoryStub.clear();
  });

  it("should add a valid entry", async () => {
    // Arrange
    const inputData = MockEntryFactory.create().createData;
    validationStub.mockValidationSuccess();

    // Act
    const result = await useCase.execute(inputData);

    // Assert
    expect(result).toHaveProperty("id");
    expect(result.description).toBe(inputData.description);
    expect(result.amount).toBe(inputData.amount);
  });

  it("should throw an error on invalid data", async () => {
    // Arrange
    const inputData = MockEntryFactory.create({ amount: -100 }).createData;
    validationStub.mockValidationFailure([
      { field: "amount", message: "Amount must be positive" },
    ]);

    // Act & Assert
    await expect(useCase.execute(inputData)).rejects.toThrow(
      "Validation failed"
    );
  });
});
```

## Example: Controller Integration Test Structure

```ts
// tests/presentation/controllers/entry.controller.spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { EntryController } from "../../../src/presentation/controllers/entry.controller";
import { AddEntryUseCaseMockFactory } from "../../domain/mocks/usecases/add-entry.mock";
import { LoggerSpy } from "../../infra/mocks/logging/logger.spy";
import { MetricsSpy } from "../../infra/mocks/metrics/metrics.spy";
import { RequestMockFactory } from "../mocks/controllers/request.mock";

describe("Entry Controller", () => {
  let controller: EntryController;
  let addEntryUseCase: jest.Mocked<AddEntryUseCase>;
  let loggerSpy: LoggerSpy;
  let metricsSpy: MetricsSpy;

  beforeEach(async () => {
    addEntryUseCase = AddEntryUseCaseMockFactory.createSuccess();
    loggerSpy = new LoggerSpy();
    metricsSpy = new MetricsSpy();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntryController],
      providers: [
        { provide: AddEntryUseCase, useValue: addEntryUseCase },
        { provide: ContextAwareLoggerService, useValue: loggerSpy },
        { provide: MetricsService, useValue: metricsSpy },
      ],
    }).compile();

    controller = module.get<EntryController>(EntryController);
  });

  afterEach(() => {
    loggerSpy.clear();
    metricsSpy.clear();
  });

  it("should create entry and log business event", async () => {
    // Arrange
    const createDto = { description: "Test", amount: 100 /* ... */ };
    const mockRequest = RequestMockFactory.createWithUser("user-123");

    // Act
    const result = await controller.create(createDto, mockRequest);

    // Assert
    expect(result).toHaveProperty("id");
    expect(addEntryUseCase.execute).toHaveBeenCalledWith({
      ...createDto,
      userId: "user-123",
    });

    // Verify logging
    const businessEvents = loggerSpy.getBusinessEvents(
      "entry_api_create_success"
    );
    expect(businessEvents).toHaveLength(1);
    expect(businessEvents[0]).toMatchObject({
      userId: "user-123",
      traceId: "trace-123",
    });

    // Verify metrics
    const timerMetrics = metricsSpy.getTimers("http_request_duration");
    expect(timerMetrics).toHaveLength(1);
  });
});
```

## Example: E2E Test with Database

```ts
// tests/presentation/controllers/entry.controller.e2e-spec.ts
describe("Entry Controller (e2e)", () => {
  let app: INestApplication;
  let authToken: string;
  let loggerSpy: LoggerSpy;

  beforeAll(async () => {
    loggerSpy = new LoggerSpy();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ContextAwareLoggerService)
      .useValue(loggerSpy)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authToken = await getAuthToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    loggerSpy.clear();
  });

  it("should create entry via POST /entries", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/entries")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        description: "Salary",
        amount: 5000,
        date: "2025-06-01T00:00:00Z",
        category: "Salary",
        type: "INCOME",
        is_fixed: true,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    // Verify business events were logged
    const businessEvents = loggerSpy.getBusinessEvents(
      "entry_api_create_success"
    );
    expect(businessEvents).toHaveLength(1);
  });
});
```

## 🚀 Performance Testing

Para garantir a escalabilidade da API financeira, implemente testes de carga e performance:

### Ferramentas Recomendadas

- **Artillery:** Para testes de carga com definição em YAML
- **k6:** Para testes de performance orientados a script
- **Locust:** Para testes de carga com comportamento de usuário simulado

### Cenários Críticos para Teste de Carga

1. **Alta concorrência em relatórios financeiros:**

   - Múltiplos usuários acessando relatórios mensais simultaneamente, especialmente no primeiro dia do mês
   - Verificar tempo de resposta médio < 1s com 100 usuários simultâneos

2. **Processamento em lote de lançamentos recorrentes:**

   - Simular a criação de centenas de lançamentos recorrentes mensais
   - Garantir que o banco de dados e APIs suportem este volume

3. **Dashboard em tempo real:**
   - Simular múltiplas requisições em tempo real ao dashboard financeiro
   - Verificar latência e uso de recursos

### Exemplo de Script Artillery

```yaml
# performance-tests/financial-api-load.yml
config:
  target: "http://localhost:3000/api"
  phases:
    - duration: 60
      arrivalRate: 5
      rampTo: 50
      name: "Aumento gradual de usuários"
    - duration: 120
      arrivalRate: 50
      name: "Carga sustentada"
  defaults:
    headers:
      Authorization: "Bearer {{$processEnvironment.TEST_TOKEN}}"

scenarios:
  - name: "Consulta de Dashboard Financeiro"
    flow:
      - get:
          url: "/v1/summary?month=2025-06"
          expect:
            - statusCode: 200
            - contentType: "application/json"
      - think: 2
      - get:
          url: "/v1/entries?month=2025-06"
          expect:
            - statusCode: 200
      - think: 1
      - get:
          url: "/v1/forecast"
          expect:
            - statusCode: 200

  - name: "Criação de Lançamentos"
    flow:
      - post:
          url: "/v1/entries"
          json:
            description: "Pagamento {{$randomString(10)}}"
            amount: "{{ Math.random() * 1000 }}"
            category_id: "{{$processEnvironment.TEST_CATEGORY_ID}}"
            date: "2025-06-{{ Math.floor(Math.random() * 28) + 1 }}"
            type: "EXPENSE"
            is_fixed: false
          expect:
            - statusCode: 201
```

### Monitoramento Durante Testes de Performance

Durante os testes, monitore:

- Uso de CPU e memória dos containers
- Tempo médio de resposta por endpoint
- Número de queries SQL por requisição
- Taxa de erros
- Conexões simultâneas ao banco de dados

### Limites Aceitáveis

| Métrica                 | Limite Aceitável |
| ----------------------- | ---------------- |
| Tempo médio de resposta | < 200ms          |
| P95 tempo de resposta   | < 500ms          |
| Uso de CPU              | < 70%            |
| Uso de memória          | < 80%            |
| Taxa de erro            | < 0.1%           |

## 🔄 Testes de Integração com Sistemas Externos

Para aplicações financeiras que integram com sistemas de pagamento:

### Simulação de Gateways de Pagamento

```typescript
// tests/mocks/payment-gateway.mock.ts
export class MockPaymentGateway implements PaymentGateway {
  async processPayment(
    amount: number,
    paymentDetails: any
  ): Promise<PaymentResult> {
    // Simular diferentes cenários baseados no valor
    if (amount <= 0) {
      return {
        success: false,
        error: "INVALID_AMOUNT",
        transactionId: null,
      };
    }

    if (amount > 10000) {
      return {
        success: false,
        error: "AMOUNT_EXCEEDS_LIMIT",
        transactionId: null,
      };
    }

    // Simular transações com cartão específico como rejeitadas
    if (paymentDetails.cardNumber?.endsWith("1234")) {
      return {
        success: false,
        error: "CARD_DECLINED",
        transactionId: null,
      };
    }

    // Transação bem-sucedida
    return {
      success: true,
      transactionId: `mock-tx-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`,
      authorizationCode: `AUTH${Math.floor(Math.random() * 1000000)}`,
      processingDate: new Date(),
    };
  }

  async refundPayment(transactionId: string): Promise<RefundResult> {
    // Simular cenários de reembolso
    if (transactionId.includes("no-refund")) {
      return {
        success: false,
        error: "REFUND_NOT_ALLOWED",
      };
    }

    return {
      success: true,
      refundId: `refund-${Date.now()}`,
      processingDate: new Date(),
    };
  }
}
```

### Teste do Fluxo de Pagamento

```typescript
// tests/integration/payment-flow.spec.ts
describe("Payment Flow Integration", () => {
  let app: INestApplication;
  let mockPaymentGateway: MockPaymentGateway;

  beforeAll(async () => {
    mockPaymentGateway = new MockPaymentGateway();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PaymentGateway)
      .useValue(mockPaymentGateway)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should process a valid subscription payment", async () => {
    // Arrange: Criar usuário e plano de assinatura

    // Act: Fazer requisição de pagamento
    const response = await request(app.getHttpServer())
      .post("/api/v1/subscriptions")
      .set("Authorization", `Bearer ${validUserToken}`)
      .send({
        plan: "premium",
        paymentMethod: {
          type: "credit_card",
          cardNumber: "4111111111111111",
          expiryMonth: "12",
          expiryYear: "2030",
          cvv: "123",
        },
      });

    // Assert: Verificar resultado
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("subscriptionId");
    expect(response.body.status).toBe("ACTIVE");
    expect(response.body).toHaveProperty("transactionId");

    // Verificar se registro foi criado no banco
    const subscriptionRepo = app.get(getRepositoryToken(Subscription));
    const saved = await subscriptionRepo.findOne({
      where: { id: response.body.subscriptionId },
    });
    expect(saved).toBeDefined();
    expect(saved.status).toBe("ACTIVE");
  });

  it("should handle declined payments correctly", async () => {
    // Arrange: Configurar cartão que será rejeitado

    // Act: Fazer requisição com cartão rejeitado
    const response = await request(app.getHttpServer())
      .post("/api/v1/subscriptions")
      .set("Authorization", `Bearer ${validUserToken}`)
      .send({
        plan: "premium",
        paymentMethod: {
          type: "credit_card",
          cardNumber: "4111111111111234", // Cartão que será rejeitado
          expiryMonth: "12",
          expiryYear: "2030",
          cvv: "123",
        },
      });

    // Assert: Verificar tratamento correto do erro
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("CARD_DECLINED");
  });
});
```

## 🔒 Testes de Segurança Específicos

Para garantir a segurança dos dados financeiros, implemente:

### 1. Testes de Autorização

```typescript
// tests/security/authorization.spec.ts
describe("Authorization Security Tests", () => {
  // Configuração inicial

  it("should prevent access to another user financial data", async () => {
    // Criar dois usuários com seus tokens
    const userToken = await loginUser(userCredentials);
    const otherUserToken = await loginUser(otherUserCredentials);

    // Criar uma entrada financeira para o segundo usuário
    const entry = await createEntry(otherUserToken, entryData);

    // Tentar acessar os dados com o primeiro usuário
    const response = await request(app.getHttpServer())
      .get(`/api/v1/entries/${entry.id}`)
      .set("Authorization", `Bearer ${userToken}`);

    // Verificar que acesso é negado
    expect(response.status).toBe(403);
  });

  it("should prevent non-admin users from accessing admin routes", async () => {
    const userToken = await loginUser(userCredentials);

    const response = await request(app.getHttpServer())
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(403);
  });
});
```

### 2. Testes de Sanitização de Dados Financeiros

```typescript
// tests/security/data-sanitization.spec.ts
describe("Financial Data Sanitization", () => {
  it("should sanitize SQL injection attempts in financial queries", async () => {
    const token = await loginUser(validCredentials);

    // Tentativa de injeção SQL em parâmetros de consulta
    const response = await request(app.getHttpServer())
      .get(`/api/v1/entries?month=2025-06' OR '1'='1`)
      .set("Authorization", `Bearer ${token}`);

    // Deve retornar 400 Bad Request, não 500 Server Error
    expect(response.status).toBe(400);
  });

  it("should prevent XSS in financial entry descriptions", async () => {
    const token = await loginUser(validCredentials);

    // Tentativa de XSS na descrição
    const response = await request(app.getHttpServer())
      .post("/api/v1/entries")
      .set("Authorization", `Bearer ${token}`)
      .send({
        description: '<script>alert("XSS")</script>Rent',
        amount: 1000,
        date: "2025-06-01",
        category_id: validCategoryId,
        type: "EXPENSE",
        is_fixed: true,
      });

    // Deve aceitar, mas sanitizar o conteúdo
    expect(response.status).toBe(201);

    // Verificar se a descrição foi sanitizada
    const entryRepo = app.get(getRepositoryToken(Entry));
    const saved = await entryRepo.findOne({
      where: { id: response.body.id },
    });

    expect(saved.description).not.toContain("<script>");
  });
});
```

### 3. Testes de Validação de Entrada para Valores Financeiros

```typescript
// tests/security/financial-validation.spec.ts
describe("Financial Data Validation", () => {
  it("should validate and reject negative expense amounts", async () => {
    const token = await loginUser(validCredentials);

    const response = await request(app.getHttpServer())
      .post("/api/v1/entries")
      .set("Authorization", `Bearer ${token}`)
      .send({
        description: "Negative Expense",
        amount: -500, // Valor negativo
        date: "2025-06-01",
        category_id: validCategoryId,
        type: "EXPENSE",
        is_fixed: false,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("amount must be a positive number");
  });

  it("should validate and reject excessive decimal places in amounts", async () => {
    const token = await loginUser(validCredentials);

    const response = await request(app.getHttpServer())
      .post("/api/v1/entries")
      .set("Authorization", `Bearer ${token}`)
      .send({
        description: "Too Many Decimals",
        amount: 100.123456, // Mais de 2 casas decimais
        date: "2025-06-01",
        category_id: validCategoryId,
        type: "EXPENSE",
        is_fixed: false,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      "amount must have at most 2 decimal places"
    );
  });

  it("should validate and reject future dates for non-recurring entries", async () => {
    const token = await loginUser(validCredentials);
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2); // Data 2 anos no futuro

    const response = await request(app.getHttpServer())
      .post("/api/v1/entries")
      .set("Authorization", `Bearer ${token}`)
      .send({
        description: "Future Entry",
        amount: 100,
        date: futureDate.toISOString(),
        category_id: validCategoryId,
        type: "EXPENSE",
        is_fixed: false, // Não é recorrente
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      "non-recurring entries cannot have future dates"
    );
  });
});
```

## 📋 Lista de Verificação de Testes para Finanças

Antes de liberar a API financeira para produção, verifique:

### Organização de Mocks

- [ ] Mocks organizados por layer arquitetural
- [ ] Factory patterns implementados para criação de test data
- [ ] Stubs com métodos de utilidade para testes (clear, seed, etc.)
- [ ] Spies implementados para observabilidade em testes

### Tipos de Teste

- [ ] Testes de unidade com mocks completos para isolamento
- [ ] Testes de integração com stubs para dependências externas
- [ ] Testes E2E com spies para monitoramento de comportamento real
- [ ] Testes de autorização e controle de acesso para dados financeiros
- [ ] Testes de validação de entrada para valores monetários
- [ ] Testes de sanitização para evitar injeção SQL e XSS
- [ ] Testes de performance para picos de uso (início/fim do mês)
- [ ] Testes de integração com gateways de pagamento (quando aplicável)
- [ ] Testes de persistência de transações (ACID)

### Qualidade dos Mocks

- [ ] Mocks mantêm contratos de interface
- [ ] Test utilities facilitam setup e cleanup
- [ ] Comportamentos de erro simulados corretamente
- [ ] Estado dos mocks limpo entre testes
