# 📘 API Documentation Guidelines

## 📌 Project Overview

This API is part of a **Personal Financial Control System**, designed to help users manage their income and expenses efficiently. The system allows users to register fixed and dynamic financial entries (both incomes and expenses), analyze their monthly summaries, and forecast future cash flow.

The API serves as the backend for this system, providing secure endpoints for data persistence, business logic processing, and financial data retrieval. It supports integrations with external authentication providers and is structured for scalability, maintainability, and clean separation of concerns based on Clean Architecture and SOLID principles.

## 🛠️ Tools

- **NestJS**
- **TypeORM**
- **PostgreSQL**
- **Swagger** (via `@nestjs/swagger`)
- **Class-based Dependency Injection**
- **JWT / OAuth2 for Authentication**

## 🧱 Documentation Guidelines

- Swagger auto-generates documentation from controller decorators.
- Use `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBody`, and other decorators to describe endpoints clearly.
- Every controller must be fully documented to ease integration and support external developers or public API exposure in the future.

## 🔁 Structure for Endpoint Documentation

Each route should include:

- `@ApiTags`: Grouping label for Swagger UI.
- `@ApiOperation`: Short summary.
- `@ApiResponse`: Define possible HTTP response statuses and schemas.
- `@ApiBody`: Define expected request body data.

## 📌 Example

```ts
@ApiTags('entries')
@Controller('entries')
export class EntryController {
  @Post()
  @ApiOperation({ summary: 'Create a new entry' })
  @ApiResponse({ status: 201, description: 'Entry created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiBody({ type: CreateEntryDto })
  async create(@Body() dto: CreateEntryDto) {
    return this.addEntryUseCase.execute(dto);
  }
}

# 🏛️ Project Architecture Guidelines

## 🧱 Stack
- API: **NestJS (TypeScript)**

- ORM: **TypeORM**

- Database: **PostgreSQL**

- Docs: **Swagger (OpenAPI)**

- Testing: **Jest, Supertest**

- Auth: **JWT + Social Logins (Google, Twitter, Apple, etc.)**

- Architecture: **Clean Architecture + SOLID Principles**
```

# 📂 Folder Structure

src/
├── domain/
│ ├── models/ # Pure business models (Entry, User, etc.)
│ └── usecases/ # Interfaces for application use cases
├── data/
│ ├── usecases/ # Implementations of use case interfaces
│ └── protocols/ # Abstract interfaces for external systems (db, crypto, etc.)
├── infra/
│ ├── db/typeorm/entities/ # TypeORM entity classes
│ └── implementations/ # Implementations of protocol interfaces (e.g., DB, JWT)
├── presentation/
│ └── controllers/ # NestJS controllers using decorators for Swagger
├── main/
│ └── factories/ # Dependency injection & wiring of controllers/usecases/repos
tests/
├── data/
├── domain/
├── infra/
├── presentation/
└── main/

# 🔁 Architectural Rules

## Domain Layer

- Contains only business logic interfaces and pure models.

- No dependency on any external library or framework.

- Example: IAddEntry, EntryModel.

## Data Layer

- Implements domain use case interfaces.

- Depends only on interfaces from the protocols folder.

- Examples: DbAddEntry, DbUpdateEntry.

## Protocols (inside Data Layer)

- Contains interfaces for infrastructure needs (e.g., EntryRepository, Encrypter, HttpClient).

- Helps abstract and decouple logic from specific technologies.

## Infra Layer

- Implements protocol interfaces using real technologies (TypeORM, JWT, etc.).

- Contains TypeORM entities, database repositories, and adapters.

- Examples: TypeormEntryRepository, JwtEncrypter.

## Presentation Layer

- Controllers that handle HTTP requests and responses using NestJS decorators.

- Must not contain any business logic directly.

- Example: EntryController.

## Main Layer

Responsible for composing the app.

Contains factories to instantiate and wire dependencies (use cases, repositories, controllers).

# 📌 Design Principles

- Use dependency inversion to inject abstractions, not concrete classes.

- Follow Single Responsibility Principle: one class = one reason to change.

- Favor composition over inheritance.

- All business rules and application logic are testable in isolation.

- No framework code should pollute the domain layer.

# 🧪 Test Guidelines

