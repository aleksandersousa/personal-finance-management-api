# 🧪 Testing Guidelines - Personal Financial Management API

## Overview

This document outlines comprehensive testing guidelines for the Personal Financial Management API project, emphasizing Test-Driven Development (TDD) practices and ensuring high code quality through systematic testing approaches.

## 🎯 Testing Philosophy

### Test-Driven Development (TDD)

We follow the **Red-Green-Refactor** cycle:

1. **🔴 RED**: Write a failing test
2. **🟢 GREEN**: Write minimal code to pass
3. **🔵 REFACTOR**: Improve code while keeping tests green

### Testing Pyramid

```
    /\
   /  \     E2E Tests (Few)
  /____\
 /      \   Integration Tests (Some)
/__________\ Unit Tests (Many)
```

- **Unit Tests (70%)**: Fast, isolated, test single components
- **Integration Tests (20%)**: Test component interactions
- **E2E Tests (10%)**: Test complete user workflows

## 📋 Test Categories

### 1. Unit Tests

**Purpose**: Test individual components in isolation

**Scope**:

- Domain entities and value objects
- Use cases (business logic)
- Individual methods and functions
- Utilities and helpers

**Characteristics**:

- Fast execution (< 100ms per test)
- No external dependencies
- Mock all dependencies
- Test one behavior per test

**Example**:

```typescript
describe('DbUpdateEntryUseCase', () => {
  describe('execute', () => {
    it('should update entry when valid data provided', async () => {
      // Arrange
      const entryData = MockEntryFactory.createUpdateRequest();
      const existingEntry = MockEntryFactory.createExisting();
      const updatedEntry = MockEntryFactory.createUpdated();

      entryRepository.findById.mockResolvedValue(existingEntry);
      entryRepository.update.mockResolvedValue(updatedEntry);

      // Act
      const result = await useCase.execute(entryData);

      // Assert
      expect(result).toEqual(updatedEntry);
      expect(entryRepository.update).toHaveBeenCalledWith(
        entryData.id,
        expect.objectContaining({
          amount: entryData.amount,
          description: entryData.description,
        }),
      );
    });
  });
});
```

### 2. Integration Tests

**Purpose**: Test component interactions and data flow

**Scope**:

- Repository implementations with database
- Controller endpoints with use cases
- Service integrations
- Module configurations

**Characteristics**:

- Moderate execution time (< 1s per test)
- Use real implementations where possible
- Mock external services only
- Test data persistence and retrieval

**Example**:

```typescript
describe('TypeormEntryRepository Integration', () => {
  let repository: TypeormEntryRepository;
  let testingModule: TestingModule;

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot(testDbConfig)],
      providers: [TypeormEntryRepository /* other providers */],
    }).compile();

    repository = testingModule.get<TypeormEntryRepository>(
      TypeormEntryRepository,
    );
  });

  it('should persist entry to database', async () => {
    // Arrange
    const entryData = MockEntryFactory.createData();

    // Act
    const savedEntry = await repository.create(entryData);

    // Assert
    expect(savedEntry.id).toBeDefined();

    const foundEntry = await repository.findById(savedEntry.id);
    expect(foundEntry).toEqual(savedEntry);
  });
});
```

### 3. E2E Tests

**Purpose**: Test complete user workflows from API to database

**Scope**:

- Full API request/response cycles
- Authentication flows
- Database persistence verification
- Error handling scenarios

**Characteristics**:

- Slower execution (< 5s per test)
- Use real database (test environment)
- Test complete user journeys
- Verify business requirements

**Example**:

```typescript
describe('Entry Management E2E', () => {
  let app: INestApplication;
  let authToken: string;

  beforeEach(async () => {
    app = await createTestApp();
    authToken = await getAuthToken(app);
  });

  it('should create, update, and retrieve entry', async () => {
    // Create entry
    const createResponse = await request(app.getHttpServer())
      .post('/entries')
      .set('Authorization', `Bearer ${authToken}`)
      .send(MockEntryFactory.createRequest())
      .expect(201);

    const entryId = createResponse.body.id;

    // Update entry
    const updateData = MockEntryFactory.createUpdateRequest();
    await request(app.getHttpServer())
      .put(`/entries/${entryId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData)
      .expect(200);

    // Verify update
    const getResponse = await request(app.getHttpServer())
      .get(`/entries?month=2024-01`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const updatedEntry = getResponse.body.data.find(e => e.id === entryId);
    expect(updatedEntry.amount).toBe(updateData.amount);
  });
});
```

## 🏗️ Test Structure and Organization

### Directory Structure

```
test/
├── domain/
│   ├── mocks/
│   │   ├── entities/
│   │   └── factories/
│   └── usecases/
├── data/
│   ├── mocks/
│   │   ├── repositories/
│   │   └── factories/
│   └── usecases/
├── infra/
│   ├── db/
│   ├── implementations/
│   └── mocks/
├── presentation/
│   ├── controllers/
│   ├── dtos/
│   └── mocks/
└── e2e/
    ├── auth/
    ├── entries/
    └── utils/
