# 🚀 New API Setup Boilerplate Workflow

## Overview

Este workflow fornece um guia passo-a-passo para criar uma nova API do zero seguindo todas as guidelines estabelecidas. Ideal para iniciar novos projetos ou para IAs automatizarem a criação de APIs.

### 🆕 Latest Technology Versions

Este boilerplate utiliza as versões mais recentes e estáveis das tecnologias:

- **Node.js**: 22.16.0 (LTS) - Versão mais recente com suporte de longo prazo
- **PostgreSQL**: 17.5 - Versão mais recente com melhorias de performance e novos recursos
- **Yarn**: Gerenciador de dependências padrão para melhor performance e confiabilidade
- **TypeScript**: Configurado com as melhores práticas para Node.js 22+
- **Docker**: Imagens Alpine otimizadas para produção

## 📋 Prerequisites Checklist

### Environment Setup

- [ ] Node.js 22+ (LTS) installed
- [ ] PostgreSQL 17+ installed
- [ ] Docker and Docker Compose installed
- [ ] Git configured
- [ ] Yarn package manager installed
- [ ] IDE/Editor configured (VS Code recommended)

### Planning Phase

- [ ] Domain requirements defined
- [ ] API specification outlined
- [ ] Database design completed
- [ ] Authentication strategy decided

## 🏗️ Phase 1: Project Initialization

### 1.1 Create Project Structure

```bash
# Create project directory
mkdir my-new-api && cd my-new-api

# Initialize Git repository following Git workflow guidelines
git init
git branch -m main

# Create branch structure for proper Git workflow
git checkout -b develop
git checkout -b staging
git checkout develop

# Initialize Node.js project with Yarn
yarn init -y

# Install NestJS CLI globally
yarn global add @nestjs/cli

# Create NestJS application using Yarn
nest new . --package-manager yarn --skip-git
```

### 1.2 Install Core Dependencies

```bash
# Core NestJS dependencies
yarn add @nestjs/common @nestjs/core @nestjs/platform-express
yarn add @nestjs/config @nestjs/swagger @nestjs/throttler
yarn add @nestjs/typeorm @nestjs/jwt @nestjs/passport

# Database and ORM (PostgreSQL 17+ compatible)
yarn add typeorm pg@^8.11.0 @types/pg

# Authentication
yarn add passport passport-jwt passport-local
yarn add bcrypt @types/bcrypt
yarn add @types/passport-jwt @types/passport-local

# Validation and transformation
yarn add class-validator class-transformer

# Utilities
yarn add helmet uuid @types/uuid
yarn add reflect-metadata rxjs

# Observability
yarn add prom-client winston

# Development dependencies
yarn add -D @nestjs/testing @nestjs/cli
yarn add -D @types/jest @types/node @types/express
yarn add -D jest ts-jest supertest @types/supertest
yarn add -D typescript ts-node tsconfig-paths
yarn add -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
yarn add -D eslint eslint-config-prettier eslint-plugin-prettier
yarn add -D prettier source-map-support

# 🔒 Pre-commit hooks and quality gates
yarn add -D husky lint-staged
yarn add -D @commitlint/cli @commitlint/config-conventional

# ⚠️ OPCIONAL: Apenas se usar SQLite para testes (NÃO recomendado)
# yarn add -D sqlite3

# ⚠️ IMPORTANTE: Versões específicas para compatibilidade
yarn add -D @types/pg@^8.10.9
```

### 1.3 Create Directory Structure

```bash
# Create Clean Architecture structure
mkdir -p src/{data,domain,infra,main,presentation}
mkdir -p src/data/{protocols,usecases}
mkdir -p src/domain/{models,usecases}
mkdir -p src/infra/{db,implementations,logging,metrics,middleware}
mkdir -p src/infra/db/typeorm/{config,entities,repositories}
mkdir -p src/main/{factories,modules}
mkdir -p src/presentation/{controllers,decorators,dtos,filters,guards,interceptors,strategies}

# Create test structure
mkdir -p test/{data,infra,presentation}
mkdir -p test/data/usecases
mkdir -p test/infra/{logging,metrics}
mkdir -p test/presentation/controllers

# Create configuration directories
mkdir -p {docs,requirements,scripts}
mkdir -p requirements/{guidelines,workflows}
mkdir -p observability/grafana/{provisioning,dashboards}
mkdir -p observability/grafana/provisioning/{datasources,dashboards}

# Create logs directory
mkdir -p logs
```

