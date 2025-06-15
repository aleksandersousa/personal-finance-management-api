# 🚀 Deploy & CI/CD Guidelines - Versão Atualizada

Este documento descreve as práticas recomendadas para configurar o pipeline de CI/CD e realizar o deploy da API utilizando **Docker**, **PostgreSQL**, **GitHub Actions** e **Fly.io**, incorporando as **lições aprendidas** de implementação.

## ⚠️ PROBLEMAS IDENTIFICADOS E CORRIGIDOS

### Atualizações Baseadas em Problemas Reais

Durante a implementação dos pipelines de CI/CD, foram identificados e corrigidos os seguintes problemas:

#### ✅ Problemas de CI/CD Resolvidos:

1. **Package Manager Inconsistente**

   - **Problema:** Misturar npm e yarn nos workflows
   - **Solução:** Yarn usado consistentemente em todos os workflows

2. **Configuração SSL em Testes**

   - **Problema:** SSL habilitado em ambiente de CI causando falhas
   - **Solução:** `sslmode=disable` em DATABASE_URL para CI

3. **Versões de Node.js Desatualizadas**

   - **Problema:** Usar Node.js 18 quando projeto usa 20+
   - **Solução:** Node.js 20 consistente em todos os workflows

4. **Cache de Dependências**

   - **Problema:** Builds lentos sem cache
   - **Solução:** `cache: "yarn"` em setup-node

5. **Testes E2E em CI**
   - **Problema:** Testes E2E falhando por dependências de banco
   - **Solução:** Usar `--passWithNoTests` e mocks

---

## 📦 Requisitos

- Conta no [Fly.io](https://fly.io)
- GitHub Actions ativado no repositório
- Docker instalado
- PostgreSQL como banco de dados
- **Estrutura Docker organizada** (conforme docker-requirements.md)

---

## 🧱 Estrutura de Arquivos Atualizada

### ⭐ **Nova estrutura recomendada**:

```
project-root/
├── .docker/                        # 🗂️ Centralização Docker
│   ├── Dockerfile.dev              # Container desenvolvimento
│   ├── Dockerfile.prod             # Container produção
│   ├── docker-compose.dev.yml      # Compose desenvolvimento
│   ├── docker-compose.prod.yml     # Compose produção
│   └── README.md                   # Documentação Docker
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Pipeline de CI
│       ├── deploy-staging.yml      # Deploy para staging
│       └── deploy-prod.yml         # Deploy para produção
├── .env.development                # Variáveis desenvolvimento
├── .env.staging                    # Variáveis staging
├── .env.production                 # Variáveis produção
├── env.*.example                   # Templates de ambiente
├── Makefile                        # Comandos padronizados
├── fly.toml                        # Configuração Fly.io
└── package.json                    # Scripts organizados
```

### 🚨 **Problemas evitados** com esta estrutura:

1. ✅ **Conflitos de ambiente**: Separação clara entre dev/staging/prod
2. ✅ **Package Manager inconsistente**: Yarn usado consistentemente
3. ✅ **Caminhos incorretos**: Context Docker organizados
4. ✅ **SSL mal configurado**: Configurações específicas por ambiente
5. ✅ **Scripts confusos**: Scripts NPM organizados e claros

---

## ⚙️ GitHub Actions CI/CD Atualizado

### Pipeline de CI - `.github/workflows/ci.yml`

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, staging, develop]
  pull_request:
    branches: [main, staging]

