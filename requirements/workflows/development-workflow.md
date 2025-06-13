# 🔄 Development Workflow - Complete Implementation Guide

Este workflow detalha o processo completo de desenvolvimento para implementação de novos casos de uso, seguindo todas as guidelines estabelecidas. É projetado para ser seguido à risca tanto por desenvolvedores humanos quanto por IAs.

## 📋 Pre-Development Checklist

### Environment Verification

- [ ] Development environment set up and running
- [ ] Database connection established
- [ ] Observability stack operational (`npm run obs:test`)
- [ ] All tests passing (`npm run test`)
- [ ] Git repository clean (`git status`)

### Documentation Review

- [ ] Use case specifications reviewed
- [ ] API requirements understood
- [ ] Database schema requirements clear
- [ ] Authentication requirements defined

## 🎯 Development Process Overview

```
Requirements Analysis → Design Phase → Domain Layer → Data Layer →
Infrastructure Layer → Presentation Layer → Testing → Integration →
Documentation → Quality Assurance → Deployment Preparation
```

## 📝 Phase 1: Requirements Analysis & Planning

### 1.1 Use Case Analysis

```bash
# Create feature branch
git checkout -b feature/[use-case-name]
git push -u origin feature/[use-case-name]
```

**Analysis Checklist:**

- [ ] Business requirements clearly defined
- [ ] API endpoints specifications documented
- [ ] Database changes identified
- [ ] Authentication/authorization requirements clear
- [ ] Validation rules defined
- [ ] Error scenarios mapped
- [ ] Success criteria established

### 1.2 Technical Design

Create technical design document:

```markdown
# Technical Design: [Use Case Name]

## Overview

[Brief description]

## API Specification

### Endpoint: [METHOD] /api/v1/[resource]

### Request/Response schemas

### Validation rules

### Authentication requirements

## Database Changes

### New entities/fields

### Migrations required

### Relationships

## Business Logic

### Domain rules

### Validation logic

### Error handling

## Testing Strategy

### Unit tests scope

### Integration tests scope

### E2E tests scope
```

## 🏗️ Phase 2: Domain Layer Implementation

### 2.1 Domain Entities

**Location**: `src/domain/models/`

**Implementation Pattern:**

```typescript
// src/domain/models/[entity].model.ts
export interface [Entity] {
  id: string;
  // Core business properties
  createdAt: Date;
  updatedAt: Date;
}

export interface [Entity]CreateData {
  // Properties needed for creation
}

export interface [Entity]UpdateData {
  // Properties that can be updated
}
```

**Checklist:**

- [ ] Entity interfaces defined with proper typing
- [ ] Create/Update data interfaces defined
- [ ] Business validation rules documented
- [ ] Relationships properly typed

### 2.2 Use Cases (Business Logic)

**Location**: `src/domain/usecases/`

**Implementation Pattern:**

```typescript
// src/domain/usecases/[action]-[entity].usecase.ts
export interface [Action][Entity]UseCase {
  execute(data: [Action][Entity]Data): Promise<[ReturnType]>;
}

export interface [Action][Entity]Data {
  // Input data structure
}
```

**Implementation Guidelines:**

- [ ] Interface-first approach
- [ ] Single responsibility principle
- [ ] Clear input/output types
- [ ] Error scenarios defined
- [ ] Business rules encapsulated

### 2.3 Domain Validation

```typescript
// src/domain/protocols/validation.protocol.ts
export interface ValidationProtocol<T> {
  validate(data: T): ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
```

## 🔧 Phase 3: Data Layer Implementation

### 3.1 Data Protocols

**Location**: `src/data/protocols/`

**Implementation Pattern:**

```typescript
// src/data/protocols/[entity]-repository.protocol.ts
export interface [Entity]Repository {
  create(data: [Entity]CreateData): Promise<[Entity]>;
  findById(id: string): Promise<[Entity] | null>;
  findByUserId(userId: string): Promise<[Entity][]>;
  update(id: string, data: [Entity]UpdateData): Promise<[Entity]>;
  delete(id: string): Promise<void>;
}
```

**Checklist:**

- [ ] Repository interfaces defined
- [ ] CRUD operations covered
- [ ] User isolation methods included
- [ ] Query methods for business needs
- [ ] Error handling defined