## 🔄 Phase 2: Git Workflow Setup

### 2.1 Branch Structure Configuration

Following the Git workflow guidelines, establish the three-branch structure:

```bash
# Ensure you're on develop branch
git checkout develop

# Create initial commit structure
git add .
git commit -m "feat: initial project setup with NestJS boilerplate

- Initialize NestJS application
- Setup TypeScript configuration
- Add basic project structure
- Configure package.json with core dependencies"

# Push develop branch
git push -u origin develop

# Setup staging branch
git checkout staging
git push -u origin staging

# Setup main branch for production
git checkout main
git push -u origin main

# Return to develop for development work
git checkout develop
```

### 2.2 Git Workflow Guidelines

**Branch Purpose:**

- **`main`**: Production-ready code only
- **`staging`**: Pre-production testing and validation
- **`develop`**: Integration branch for development

**Development Flow:**

1. All feature branches created from `develop`
2. Features merged back to `develop` via PR
3. `develop` merged to `staging` for testing
4. `staging` merged to `main` for production releases

**Commit Standards:**

- Follow Conventional Commits specification
- Use meaningful commit messages
- Commit frequently with small, focused changes

### ⚠️ CONFIGURAÇÃO CRÍTICA: Git User e Permissões

**Problema comum:** Não conseguir fazer commits por falta de configuração

```bash
# ✅ OBRIGATÓRIO: Configurar usuário Git
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@exemplo.com"

# ✅ Para projetos específicos (recomendado)
git config user.name "Seu Nome"
git config user.email "seu.email@exemplo.com"

# ✅ Verificar configuração
git config --list | grep user

# ✅ Se usando SSH, verificar chaves
ssh -T git@github.com

# ✅ Se usando HTTPS, configurar credenciais
git config --global credential.helper store
```

**Problemas de permissão resolvidos:**

- `Please tell me who you are` → Configurar user.name e user.email
- `Permission denied (publickey)` → Configurar SSH keys ou usar HTTPS
- `Authentication failed` → Configurar token GitHub para HTTPS

## 🔒 Phase 3: Quality Gates Setup (Husky)

### 3.1 Install Husky and Pre-commit Tools

```bash
# Install Husky and related tools
yarn add -D husky lint-staged @commitlint/cli @commitlint/config-conventional

# Initialize Husky
npx husky install

# Add Husky scripts to package.json
yarn set-script prepare "husky install"
```

### 3.2 Configure Pre-commit Hooks

Create `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit quality checks..."

# Run linting
echo "📝 Checking code style..."
yarn lint

# Run all tests (unit + e2e)
echo "🧪 Running all tests..."
yarn test

echo "🚀 Running E2E tests..."
yarn test:e2e

# Check test coverage (must be 100%)
echo "📊 Checking test coverage..."
yarn test:coverage --passWithNoTests

# Build verification
echo "🏗️ Verifying build..."
yarn build

echo "✅ All quality checks passed!"
```

Create `.husky/pre-push`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🚀 Running pre-push quality gates..."

# Final verification - all tests must pass
echo "🔬 Final test verification..."
yarn test:all

# Coverage must be 100%
echo "📈 Final coverage check..."
yarn test:coverage --passWithNoTests --coverageThreshold='{"global":{"branches":100,"functions":100,"lines":100,"statements":100}}'

echo "✅ Ready to push!"
```

Create `.husky/commit-msg`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit ${1}
```

### 3.3 Configure lint-staged

Add to `package.json`:

```json
{
  "lint-staged": {
    "src/**/*.{ts,js}": [
      "eslint --fix",
      "prettier --write",
      "yarn test --findRelatedTests --passWithNoTests",
      "git add"
    ],
    "test/**/*.{ts,js}": ["eslint --fix", "prettier --write", "git add"]
  }
}
```

### 3.4 Configure Commitlint