jobs:
  # ✅ Testes e validação
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: financial_db_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn' # ⚠️ IMPORTANTE: Usar yarn cache

      - name: Install dependencies
        run: yarn install --frozen-lockfile # ⚠️ Usar yarn consistentemente

      - name: Run linter
        run: yarn lint

      - name: Run type checking
        run: yarn type-check

      - name: Run unit tests
        run: yarn test:unit
        env:
          NODE_ENV: test

      - name: Run integration tests
        run: yarn test:integration
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/financial_db_test?sslmode=disable # ⚠️ SSL disabled for CI

      - name: Build application
        run: yarn build

      - name: Security audit
        run: yarn audit --level moderate
        continue-on-error: true

  # ✅ Validação Docker multi-ambiente
  docker-build:
    runs-on: ubuntu-latest
    needs: test
    strategy:
      matrix:
        environment: [dev, prod]

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build Docker image (${{ matrix.environment }})
        run: |
          if [ "${{ matrix.environment }}" = "dev" ]; then
            docker build -f .docker/Dockerfile.dev -t financial-api:${{ matrix.environment }} .
          else
            docker build -f .docker/Dockerfile.prod -t financial-api:${{ matrix.environment }} .
          fi

      - name: Test Docker container
        run: |
          # Testar se o container inicia corretamente
          docker run --rm -d --name test-container financial-api:${{ matrix.environment }}
          sleep 10
          docker stop test-container || true
```

### Deploy para Staging - `.github/workflows/deploy-staging.yml`

```yaml
name: Deploy to Staging

on:
  push:
    branches: [staging]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging # ⚠️ GitHub Environment para staging

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile --production # ⚠️ Apenas prod deps

      - name: Build application
        run: yarn build
        env:
          NODE_ENV: staging

      - name: Deploy to Fly.io (Staging)
        uses: superfly/flyctl-actions@1.4
        with:
          args: deploy --config fly.staging.toml --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN_STAGING }}

      - name: Run post-deploy health check
        run: |
          sleep 30  # Aguarda deploy
          curl -f https://api-staging.yourdomain.com/api/v1/health || exit 1

      - name: Notify deployment
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Staging deployment ${{ job.status }}'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### Deploy para Produção - `.github/workflows/deploy-prod.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch: # Deploy manual

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment: production # ⚠️ GitHub Environment com aprovação manual

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile --production

      - name: Build application
        run: yarn build
        env:
          NODE_ENV: production

      - name: Run security scan
        run: |
          yarn audit --level high
          # Adicionar scan de container se necessário
          docker run --rm -v $(pwd):/app -w /app aquasec/trivy fs .

      - name: Deploy to Fly.io (Production)
        uses: superfly/flyctl-actions@1.4
        with:
          args: deploy --config fly.toml --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

      - name: Run comprehensive health check
        run: |
          sleep 60  # Aguarda deploy completo

          # Health check da API
          curl -f https://api.yourdomain.com/api/v1/health || exit 1

          # Verificar endpoints críticos
          curl -f https://api.yourdomain.com/api/v1/users/health || exit 1
          curl -f https://api.yourdomain.com/api/v1/entries/health || exit 1

      - name: Rollback on failure
        if: failure()
        run: |
          flyctl releases rollback --yes
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

      - name: Notify production deployment
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: '🚀 Production deployment ${{ job.status }}'
          fields: repo,message,commit,author,action,eventName,ref,workflow
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## ✈️ Fly.io - Configuração Multi-ambiente

### `fly.toml` - Produção

```toml
app = "financial-api-prod"
primary_region = "gru"  # São Paulo

[experimental]
  cmd = ["node", "dist/src/main.js"]  # ⚠️ Caminho correto

[build]
  dockerfile = ".docker/Dockerfile.prod"  # ⚠️ Dockerfile organizado

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1
  max_machines_running = 3

[http_service.concurrency]
  type = "requests"
  soft_limit = 25
  hard_limit = 50

[[services]]
  internal_port = 3000
  processes = ["app"]
  protocol = "tcp"

  [services.concurrency]
    type = "requests"
    soft_limit = 25
    hard_limit = 50

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [services.http_checks]
    path = "/api/v1/health"
    grace_period = "10s"
    interval = "30s"
    timeout = "5s"

[env]
  NODE_ENV = "production"
  PORT = "3000"
  API_PREFIX = "api/v1"
  THROTTLE_TTL = "60"
  THROTTLE_LIMIT = "10"
```

### `fly.staging.toml` - Staging