- All use cases, controllers, and adapters should be covered by tests. Maintain consistent test folder structure mirroring the source folders.

# 🔐 Security Guidelines

Estas diretrizes são específicas para a **API backend** e têm como objetivo garantir a segurança de autenticação, autorização, comunicação e tratamento de dados. Considerações de segurança para banco de dados e pagamentos serão abordadas em documentos separados.

## ✅ Melhores Práticas Gerais

### 1. **Autenticação e Autorização**

- Use **JWT** para autenticação com:
  - Tokens de acesso curtos (ex: 15 minutos)
  - Tokens de refresh com rotação segura
  - Armazenamento seguro: preferencialmente em `HttpOnly cookies`
- Implemente **Guards** do NestJS para proteger rotas privadas.
- Separe usuários por perfis/roles com **controle de acesso baseado em função (RBAC)**.
- Crie decorators como `@Roles('admin')` para facilitar leitura e segurança de rotas.

### 2. **Validação de Dados**

- Use `class-validator` + `class-transformer` em todos os DTOs para:
  - Evitar entradas malformadas
  - Prevenir injeção de código ou exploração de tipos

### 3. **Erros e Respostas**

- Evite mensagens de erro específicas como "usuário não encontrado" ou "senha incorreta".
- Sempre retornar mensagens genéricas para evitar **enumeração de contas**.

### 4. **Headers e CORS**

- Configure **CORS** para aceitar apenas domínios autorizados.
- Adicione cabeçalhos HTTP seguros:
  - `Strict-Transport-Security`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`

### 5. **Taxa de Requisições e Proteção**

- Use **Rate Limiting** para rotas críticas (`/login`, `/auth`, etc.).
- Use middleware como `@nestjs/throttler`.
- Adicione proteção contra **brute force** e **DDoS** (Cloudflare, API Gateway, etc.).

### 6. **Logging e Auditoria**

- Logue tentativas de login, falhas e requisições incomuns.
- Nunca logue dados sensíveis (ex: senhas, tokens).
- Utilize um sistema de log estruturado (como `Winston`).

---

## 🧨 Principais Ameaças e Proteções

| Ameaça                       | Prevenção                                                    |
| ---------------------------- | ------------------------------------------------------------ |
| **Injection (SQL, etc.)**    | Use ORM (TypeORM) e DTOs com validação                       |
| **XSS / Script Injection**   | Valide e sanitize qualquer entrada de usuário                |
| **CSRF**                     | Use tokens CSRF ou cookies SameSite + autenticação stateless |
| **JWT Token Theft**          | Armazene tokens em cookies `HttpOnly` e use HTTPS            |
| **Replay Attacks**           | Utilize expiração curta + rotação de tokens                  |
| **Account Enumeration**      | Mensagens genéricas de erro no login/registro                |
| **Rate Abuse / Brute Force** | Limite tentativas com `ThrottlerGuard` e IP blocking         |

---

## 📡 Segurança nas Rotas da API

- Todas as rotas privadas devem ser protegidas com **Guards de autenticação**.
- Utilize o `@UseGuards(AuthGuard)` e `@UseGuards(RolesGuard)` sempre que necessário.
- Documente no Swagger apenas rotas públicas por padrão (evite exposição de endpoints privados desnecessários).

---

## 🧪 Segurança em Ambientes de Teste

- Nunca exponha chaves reais em `.env.test`.
- Mantenha tokens e secrets fictícios.
- Não conecte testes e2e ao banco de produção.

---

## 📌 Resumo de Ferramentas Recomendadas

| Área           | Ferramenta                       |
| -------------- | -------------------------------- |
| Autenticação   | JWT + Guards + OAuth2 (externo)  |
| Rate Limiting  | `@nestjs/throttler`              |
| Logging seguro | `Winston`                        |
| DTO Validation | `class-validator`                |
| CORS/Header    | Middleware `helmet`, config Nest |
| API Firewall   | Cloudflare / API Gateway         |

---

## 🚨 Checklist de Segurança por Endpoint

- [ ] Validação via DTO
- [ ] Guard de autenticação
- [ ] Documentado no Swagger apenas se necessário
- [ ] Taxa limitada (se sensível)
- [ ] Logging de acesso (exceto dados sensíveis)

---

# 📝 API Versioning Strategy

Para garantir evolução e manutenção sustentável da API financeira, implementaremos uma estratégia de versionamento consistente:

## Princípios de Versionamento

1. **Compatibilidade Retroativa:** Garantir que clientes existentes não sejam afetados por mudanças nas novas versões.
2. **Transparência:** Comunicar claramente aos desenvolvedores quais endpoints estão em qual versão.
3. **Previsibilidade:** Usar convenções consistentes para indicar a versão.

## Estratégia Escolhida: URL Path Versioning

```
/api/v1/entries
/api/v2/entries
```

### Implementação no NestJS

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração global de prefixos versionados
  app.setGlobalPrefix("api");

  // Diferentes versões da API
  const v1ApiDocs = new DocumentBuilder()
    .setTitle("Financial API v1")
    .setVersion("1.0")
    .build();

  const v2ApiDocs = new DocumentBuilder()
    .setTitle("Financial API v2")
    .setVersion("2.0")
    .build();

  const v1Swagger = SwaggerModule.createDocument(app, v1ApiDocs, {
    include: [V1Module],
  });

  const v2Swagger = SwaggerModule.createDocument(app, v2ApiDocs, {
    include: [V2Module],
  });

  SwaggerModule.setup("api/v1/docs", app, v1Swagger);
  SwaggerModule.setup("api/v2/docs", app, v2Swagger);

  await app.listen(3000);
}
```