### 3.2 Use Cases Implementation

**Location**: `src/data/usecases/`

**Implementation Pattern:**

```typescript
// src/data/usecases/[action]-[entity].usecase.ts
export class [Action][Entity]UseCase implements [Action][Entity]UseCase {
  constructor(
    private readonly [entity]Repository: [Entity]Repository,
    private readonly validation: ValidationProtocol<[Action][Entity]Data>
  ) {}

  async execute(data: [Action][Entity]Data): Promise<[ReturnType]> {
    // 1. Validate input
    const validationResult = this.validation.validate(data);
    if (!validationResult.isValid) {
      throw new ValidationError(validationResult.errors);
    }

    // 2. Business logic
    // 3. Repository operations
    // 4. Return result
  }
}
```

**Implementation Guidelines:**

- [ ] Input validation first
- [ ] Business rules enforcement
- [ ] Repository pattern usage
- [ ] Error handling with proper types
- [ ] Logging for business events
- [ ] Metrics recording

## 🏛️ Phase 4: Infrastructure Layer Implementation

### 4.1 Database Entities

**Location**: `src/infra/db/typeorm/entities/`

**Implementation Pattern:**

```typescript
// src/infra/db/typeorm/entities/[entity].entity.ts
@Entity('[table_name]')
export class [Entity]Entity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  // Business properties with proper decorators

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships with proper decorators
}
```

**Checklist:**

- [ ] Entity decorators properly configured
- [ ] User isolation via userId column
- [ ] Proper indexes defined
- [ ] Relationships configured
- [ ] Validation decorators applied

### 4.2 Repository Implementation

**Location**: `src/infra/db/typeorm/repositories/`

**Implementation Pattern:**

```typescript
// src/infra/db/typeorm/repositories/[entity].repository.ts
@Injectable()
export class [Entity]Repository implements [Entity]Repository {
  constructor(
    @InjectRepository([Entity]Entity)
    private readonly repository: Repository<[Entity]Entity>,
    private readonly logger: ContextAwareLoggerService,
    private readonly metrics: MetricsService
  ) {}

  async create(data: [Entity]CreateData): Promise<[Entity]> {
    const timer = this.metrics.startTimer('database_operation');

    try {
      const entity = this.repository.create(data);
      const saved = await this.repository.save(entity);

      this.logger.logBusinessEvent({
        event: '[entity]_created',
        entityId: saved.id,
        userId: data.userId
      });

      timer({ operation: 'create', entity: '[entity]', status: 'success' });
      return this.mapToModel(saved);
    } catch (error) {
      timer({ operation: 'create', entity: '[entity]', status: 'error' });
      this.logger.error(`Failed to create [entity]`, error.stack);
      throw error;
    }
  }

  private mapToModel(entity: [Entity]Entity): [Entity] {
    // Map entity to domain model
  }
}
```

**Implementation Guidelines:**

- [ ] Dependency injection properly configured
- [ ] Logging for all operations
- [ ] Metrics recording
- [ ] Error handling and logging
- [ ] Entity to model mapping
- [ ] User context preservation

### 4.3 Database Migration

```bash
# Generate migration
npm run migration:generate src/infra/db/typeorm/migrations/[MigrationName]

# Review generated migration
# Edit if necessary

# Run migration
npm run migration:run
```

**Migration Checklist:**

- [ ] Migration generated and reviewed
- [ ] Indexes added for performance
- [ ] Foreign key constraints defined
- [ ] Default values set appropriately
- [ ] Migration tested in development

## 🎨 Phase 5: Presentation Layer Implementation

### 5.1 DTOs (Data Transfer Objects)

**Location**: `src/presentation/dtos/`

**Implementation Pattern:**

```typescript
// src/presentation/dtos/[action]-[entity].dto.ts
export class [Action][Entity]Dto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Property description' })
  property: string;

  @IsNumber()
  @IsPositive()
  @ApiProperty({ description: 'Amount in cents' })
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiProperty({ description: 'Optional description', required: false })
  description?: string;
}

export class [Entity]ResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  property: string;

  @ApiProperty()
  createdAt: Date;
}
```