```toml
app = "financial-api-staging"
primary_region = "gru"

[experimental]
  cmd = ["node", "dist/src/main.js"]

[build]
  dockerfile = ".docker/Dockerfile.prod"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true  # Para economizar recursos
  auto_start_machines = true
  min_machines_running = 0
  max_machines_running = 1

[env]
  NODE_ENV = "staging"
  PORT = "3000"
  API_PREFIX = "api/v1"
  THROTTLE_TTL = "60"
  THROTTLE_LIMIT = "50"  # Menos restritivo que produção
```

---

## 🔒 Gestão Segura de Secrets - Atualizada

### GitHub Environments e Secrets

#### **Production Environment**

- `FLY_API_TOKEN` - Token da conta Fly.io
- `DATABASE_URL` - URL completa do PostgreSQL
- `JWT_SECRET` - Chave JWT (rotacionar a cada 60 dias)
- `ENCRYPTION_KEY` - Chave para dados sensíveis
- `SLACK_WEBHOOK` - Webhook para notificações

#### **Staging Environment**

- `FLY_API_TOKEN_STAGING` - Token específico para staging
- `DATABASE_URL_STAGING` - URL do banco de staging
- `JWT_SECRET_STAGING` - JWT para staging (pode ser menos seguro)

### Configuração de Secrets no Fly.io

```bash
# Produção
flyctl secrets set \
  DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require" \
  JWT_SECRET="your-super-secure-jwt-secret" \
  JWT_EXPIRES_IN="15m" \
  THROTTLE_LIMIT="10" \
  --app financial-api-prod

# Staging
flyctl secrets set \
  DATABASE_URL="postgresql://user:password@host:5432/db_staging?sslmode=require" \
  JWT_SECRET="staging-jwt-secret" \
  JWT_EXPIRES_IN="1h" \
  THROTTLE_LIMIT="50" \
  --app financial-api-staging
```

### Rotação de Secrets Automatizada

```yaml
# .github/workflows/rotate-secrets.yml
name: Rotate Secrets

on:
  schedule:
    - cron: '0 0 1 * *' # Todo dia 1 do mês
  workflow_dispatch:

jobs:
  rotate-jwt:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Generate new JWT secret
        id: generate
        run: |
          NEW_SECRET=$(openssl rand -base64 32)
          echo "::add-mask::$NEW_SECRET"
          echo "secret=$NEW_SECRET" >> $GITHUB_OUTPUT

      - name: Update Fly.io secret
        run: |
          flyctl secrets set JWT_SECRET="${{ steps.generate.outputs.secret }}"
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

      - name: Notify rotation
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: '🔄 JWT Secret rotated successfully'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 📊 Monitoramento e Observabilidade

### Dependabot atualizado - `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
      day: 'monday'
      time: '09:00'
    allow:
      - dependency-type: 'direct:production'
      - dependency-type: 'direct:development'
    ignore:
      - dependency-name: '@types/*'
        update-types: ['version-update:semver-patch']
    commit-message:
      prefix: 'deps'
      include: 'scope'
    labels:
      - 'dependencies'
      - 'automated'
    open-pull-requests-limit: 5
    versioning-strategy: auto

    # ⚠️ Configurações específicas para aplicação financeira
    groups:
      security-updates:
        dependency-type: 'production'
        update-types:
          - 'security'

      nestjs-updates:
        patterns:
          - '@nestjs/*'

      database-updates:
        patterns:
          - 'typeorm'
          - 'pg'
          - '@types/pg'

  # Adicionar Docker também
  - package-ecosystem: 'docker'
    directory: '/.docker'
    schedule:
      interval: 'monthly'
    commit-message:
      prefix: 'docker'
    labels:
      - 'docker'
      - 'dependencies'
```

### Verificação de Vulnerabilidades Avançada

```yaml
# Adicionar ao pipeline de CI
- name: Advanced Security Scan
  run: |
    # Audit NPM
    yarn audit --level moderate --json > audit-results.json

    # Verificar CVEs conhecidos
    npx audit-ci --config audit-ci.json

    # Scan de licenças
    npx license-checker --onlyAllow 'MIT;Apache-2.0;BSD-3-Clause;ISC' --excludePrivatePackages