### Organização de Módulos

```
src/
├── v1/
│   ├── controllers/
│   └── dtos/
├── v2/
│   ├── controllers/
│   └── dtos/
└── domain/ (compartilhado)
    └── usecases/
```

## Políticas de Depreciação

Para uma transição suave entre versões:

1. **Anúncio Prévio:** Notificar usuários com pelo menos 6 meses de antecedência antes de depreciar uma versão.
2. **Header de Depreciação:** Incluir header de resposta para endpoints em versões depreciadas:
   ```
   Deprecation: true
   Sunset: Sat, 31 Dec 2024 23:59:59 GMT
   Link: </api/v2/entries>; rel="successor-version"
   ```
3. **Documentação Clara:** Marcar na documentação Swagger quais endpoints estão depreciados.
4. **Suporte Mínimo:** Manter pelo menos as 2 versões mais recentes ativas.

### Decoradores de Depreciação (NestJS)

```typescript
// Decorador customizado para endpoints depreciados
export function Deprecated(message: string, successorUrl?: string) {
  return applyDecorators(
    SetMetadata("deprecated", true),
    SetMetadata("deprecation-message", message),
    SetMetadata("successor-url", successorUrl),
    ApiResponse({
      status: 200,
      description: `DEPRECATED: ${message}`,
    })
  );
}

// Uso no controller
@Controller("api/v1/entries")
export class EntriesControllerV1 {
  @Get()
  @Deprecated(
    "This endpoint will be removed on Dec 31, 2024. Use v2 instead.",
    "/api/v2/entries"
  )
  async findAll() {
    // ...
  }
}
```

---

# 🚀 Cache e Performance

Para otimizar a performance em operações frequentes, especialmente em relatórios financeiros:

## Estratégias de Cache

### 1. In-Memory Cache (para desenvolvimento e pequenas instalações)

```typescript
// cache.module.ts
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  imports: [
    CacheModule.register({
      ttl: 60 * 5, // 5 minutos
      max: 100, // máximo 100 itens
    }),
  ],
  exports: [CacheModule],
})
export class AppCacheModule {}
```

### 2. Redis Cache (para produção)

```typescript
// cache.module.ts
import { CacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-store";

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      ttl: 60 * 15, // 15 minutos
    }),
  ],
  exports: [CacheModule],
})
export class AppCacheModule {}
```

## Casos de Uso para Cache

### Dados de Relatórios Financeiros