**Validation Guidelines:**

- [ ] All fields properly validated
- [ ] API documentation decorators
- [ ] Optional fields marked correctly
- [ ] Custom validation for business rules
- [ ] Consistent naming conventions

### 5.2 Controllers

**Location**: `src/presentation/controllers/`

**Implementation Pattern:**

```typescript
// src/presentation/controllers/[entity].controller.ts
@Controller('[entities]')
@ApiTags('[entities]')
@UseGuards(JwtAuthGuard)
export class [Entity]Controller {
  constructor(
    private readonly [action][Entity]UseCase: [Action][Entity]UseCase,
    private readonly logger: ContextAwareLoggerService,
    private readonly metrics: MetricsService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create [entity]' })
  @ApiResponse({ status: 201, type: [Entity]ResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createDto: [Action][Entity]Dto,
    @Request() req: any
  ): Promise<[Entity]ResponseDto> {
    const timer = this.metrics.startTimer('http_request_duration');

    try {
      const [entity] = await this.[action][Entity]UseCase.execute({
        ...createDto,
        userId: req.user.userId
      });

      this.logger.logBusinessEvent({
        event: '[entity]_api_create_success',
        entityId: [entity].id,
        userId: req.user.userId,
        traceId: req.traceId
      });

      timer({ method: 'POST', route: '/[entities]', status: 'success' });
      return this.mapToResponseDto([entity]);
    } catch (error) {
      timer({ method: 'POST', route: '/[entities]', status: 'error' });

      this.logger.logSecurityEvent({
        event: '[entity]_api_create_failed',
        severity: 'medium',
        userId: req.user.userId,
        error: error.message,
        traceId: req.traceId
      });

      throw error;
    }
  }

  private mapToResponseDto([entity]: [Entity]): [Entity]ResponseDto {
    // Map domain model to response DTO
  }
}
```

**Controller Guidelines:**

- [ ] Proper decorators for API documentation
- [ ] Authentication guards applied
- [ ] Validation pipes configured
- [ ] Error handling implemented
- [ ] Logging and metrics
- [ ] User context extraction
- [ ] Response mapping

### 5.3 Error Handling

**Location**: `src/presentation/filters/`

**Implementation Pattern:**

```typescript
// Custom exception filters for specific errors
@Catch(ValidationError)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: ValidationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = HttpStatus.BAD_REQUEST;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: "Validation failed",
      errors: exception.errors,
    });
  }
}
```

## 🧪 Phase 6: Testing Implementation

### 6.1 Unit Tests Structure

```bash
# Test files mirror source structure
test/
├── data/usecases/[action]-[entity].usecase.spec.ts
├── infra/db/typeorm/repositories/[entity].repository.spec.ts
└── presentation/controllers/[entity].controller.spec.ts
```

### 6.2 Use Case Unit Tests

**Location**: `test/data/usecases/`

**Implementation Pattern:**

```typescript
// test/data/usecases/[action]-[entity].usecase.spec.ts
describe('[Action][Entity]UseCase', () => {
  let useCase: [Action][Entity]UseCase;
  let mockRepository: jest.Mocked<[Entity]Repository>;
  let mockValidation: jest.Mocked<ValidationProtocol<[Action][Entity]Data>>;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      // ... other methods
    };

    mockValidation = {
      validate: jest.fn()
    };

    useCase = new [Action][Entity]UseCase(mockRepository, mockValidation);
  });

  describe('execute', () => {
    it('should create [entity] with valid data', async () => {
      // Arrange
      const inputData = {
        // test data
      };

      mockValidation.validate.mockReturnValue({
        isValid: true,
        errors: []
      });

      mockRepository.create.mockResolvedValue(/* expected entity */);

      // Act
      const result = await useCase.execute(inputData);

      // Assert
      expect(result).toEqual(/* expected result */);
      expect(mockRepository.create).toHaveBeenCalledWith(inputData);
    });

    it('should throw validation error for invalid data', async () => {
      // Test validation failure
    });

    it('should handle repository errors', async () => {
      // Test error scenarios
    });
  });
});
```

### 6.3 Repository Integration Tests

**Implementation Pattern:**

