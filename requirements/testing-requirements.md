# 🧪 Testing Guidelines (Backend)

## File Structure

tests/
├── data/
│ └── usecases/
│ └── add-entry.spec.ts
├── infra/
├── presentation/
├── main/

Tests must mirror the project folder structure. For example, tests for `src/data/usecases/add-entry.ts` must be placed in `tests/data/usecases/add-entry.spec.ts`.

## Test Types

- **Unit Tests:**  
  Test individual use case implementations and repository interfaces in isolation (mock dependencies).  
  Focus on domain and data layers.

- **Integration Tests:**  
  Test controllers integrated with the database and use cases.  
  Use an isolated test database to verify request-response cycles.

- **End-to-End (E2E) Tests:**  
  Use Supertest to test API routes through HTTP calls, covering full API flow from request to database persistence.

## Tools

- **Jest:** Test runner and assertion library for unit and integration tests.
- **Supertest:** HTTP assertions for E2E API testing.
- **TypeORM Test Utils (optional):** For managing test database connection and cleanup.

## Test Guidelines

- Each use case must have at least one unit test verifying all core logic and edge cases.
- Controller tests must verify HTTP request handling, validation, and error management.
- Use mock implementations for repositories in unit tests.
- For integration and E2E tests, use a test database instance; clean state before each test suite.
- Use descriptive test names and group related tests with `describe` blocks.
- Coverage should target 80%+ of critical code paths.

## Example: AddEntry Use Case Unit Test Structure

```ts
describe("AddEntry Use Case", () => {
  it("should add a valid entry", async () => {
    // Arrange: mock repository, input data
    // Act: execute use case
    // Assert: verify repository call and returned result
  });

  it("should throw an error on invalid data", async () => {
    // Arrange invalid input
    // Act & Assert: expect error
  });
});
```

## Example: Controller Integration Test Structure

```ts
describe("Entry Controller", () => {
  beforeAll(async () => {
    // Setup test database connection
  });

  afterAll(async () => {
    // Close connection
  });

  it("should create entry via POST /entries", async () => {
    const response = await request(app).post("/entries").send({
      description: "Salary",
      amount: 5000,
      date: "2025-06-01T00:00:00Z",
      category: "Salary",
      type: "INCOME",
      is_fixed: true,
    });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
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

- [ ] Testes de unidade para regras de negócio financeiras (cálculos de saldo, juros, etc.)
- [ ] Testes de integração para fluxos completos (cadastro → lançamento → relatório)
- [ ] Testes de autorização e controle de acesso para dados financeiros
- [ ] Testes de validação de entrada para valores monetários
- [ ] Testes de sanitização para evitar injeção SQL e XSS
- [ ] Testes de performance para picos de uso (início/fim do mês)
- [ ] Testes de integração com gateways de pagamento (quando aplicável)
- [ ] Testes de persistência de transações (ACID)