```typescript
// summary.service.ts
@Injectable()
export class SummaryService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private entryRepository: EntryRepository
  ) {}

  async getMonthlySummary(
    userId: string,
    year: number,
    month: number
  ): Promise<MonthlySummary> {
    const cacheKey = `summary:${userId}:${year}:${month}`;

    // Tenta buscar do cache primeiro
    const cachedData = await this.cacheManager.get<MonthlySummary>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Se não estiver em cache, calcula
    const entries = await this.entryRepository.findByYearAndMonth(
      userId,
      year,
      month
    );
    const summary = this.calculateSummary(entries);

    // Armazena em cache
    await this.cacheManager.set(cacheKey, summary);

    return summary;
  }

  // Método para invalidar cache quando entradas são modificadas
  async invalidateUserCache(
    userId: string,
    year: number,
    month: number
  ): Promise<void> {
    const cacheKey = `summary:${userId}:${year}:${month}`;
    await this.cacheManager.del(cacheKey);
  }
}
```

### Invalidação de Cache em Operações de Escrita

```typescript
// entry.service.ts
@Injectable()
export class EntryService {
  constructor(
    private entryRepository: EntryRepository,
    private summaryService: SummaryService
  ) {}

  async addEntry(userId: string, entryData: CreateEntryDto): Promise<Entry> {
    const entry = await this.entryRepository.create({
      ...entryData,
      userId,
    });

    // Invalidar cache relacionado
    const date = new Date(entry.date);
    await this.summaryService.invalidateUserCache(
      userId,
      date.getFullYear(),
      date.getMonth() + 1
    );

    return entry;
  }
}
```

## Otimização de Consultas

### Consultas Específicas para Relatórios

```typescript
// entry.repository.ts
@EntityRepository(Entry)
export class EntryRepository extends Repository<Entry> {
  // Consulta otimizada para dashboard financeiro
  async getMonthlyTotals(
    userId: string,
    year: number
  ): Promise<MonthlyTotal[]> {
    return this.createQueryBuilder("entry")
      .select("EXTRACT(MONTH FROM entry.date)", "month")
      .addSelect(
        "SUM(CASE WHEN entry.type = :incomeType THEN entry.amount ELSE 0 END)",
        "totalIncome"
      )
      .addSelect(
        "SUM(CASE WHEN entry.type = :expenseType THEN entry.amount ELSE 0 END)",
        "totalExpense"
      )
      .where("entry.userId = :userId")
      .andWhere("EXTRACT(YEAR FROM entry.date) = :year")
      .setParameters({
        userId,
        year,
        incomeType: "INCOME",
        expenseType: "EXPENSE",
      })
      .groupBy("month")
      .orderBy("month")
      .getRawMany();
  }
}
```

### Materialização de Dados para Dashboards

Para dados frequentemente consultados, considere views materializadas no PostgreSQL:

```sql
-- SQL para criar view materializada de resumo mensal
CREATE MATERIALIZED VIEW monthly_summaries AS
SELECT
  user_id,
  EXTRACT(YEAR FROM date) AS year,
  EXTRACT(MONTH FROM date) AS month,
  SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) AS total_income,
  SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) AS total_expense,
  SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END) AS balance
FROM entries
GROUP BY user_id, year, month;

-- Crie um índice para consultas rápidas
CREATE INDEX idx_monthly_summaries ON monthly_summaries(user_id, year, month);

-- Função para atualizar a view (executa após inserções/atualizações)
CREATE OR REPLACE FUNCTION refresh_monthly_summaries()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_summaries;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar a view quando as entradas são modificadas
CREATE TRIGGER refresh_monthly_summaries_trigger
AFTER INSERT OR UPDATE OR DELETE ON entries
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_monthly_summaries();
```

---

# 🔄 Tratamento de Erros Padronizado

## Estrutura de Tratamento de Erros Global

### 1. Exceções Personalizadas

```typescript
// src/domain/exceptions/domain-exceptions.ts

export class DomainException extends Error {
  constructor(
    public readonly message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidEntryException extends DomainException {
  constructor(message: string = "Invalid entry data") {
    super(message, "INVALID_ENTRY", 400);
  }
}

export class EntryNotFoundException extends DomainException {
  constructor(id: string) {
    super(`Entry with id ${id} not found`, "ENTRY_NOT_FOUND", 404);
  }
}

export class InsufficientBalanceException extends DomainException {
  constructor() {
    super(
      "Insufficient balance for this operation",
      "INSUFFICIENT_BALANCE",
      400
    );
  }
}

export class AuthenticationException extends DomainException {
  constructor(message: string = "Authentication failed") {
    super(message, "AUTHENTICATION_FAILED", 401);
  }
}

export class AuthorizationException extends DomainException {
  constructor(message: string = "Not authorized to perform this action") {
    super(message, "AUTHORIZATION_FAILED", 403);
  }
}
```