```typescript
// test/infra/db/typeorm/repositories/[entity].repository.spec.ts
describe('[Entity]Repository', () => {
  let repository: [Entity]Repository;
  let testingModule: TestingModule;
  let dataSource: DataSource;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [[Entity]Entity],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([[Entity]Entity]),
      ],
      providers: [
        [Entity]Repository,
        ContextAwareLoggerService,
        MetricsService,
      ],
    }).compile();

    repository = testingModule.get<[Entity]Repository>([Entity]Repository);
    dataSource = testingModule.get<DataSource>(DataSource);
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('should create [entity] successfully', async () => {
    // Integration test implementation
  });
});
```

### 6.4 Controller E2E Tests

**Implementation Pattern:**

```typescript
// test/presentation/controllers/[entity].controller.e2e-spec.ts
describe("[Entity]Controller (e2e)", () => {
  let app: INestApplication;
  let authToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Setup authentication token
    authToken = await getAuthToken(app);
  });

  it("/[entities] (POST)", () => {
    return request(app.getHttpServer())
      .post("/api/v1/[entities]")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        // test data
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty("id");
        expect(res.body.property).toBe("expected value");
      });
  });

  it("/[entities] (POST) should return 400 for invalid data", () => {
    return request(app.getHttpServer())
      .post("/api/v1/[entities]")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        // invalid test data
      })
      .expect(400);
  });
});
```

**Testing Checklist:**

- [ ] Unit tests for all use cases
- [ ] Repository integration tests
- [ ] Controller E2E tests
- [ ] Validation scenarios covered
- [ ] Error scenarios tested
- [ ] Authentication tests included
- [ ] Edge cases covered

## 🔗 Phase 7: Module Integration

### 7.1 Feature Module Creation

**Location**: `src/main/modules/`

**Implementation Pattern:**

```typescript
// src/main/modules/[entity].module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([[Entity]Entity]),
  ],
  controllers: [[Entity]Controller],
  providers: [
    [Entity]Repository,
    [Action][Entity]UseCase,
    [Entity]ValidationProtocol,
    // Factory providers if needed
  ],
  exports: [[Entity]Repository, [Action][Entity]UseCase],
})
export class [Entity]Module {}
```

### 7.2 App Module Integration

```typescript
// src/main/modules/app.module.ts
@Module({
  imports: [
    // ... existing modules
    [Entity]Module,
  ],
  // ...
})
export class AppModule {}
```

**Integration Checklist:**

- [ ] Feature module created and configured
- [ ] Dependencies properly injected
- [ ] Module exported services as needed
- [ ] App module updated with new feature module

## 📊 Phase 8: Observability Implementation

### 8.1 Business Metrics

Add domain-specific metrics:

```typescript
// In the metrics service, add business metrics
private readonly [entity]Metrics: Counter<string>;

constructor() {
  this.[entity]Metrics = new Counter({
    name: '[entity]_operations_total',
    help: 'Total [entity] operations',
    labelNames: ['operation', 'status', 'user_type']
  });
}

record[Entity]Operation(operation: string, status: string, userType?: string) {
  this.[entity]Metrics.inc({ operation, status, user_type: userType || 'regular' });
}
```

### 8.2 Logging Enhancement

```typescript
// Add business event logging
this.logger.logBusinessEvent({
  event: "[entity]_[operation]",
  entityId: entity.id,
  userId: user.id,
  duration: operationDuration,
  metadata: {
    // relevant business data
  },
});
```

### 8.3 Dashboard Updates

Update Grafana dashboard to include new metrics:

```json
{
  "title": "[Entity] Operations Rate",
  "type": "timeseries",
  "targets": [
    {
      "expr": "rate([entity]_operations_total[5m])",
      "legendFormat": "{{operation}} - {{status}}"
    }
  ]
}
```

## 📚 Phase 9: Documentation

### 9.1 API Documentation

- [ ] Swagger/OpenAPI documentation updated
- [ ] Request/response examples added
- [ ] Error codes documented
- [ ] Authentication requirements specified

### 9.2 Technical Documentation

Update relevant documentation files:

- [ ] Use case specifications updated
- [ ] Database schema documented
- [ ] API endpoints documented
- [ ] Business rules documented