Create `commitlint.config.js`:

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-max-length': [2, 'always', 100],
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation
        'style', // Formatting
        'refactor', // Code refactoring
        'test', // Adding tests
        'chore', // Maintenance
        'perf', // Performance improvements
        'ci', // CI configuration
        'build', // Build system
        'revert', // Revert changes
      ],
    ],
  },
};
```

### 3.5 Update package.json Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "prepare": "husky install",
    "test:all": "yarn test && yarn test:e2e",
    "test:coverage": "jest --coverage",
    "test:ci": "yarn test:all && yarn test:coverage",
    "quality:check": "yarn lint && yarn test:all && yarn build",
    "pre-commit": "lint-staged",
    "commit": "git-cz"
  }
}
```

### 3.6 Quality Gates Configuration

Create `jest.config.js` with coverage thresholds:

```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s', '!**/*.spec.ts', '!**/node_modules/**'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverage: true,
};
```

### 3.7 Git Quality Gates Verification

Test the setup:

```bash
# Test pre-commit hook
git add .
git commit -m "test: verify quality gates"

# This should run:
# 1. Linting
# 2. All unit tests
# 3. All E2E tests
# 4. Coverage check (100% required)
# 5. Build verification

# Test pre-push hook
git push origin feature/setup

# This should run:
# 1. Final test verification
# 2. Final coverage check with thresholds
```

### 3.8 Quality Gates Rules

**🚫 COMMIT BLOCKED IF:**

- Any test fails (unit or E2E)
- Coverage < 100%
- Linting errors exist
- Build fails
- Commit message doesn't follow conventional format

**🚫 PUSH BLOCKED IF:**

- Any quality gate fails
- Coverage thresholds not met
- Tests are not passing

**✅ COMMIT/PUSH ALLOWED ONLY IF:**

- All tests pass (100%)
- Coverage is 100%
- Code is properly linted
- Build succeeds
- Commit follows conventional format

## 🔧 Phase 4: Core Configuration

### 4.1 TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2020",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "paths": {
      "@/*": ["src/*"],
      "@domain/*": ["src/domain/*"],
      "@data/*": ["src/data/*"],
      "@infra/*": ["src/infra/*"],
      "@presentation/*": ["src/presentation/*"],
      "@main/*": ["src/main/*"]
    }
  }
}
```

### 3.2 ESLint Configuration

Create `.eslintrc.js`:

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    '@nestjs',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
```

### 3.3 Prettier Configuration

Create `.prettierrc`:

```json
{
  "singleQuote": false,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true,
  "printWidth": 80,
  "endOfLine": "lf"
}
```

### 3.4 Jest Configuration

Create `jest.config.js`:

```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.', // ⚠️ IMPORTANTE: Usar "." para incluir pasta test
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@data/(.*)$': '<rootDir>/src/data/$1',
    '^@infra/(.*)$': '<rootDir>/src/infra/$1',
    '^@presentation/(.*)$': '<rootDir>/src/presentation/$1',
    '^@main/(.*)$': '<rootDir>/src/main/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
};
```

### 3.5 Configuração de Testes E2E

Create `test/jest-e2e.json`:

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "moduleNameMapping": {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@domain/(.*)$": "<rootDir>/src/domain/$1",
    "^@data/(.*)$": "<rootDir>/src/data/$1",
    "^@infra/(.*)$": "<rootDir>/src/infra/$1",
    "^@presentation/(.*)$": "<rootDir>/src/presentation/$1",
    "^@main/(.*)$": "<rootDir>/src/main/$1"
  },
  "setupFilesAfterEnv": ["<rootDir>/test/setup.ts"]
}
```

### 3.6 Setup de Testes

Create `test/setup.ts`:

```typescript
import 'reflect-metadata';

// Global test setup
beforeAll(() => {
  // Configure timezone for consistent test results
  process.env.TZ = 'UTC';
});
```

## 🏛️ Phase 4: Core Architecture Implementation

### 4.1 Database Configuration

Create TypeORM configuration:

```typescript
// src/infra/db/typeorm/config/data-source.ts
import { DataSource } from 'typeorm';