### 2. Filtro Global de Exceções (NestJS)

```typescript
// src/infra/filters/global-exception.filter.ts

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private logger = new Logger("ExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Adicionar traceId para correlacionar logs de uma mesma requisição
    const traceId = request.headers["x-trace-id"] || randomUUID();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let code = "INTERNAL_ERROR";

    // Tratamento específico para nossas exceções de domínio
    if (exception instanceof DomainException) {
      status = exception.statusCode;
      message = exception.message;
      code = exception.code;
    }
    // Tratamento para validação do class-validator
    else if (
      exception instanceof ValidationError ||
      exception instanceof BadRequestException
    ) {
      status = HttpStatus.BAD_REQUEST;
      message =
        exception instanceof ValidationError
          ? this.formatValidationError(exception)
          : exception.message;
      code = "VALIDATION_ERROR";
    }
    // Tratamento para erros 404
    else if (exception instanceof NotFoundException) {
      status = HttpStatus.NOT_FOUND;
      message = exception.message;
      code = "NOT_FOUND";
    }

    // Log estruturado com todos os detalhes relevantes
    this.logger.error({
      message: `Exception: ${message}`,
      path: request.url,
      method: request.method,
      traceId,
      code,
      status,
      exception:
        exception instanceof Error ? exception.stack : String(exception),
    });

    // Resposta padronizada
    response.status(status).json({
      statusCode: status,
      message,
      code,
      timestamp: new Date().toISOString(),
      path: request.url,
      traceId,
    });
  }

  private formatValidationError(
    errors: ValidationError | ValidationError[]
  ): string {
    if (!Array.isArray(errors)) {
      errors = [errors];
    }

    const messages = errors.map((error) => {
      if (error.constraints) {
        return Object.values(error.constraints).join(", ");
      }
      return "Validation error";
    });

    return messages.join("; ");
  }
}
```

### 3. Internacionalização de Mensagens de Erro

```typescript
// i18n/error-messages.ts
export const errorMessages = {
  en: {
    INVALID_ENTRY: "Invalid entry data",
    ENTRY_NOT_FOUND: "Entry not found",
    INSUFFICIENT_BALANCE: "Insufficient balance for this operation",
    // outros códigos...
  },
  pt: {
    INVALID_ENTRY: "Dados de lançamento inválidos",
    ENTRY_NOT_FOUND: "Lançamento não encontrado",
    INSUFFICIENT_BALANCE: "Saldo insuficiente para esta operação",
    // outros códigos...
  },
};

// Serviço de tradução
@Injectable()
export class TranslationService {
  getErrorMessage(code: string, lang: string = "en"): string {
    const supportedLang = ["en", "pt"].includes(lang) ? lang : "en";
    return (
      errorMessages[supportedLang][code] || errorMessages["en"][code] || code
    );
  }
}
```

### 4. Middleware para Adicionar Trace ID

```typescript
// src/infra/middleware/trace-id.middleware.ts
@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Usar trace id existente ou gerar novo
    const traceId = req.headers["x-trace-id"] || randomUUID();
    req.headers["x-trace-id"] = traceId;
    res.setHeader("x-trace-id", traceId);
    next();
  }
}
```

### 5. Registrando no Módulo Principal

```typescript
// main.ts ou app.module.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Filtro global de exceções
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Middleware global
  app.use(new TraceIdMiddleware().use);

  // ...resto da configuração
}
```

## Exemplo de Uso nos Use Cases

```typescript
// src/data/usecases/db-add-entry.ts
@Injectable()
export class DbAddEntry implements AddEntry {
  constructor(private entryRepository: EntryRepository) {}

  async execute(data: AddEntryParams): Promise<EntryModel> {
    // Validação de negócios antes de persistir
    if (data.amount <= 0) {
      throw new InvalidEntryException("Amount must be greater than zero");
    }

    if (data.type !== "INCOME" && data.type !== "EXPENSE") {
      throw new InvalidEntryException("Type must be INCOME or EXPENSE");
    }

    // Tenta persistir, mas pode lançar outras exceções que serão tratadas pelo filtro global
    return await this.entryRepository.create(data);
  }
}
```