### 9.3 Code Documentation

- [ ] JSDoc comments for public methods
- [ ] Complex business logic explained
- [ ] Edge cases documented
- [ ] Performance considerations noted

## 🔍 Phase 10: Quality Assurance

### 10.1 Code Quality Checks

```bash
# Run all quality checks
npm run lint
npm run test
npm run test:cov
npm run test:e2e

# Check observability
npm run obs:test

# Manual API testing
curl -X POST http://localhost:3000/api/v1/[entities] \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### 10.2 Performance Validation

- [ ] Database queries optimized
- [ ] API response times acceptable
- [ ] Memory usage within limits
- [ ] No N+1 query problems

### 10.3 Security Validation

- [ ] Authentication properly implemented
- [ ] Authorization rules enforced
- [ ] Input validation comprehensive
- [ ] SQL injection protection verified
- [ ] Sensitive data not logged

## 🚀 Phase 11: Deployment Preparation

### 11.1 Migration Preparation

```bash
# Verify migrations
npm run migration:run --dry-run

# Test rollback
npm run migration:revert
npm run migration:run
```

### 11.2 Environment Configuration

- [ ] Environment variables documented
- [ ] Production configurations reviewed
- [ ] Observability configured for production
- [ ] Database connections validated

### 11.3 Monitoring Setup

- [ ] Alerts configured for new endpoints
- [ ] Dashboard updated with new metrics
- [ ] Log retention policies applied
- [ ] Error tracking configured

## 📋 Final Validation Checklist

### Functionality

- [ ] All happy path scenarios work
- [ ] Error scenarios handled gracefully
- [ ] Validation rules enforced
- [ ] Authentication/authorization working

### Quality

- [ ] Test coverage > 80%
- [ ] No linting errors
- [ ] No TypeScript errors
- [ ] Performance benchmarks met

### Observability

- [ ] Logs are structured and meaningful
- [ ] Metrics are collected correctly
- [ ] Health checks include new functionality
- [ ] Dashboards show relevant data

### Documentation

- [ ] API documentation complete
- [ ] Code documented appropriately
- [ ] Technical specs updated
- [ ] Deployment guide updated

## 🔄 Post-Implementation

### 11.1 Code Review Process

1. **Self Review**: Complete self-review using checklist
2. **Peer Review**: Submit PR with detailed description
3. **Architecture Review**: If introducing new patterns
4. **Security Review**: For authentication/authorization changes

### 11.2 Monitoring Post-Deployment

1. **Immediate**: Watch metrics and logs for 1 hour
2. **Short-term**: Monitor for 24 hours
3. **Long-term**: Weekly review for first month

### 11.3 Continuous Improvement

- [ ] Performance metrics baseline established
- [ ] User feedback mechanisms in place
- [ ] Technical debt items documented
- [ ] Future enhancement opportunities noted

---

## 🎯 Guidelines for AI Assistants

When following this workflow as an AI:

1. **Always start with Phase 1** - Never skip requirements analysis
2. **Follow the exact order** - Each phase builds on the previous
3. **Implement all checklist items** - Don't skip any validation steps
4. **Use the exact patterns shown** - Consistency is crucial
5. **Add comprehensive logging and metrics** - Observability is mandatory
6. **Write tests for everything** - No code without tests
7. **Update documentation always** - Keep docs in sync with code
8. **Ask for clarification** if requirements are unclear
9. **Suggest improvements** to the workflow when appropriate
10. **Validate everything** before considering the task complete

## 🎓 Guidelines for Human Developers

1. **Read the full workflow** before starting any feature
2. **Follow the guidelines religiously** - They exist for good reasons
3. **Don't skip testing phases** - Quality is not negotiable
4. **Update observability** - Monitoring helps everyone
5. **Document as you go** - Don't leave it for later
6. **Review your own work** using the checklists
7. **Ask for help** when patterns are unclear
8. **Contribute improvements** to the workflow
9. **Share knowledge** with the team
10. **Celebrate completion** - You've built something robust!

This workflow ensures consistent, high-quality, and maintainable code that follows all established guidelines and best practices. Every implementation should result in production-ready, well-tested, and properly monitored functionality.