```

### Naming Conventions

**Test Files**:

- Unit tests: `[component].spec.ts`
- Integration tests: `[component].integration.spec.ts`
- E2E tests: `[feature].e2e.spec.ts`

**Test Descriptions**:

```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should return expected result when valid input provided', () => {});
    it('should throw error when invalid input provided', () => {});
    it('should handle edge case scenario', () => {});
  });
});
```

## 🎭 Mocking Strategy

### Mock Hierarchy

1. **Domain Layer**: No mocks (pure functions)
2. **Data Layer**: Mock repositories and external services
3. **Infrastructure Layer**: Mock external dependencies only
4. **Presentation Layer**: Mock use cases and services

### Mock Factories

Create reusable mock factories for consistent test data:

```typescript
// test/domain/mocks/factories/entry-mock.factory.ts
export class MockEntryFactory {
  static createValid(): EntryModel {
    return {
      id: 'entry-123',
      userId: 'user-123',
      amount: 1000,
      description: 'Test Entry',
      type: 'INCOME',
      isFixed: false,
      categoryId: null,
      date: new Date('2024-01-15'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static createUpdateRequest(): UpdateEntryRequest {
    return {
      id: 'entry-123',
      userId: 'user-123',
      amount: 1500,
      description: 'Updated Entry',
      type: 'INCOME',
      isFixed: true,
      categoryId: 'category-123',
      date: new Date('2024-01-15'),
    };
  }

  static createWithOverrides(overrides: Partial<EntryModel>): EntryModel {
    return { ...this.createValid(), ...overrides };
  }
}
```

### Repository Stubs

Create controllable repository implementations for testing:

```typescript
// test/data/mocks/repositories/entry-repository.stub.ts
export class EntryRepositoryStub implements EntryRepository {
  private entries: Map<string, EntryModel> = new Map();
  private shouldFail = false;
  private errorToThrow: Error | null = null;

  async create(data: CreateEntryData): Promise<EntryModel> {
    if (this.shouldFail && this.errorToThrow) {
      throw this.errorToThrow;
    }

    const entry = MockEntryFactory.createWithOverrides(data);
    this.entries.set(entry.id, entry);
    return entry;
  }

  // Test utility methods
  mockFailure(error: Error): void {
    this.shouldFail = true;
    this.errorToThrow = error;
  }

  mockSuccess(): void {
    this.shouldFail = false;
    this.errorToThrow = null;
  }
}
```

## 📊 Test Coverage Requirements

### Coverage Targets

- **Overall**: 90% minimum
- **Domain Layer**: 100% (business logic is critical)
- **Data Layer**: 95% (use cases and validation)
- **Infrastructure Layer**: 85% (database and external services)
- **Presentation Layer**: 90% (controllers and DTOs)

### Coverage Commands

```bash
# Run tests with coverage
yarn test:cov

# Generate HTML coverage report
yarn test:cov:html

# Check coverage thresholds
yarn test:cov:check
```

### Coverage Configuration

```json
// jest.config.js
{
  "coverageThreshold": {
    "global": {
      "branches": 90,
      "functions": 90,
      "lines": 90,
      "statements": 90
    },
    "./src/domain/": {
      "branches": 100,
      "functions": 100,
      "lines": 100,
      "statements": 100
    }
  }
}
```

## 🚀 Test Execution Strategy

### Test Scripts

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:unit": "jest --testPathPattern=spec.ts",
    "test:integration": "jest --testPathPattern=integration.spec.ts",
    "test:e2e": "jest --testPathPattern=e2e.spec.ts",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand"
  }
}
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: yarn install

      - name: Run unit tests
        run: yarn test:unit

      - name: Run integration tests
        run: yarn test:integration

      - name: Run E2E tests
        run: yarn test:e2e

      - name: Check coverage
        run: yarn test:cov:check
```

## 🔧 Test Utilities and Helpers

### Database Test Utilities

```typescript
// test/utils/database.util.ts
export class DatabaseTestUtil {
  static async clearDatabase(connection: Connection): Promise<void> {
    const entities = connection.entityMetadatas;
    for (const entity of entities) {
      const repository = connection.getRepository(entity.name);
      await repository.clear();
    }
  }

  static async seedTestData(connection: Connection): Promise<void> {
    // Seed common test data
  }
}
```

### Authentication Test Utilities

```typescript
// test/utils/auth.util.ts
export class AuthTestUtil {
  static async createTestUser(app: INestApplication): Promise<UserModel> {
    const authService = app.get(AuthService);
    return authService.register({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
  }

  static async getAuthToken(
    app: INestApplication,
    user?: UserModel,
  ): Promise<string> {
    const testUser = user || (await this.createTestUser(app));
    const authService = app.get(AuthService);
    const tokens = await authService.login({
      email: testUser.email,
      password: 'password123',
    });
    return tokens.accessToken;
  }
}
```

## 📝 Test Documentation

### Test Case Documentation

Each test should clearly document:

1. **Purpose**: What behavior is being tested
2. **Setup**: What conditions are established
3. **Action**: What operation is performed
4. **Verification**: What outcome is expected

```typescript
describe('DbUpdateEntryUseCase', () => {
  describe('execute', () => {
    /**
     * Test Purpose: Verify that the use case successfully updates an entry
     * when provided with valid data and the user owns the entry.
     *
     * Setup: Mock repository with existing entry owned by the user
     * Action: Execute use case with valid update data
     * Verification: Entry is updated with new values and returned
     */
    it('should update entry when user owns entry and data is valid', async () => {
      // Test implementation
    });
  });
});
```

### Test Scenarios Matrix

Document all test scenarios for complex features:

| Scenario        | Input             | Expected Output   | Test Type |
| --------------- | ----------------- | ----------------- | --------- |
| Valid update    | Valid entry data  | Updated entry     | Unit      |
| Invalid amount  | Negative amount   | ValidationError   | Unit      |
| Entry not found | Non-existent ID   | NotFoundError     | Unit      |
| Unauthorized    | Different user ID | UnauthorizedError | Unit      |

## 🎯 Best Practices

### Do's ✅

1. **Write tests first** (TDD approach)
2. **Test behavior, not implementation**
3. **Use descriptive test names**
4. **Keep tests simple and focused**
5. **Mock external dependencies**
6. **Use factory patterns for test data**
7. **Test edge cases and error scenarios**
8. **Maintain test independence**

### Don'ts ❌

1. **Don't test implementation details**
2. **Don't write tests that depend on other tests**
3. **Don't mock what you don't own (in unit tests)**
4. **Don't ignore failing tests**
5. **Don't write tests without assertions**
6. **Don't use production data in tests**
7. **Don't skip error scenario testing**
8. **Don't write overly complex test setups**

## 🔍 Debugging Tests

### Common Issues and Solutions

1. **Flaky Tests**:

   - Ensure test independence
   - Use proper async/await
   - Clear state between tests

2. **Slow Tests**:

   - Mock external dependencies
   - Use in-memory databases for integration tests
   - Optimize test data setup

3. **Hard to Understand Tests**:
   - Use descriptive names
   - Follow AAA pattern
   - Add comments for complex scenarios

### Debugging Tools

```bash
# Debug specific test
yarn test:debug --testNamePattern="should update entry"

# Run tests in watch mode
yarn test:watch

# Run tests with verbose output
yarn test --verbose
```

## 📈 Continuous Improvement

### Test Metrics to Track

1. **Coverage percentage**
2. **Test execution time**
3. **Number of flaky tests**
4. **Test maintenance effort**

### Regular Reviews

- **Weekly**: Review failing tests and flaky tests
- **Monthly**: Analyze test coverage and identify gaps
- **Quarterly**: Review test architecture and refactor if needed

This comprehensive testing strategy ensures high code quality, maintainability, and confidence in our financial management system.