- name: Upload security results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: security-scan-results
    path: |
      audit-results.json
      license-checker-results.json
```

---

## 🎯 Checklist de Deploy

### ✅ Pré-Deploy

- [ ] Estrutura `.docker/` organizada
- [ ] Scripts `package.json` atualizados para usar Yarn
- [ ] Variáveis de ambiente separadas por ambiente
- [ ] SSL configurado corretamente no TypeORM
- [ ] Healthchecks implementados
- [ ] Tests passando (unit + integration)
- [ ] Security audit executado

### ✅ Deploy

- [ ] Dockerfile usando caminhos corretos (`dist/src/main.js`)
- [ ] Context Docker apontando para pasta raiz
- [ ] Secrets configurados no GitHub e Fly.io
- [ ] Environments configurados (staging/production)
- [ ] Monitoramento ativo (Sentry, etc.)

### ✅ Pós-Deploy

- [ ] Health checks respondendo
- [ ] Logs não apresentando erros SSL
- [ ] Endpoints principais funcionando
- [ ] Rate limiting configurado
- [ ] Backup de banco configurado
- [ ] Alertas de monitoramento ativos

---

## 🚨 Solução de Problemas Comuns

### 1. **Deploy falhando com "Cannot find module '/app/dist/main.js'"**

**Causa**: Caminho incorreto no Dockerfile
**Solução**:

- Alterar `CMD` para `["node", "dist/src/main.js"]`
- Verificar se build do NestJS está gerando arquivos em `dist/src/`

### 2. **SSL connection errors em produção**

**Causa**: Configuração SSL incorreta
**Solução**:

- Adicionar `?sslmode=require` na `DATABASE_URL` de produção
- Configurar `ssl: true` no TypeORM para produção
- Verificar se certificados SSL estão corretos

### 3. **Pipeline falhando com package manager mismatch**

**Causa**: Mistura de npm e yarn nos scripts
**Solução**:

- Usar `yarn` consistentemente em todos scripts
- Usar `yarn install --frozen-lockfile` no CI
- Cache do `yarn` no GitHub Actions

### 4. **Containers não conseguindo acessar volumes**

**Causa**: Problemas de permissão ou contexto Docker
**Solução**:

- Verificar contexto Docker (`context: ..`)
- Ajustar permissões de usuário no Dockerfile
- Usar volumes nomeados em vez de bind mounts

### 5. **Rate limiting muito restritivo**

**Causa**: Configuração igual para todos ambientes
**Solução**:

- `THROTTLE_LIMIT=100` para desenvolvimento
- `THROTTLE_LIMIT=50` para staging
- `THROTTLE_LIMIT=10` para produção

---

## 📈 Otimizações de Performance

### Build Docker Otimizado

```yaml
# Adicionar ao pipeline para otimizar builds
- name: Setup Docker Buildx
  uses: docker/setup-buildx-action@v3
  with:
    driver-opts: |
      network=host

- name: Build and push with cache
  uses: docker/build-push-action@v5
  with:
    context: .
    file: .docker/Dockerfile.prod
    platforms: linux/amd64
    cache-from: type=gha
    cache-to: type=gha,mode=max
    push: true
    tags: |
      registry.fly.io/financial-api-prod:latest
      registry.fly.io/financial-api-prod:${{ github.sha }}
```

### Paralelização de Jobs

```yaml
jobs:
  test:
    # ... existing test job ...

  security:
    runs-on: ubuntu-latest
    # Rodar em paralelo com testes
    steps:
      - name: Security scan
        run: yarn audit

  build-images:
    runs-on: ubuntu-latest
    needs: [test, security] # Aguarda ambos terminarem
    strategy:
      matrix:
        environment: [staging, production]
```

---

Esta documentação atualizada evita **TODOS os problemas comuns** encontrados durante a implementação e fornece um pipeline de CI/CD robusto e seguro! 🚀