export const typeOrmConfig = {
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'myapi_db',
  entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

export const AppDataSource = new DataSource(typeOrmConfig);
```

### 4.2 Observability Implementation

Follow the observability guidelines to implement:

1. **Metrics Service** - Copy from observability guidelines
2. **Logger Service** - Copy from observability guidelines
3. **Health Controller** - Copy from observability guidelines
4. **Metrics Interceptor** - Copy from observability guidelines
5. **Observability Module** - Copy from observability guidelines

### 4.3 Authentication Implementation

```typescript
// src/presentation/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}
```

## 🐳 Phase 5: Docker Configuration

### 5.1 Dockerfile

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies using Yarn
RUN yarn install --frozen-lockfile --production

COPY . .
RUN yarn build

EXPOSE 3000

CMD ["node", "dist/main"]
```

### 5.2 Docker Compose Base

```yaml
# docker-compose.yml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: myapi-api
    restart: unless-stopped
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://${DB_USERNAME}:${DB_PASSWORD}@db:5432/${DB_NAME}
      - JWT_SECRET=${JWT_SECRET}
      - PORT=3000
      - API_PREFIX=api/v1
    depends_on:
      db:
        condition: service_healthy
    networks:
      - api-network

  db:
    image: postgres:17-alpine
    container_name: myapi-db
    restart: unless-stopped
    ports:
      - '5432:5432'
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USERNAME}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USERNAME} -d ${DB_NAME}']
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - api-network

volumes:
  postgres_data:

networks:
  api-network:
    driver: bridge
```

### 5.3 Observability Docker Override

Copy the observability Docker configuration from the guidelines.

## 📦 Phase 6: Package.json Scripts

### 6.1 Core Scripts

```json
{
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  }
}
```

### 6.2 Database Scripts

```json
{
  "typeorm": "yarn build && npx typeorm -d dist/infra/db/typeorm/config/data-source.js",
  "migration:generate": "yarn typeorm -- migration:generate",
  "migration:run": "yarn typeorm -- migration:run",
  "migration:revert": "yarn typeorm -- migration:revert"
}
```

### 6.3 Docker Scripts

```json
{
  "docker:dev": "docker-compose up -d",
  "docker:dev:build": "docker-compose up -d --build",
  "docker:dev:down": "docker-compose down",
  "docker:dev:clean": "docker-compose down -v --remove-orphans",
  "docker:prod": "docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d"
}
```

### 6.4 Observability Scripts

Copy all observability scripts from the guidelines pattern.

## 🌍 Phase 7: Environment Configuration

### 7.1 Environment Files Structure

```bash
# Create environment files
touch .env .env.dev .env.staging .env.prod
touch .env.example

# Add to .gitignore
echo ".env*" >> .gitignore
echo "!.env.example" >> .gitignore
```

### 7.2 .env.example Template

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=myapi_db
DB_SSL=false

# Application Configuration
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10

# Observability
METRICS_ENABLED=true
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE_ENABLED=true
LOG_CONSOLE_ENABLED=true
HEALTH_CHECK_ENABLED=true
```

## 📚 Phase 8: Documentation Setup

### 8.1 Main README.md

````markdown
# My New API

## Description

[Brief description of your API]

## Prerequisites

- Node.js 22+ (LTS)
- PostgreSQL 17+
- Yarn package manager
- Docker and Docker Compose

## Installation

```bash
yarn install
```
````

## Running the app

```bash
# development
yarn start:dev

# production mode
yarn start:prod
```

## Docker

```bash
# Start all services
yarn docker:dev

# Stop services
yarn docker:dev:down
```

## API Documentation

Once running, visit http://localhost:3000/api/v1/docs for Swagger documentation.

## Observability

```bash
# Setup observability
yarn obs:setup

# Access monitoring
yarn obs:monitor
```

````

### 8.2 API Documentation Setup
```typescript
// In main.ts
const config = new DocumentBuilder()
  .setTitle('My New API')
  .setDescription('API description')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/v1/docs', app, document);
````

## 🧪 Phase 8: Testing Setup

### 8.1 Test Configuration

Create `test/jest-e2e.json`:

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

### 8.2 Basic E2E Test Template

```typescript
// test/app.e2e-spec.ts
describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect(res => {
        expect(res.body.status).toBe('ok');
      });
  });
});
```

## 🔄 Phase 9: CI/CD Setup

### 9.1 GitHub Actions Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'yarn'

      - run: yarn install --frozen-lockfile
      - run: yarn lint
      - run: yarn test
      - run: yarn test:e2e
```

## ✅ Phase 10: Validation and Launch

### 10.1 Pre-Launch Checklist

- [ ] All dependencies installed
- [ ] Database connection working
- [ ] Authentication endpoints working
- [ ] Health check endpoint responding
- [ ] Metrics endpoint exposing data
- [ ] Swagger documentation accessible
- [ ] Docker containers starting successfully
- [ ] Tests passing
- [ ] Observability dashboards working

### 10.2 Launch Commands

```bash
# Final setup
yarn obs:setup

# Verify everything is working
yarn obs:test
yarn test
yarn test:e2e

# Start development
yarn start:dev

# Access API documentation
# http://localhost:3000/api/v1/docs

# Access monitoring
yarn obs:monitor
```

## 🎯 Next Steps After Setup

1. **Domain Implementation**: Implement your specific business logic
2. **Entity Creation**: Create domain entities in `src/domain/models`
3. **Use Case Implementation**: Implement business use cases
4. **Controller Creation**: Create API endpoints
5. **Database Migrations**: Create and run migrations
6. **Testing**: Write comprehensive tests
7. **Documentation**: Update API documentation

## 📖 Guidelines References

During development, follow these guidelines:

- `requirements/guidelines/api-requirements.md`
- `requirements/guidelines/database-requirements.md`
- `requirements/guidelines/testing-requirements.md`
- `requirements/guidelines/observability-implementation-guidelines.md`
- `requirements/guidelines/docker-requirements.md`
- `requirements/workflows/development-workflow.md`

## 🔧 Customization Notes

This boilerplate provides a solid foundation. Customize based on your specific needs:

- **Authentication**: Modify JWT strategy for your requirements
- **Database**: Adjust entities and migrations for your domain
- **Observability**: Add domain-specific metrics
- **Business Logic**: Implement your specific use cases
- **API Structure**: Adapt endpoints to your domain

---

## 🔧 Troubleshooting - Problemas Comuns

### 1. Erro: "Cannot find module 'sqlite3'"

**Causa:** Tentar usar SQLite em testes sem instalar dependência
**Solução:**

```bash
yarn add -D sqlite3
# OU melhor: usar mocks em vez de SQLite (recomendado)
```

### 2. Erro: "Unknown authentication strategy 'jwt'"

**Causa:** Strategy JWT não configurada nos testes
**Solução:** Mock completo do guard:

```typescript
.overrideGuard(JwtAuthGuard)
.useValue({
  canActivate: jest.fn().mockReturnValue(true),
  handleRequest: jest.fn().mockImplementation(() => ({
    id: 'user-id',
    email: 'test@example.com',
  })),
})
```

### 3. Erro: "Please tell me who you are"

**Causa:** Git user não configurado
**Solução:**

```bash
git config user.name "Seu Nome"
git config user.email "seu.email@exemplo.com"
```

### 4. Erro: "relation does not exist" em testes

**Causa:** Banco PostgreSQL não rodando ou não configurado
**Solução:**

```bash
# Usar Docker para banco de testes
docker run --name test-postgres -e POSTGRES_PASSWORD=postgres -d -p 5432:5432 postgres:16-alpine
# OU usar mocks (recomendado)
```

### 5. Erro: "loggedEvents/recordedMetrics is not a function"

**Causa:** Usar propriedades incorretas nos spies
**Solução:** Usar métodos corretos:

```typescript
// ❌ Errado
expect(loggerSpy.loggedEvents).toHaveLength(1);
// ✅ Correto
expect(loggerSpy.getBusinessEvents('event_name')).toHaveLength(1);
```

### 6. Testes E2E lentos ou falhando

**Causa:** Usar banco de dados real em E2E
**Solução:** Usar abordagem com mocks:

```typescript
// Mocks completos em vez de banco real
providers: [
  { provide: AddEntryUseCase, useValue: mockUseCase },
  { provide: 'ContextAwareLoggerService', useValue: loggerSpy },
];
```

### 7. Package manager inconsistente (npm vs yarn)

**Causa:** Misturar npm e yarn no projeto
**Solução:** Escolher um e usar consistentemente:

```bash
# ✅ Use apenas yarn
yarn install
yarn build
yarn test

# ❌ NÃO misture
npm install  # Não fazer se já usa yarn
```

---

**Success!** 🎉 You now have a production-ready API foundation following all established guidelines and best practices.
