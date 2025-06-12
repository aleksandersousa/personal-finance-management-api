# 🐳 Docker Guidelines - Lições Aprendidas e Melhores Práticas

## 🎯 Objetivo

Containerizar a aplicação backend (NestJS + TypeORM) e o banco de dados (PostgreSQL) de forma **organizada** e **escalável**, permitindo:

- Ambiente de desenvolvimento padronizado com hot reload
- Configurações específicas por ambiente (dev/prod)
- Deploy simplificado e seguro
- Gestão centralizada de containers e variáveis

---

## 📁 Estrutura Recomendada - **ATUALIZADA** ⭐

```
project-root/
├── .docker/                          # 🗂️ TODA configuração Docker centralizada
│   ├── Dockerfile.dev                # Container para desenvolvimento
│   ├── Dockerfile.prod               # Container para produção (otimizado)
│   ├── docker-compose.yml            # Compose base (configurável)
│   ├── docker-compose.dev.yml        # Compose específico para desenvolvimento
│   ├── docker-compose.prod.yml       # Compose para produção (com Nginx)
│   └── README.md                     # Documentação específica Docker
├── .env                              # Arquivo padrão (cópia do development)
├── .env.development                  # Variáveis específicas para desenvolvimento
├── .env.production                   # Variáveis específicas para produção
├── env.dev.example                   # Template para desenvolvimento
├── env.prod.example                  # Template para produção
├── Makefile                          # Comandos úteis para desenvolvimento
├── package.json                      # Scripts NPM/Yarn atualizados
└── scripts/
    └── init-db.sql                   # Script de inicialização do banco
```

### 🚨 **PROBLEMAS EVITADOS** com esta estrutura:

1. ✅ **SSL Issues**: Configuração SSL correta por ambiente
2. ✅ **Permission Issues**: Dockerfiles sem problemas de permissão
3. ✅ **Package Manager**: Uso consistente do Yarn vs NPM
4. ✅ **Path Issues**: Caminhos relativos corretos nos volumes
5. ✅ **Environment Confusion**: Separação clara de variáveis por ambiente

---

## 🐳 Dockerfiles por Ambiente

### 🔧 `.docker/Dockerfile.dev` - Desenvolvimento

```Dockerfile
# Dockerfile para desenvolvimento - Hot Reload
FROM node:20-alpine

# Instalar dependências necessárias
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json yarn.lock ./

# Instalar TODAS as dependências (incluindo devDependencies)
RUN yarn install --frozen-lockfile

# Definir variáveis de ambiente para desenvolvimento
ENV NODE_ENV=development
ENV PORT=3000

# Expor porta
EXPOSE 3000

# Comando para desenvolvimento com hot reload
CMD ["yarn", "start:dev"]
```

### 🚀 `.docker/Dockerfile.prod` - Produção

```Dockerfile
# Dockerfile para produção - Multi-stage build otimizado
FROM node:20-alpine AS builder

# Adiciona dependências para compressão
RUN apk add --no-cache python3 make g++

# Cria usuário não-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copia arquivos de dependências
COPY package.json yarn.lock ./

# Instala TODAS as dependências primeiro (para build)
RUN yarn install --frozen-lockfile

# Copia código fonte
COPY --chown=appuser:appgroup . .

# Constrói a aplicação
RUN yarn build

# Production stage - Menor e mais seguro
FROM node:20-alpine AS production

# Adiciona ferramentas de segurança
RUN apk add --no-cache dumb-init

# Define variáveis de ambiente
ENV NODE_ENV=production \
  TZ=UTC \
  PORT=3000

# Cria usuário não-root (segurança)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copia package.json e yarn.lock para instalar apenas dependências de produção
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean

# Copia apenas arquivos necessários do estágio de build
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist

# Reduz superfície de ataque executando como usuário não-root
USER appuser

# dumb-init funciona como PID 1 adequado em containers
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Configurações de healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:3000/api/v1/health || exit 1

# Porta para a aplicação
EXPOSE 3000

# ⚠️ IMPORTANTE: Caminho correto para o main.js
CMD ["node", "dist/src/main.js"]
```

---

## 🔧 Docker Compose por Ambiente

### 🔧 `.docker/docker-compose.dev.yml` - Desenvolvimento

```yaml
services:
  api:
    build:
      context: .. # ⚠️ Context relativo à pasta .docker
      dockerfile: .docker/Dockerfile.dev
    container_name: financial-api-dev
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/financial_db?sslmode=disable # ⚠️ SSL desabilitado
      - JWT_SECRET=dev-jwt-secret-key
      - PORT=3000
      - API_PREFIX=api/v1
      - THROTTLE_TTL=60
      - THROTTLE_LIMIT=100 # Rate limiting permissivo para dev
      - DATABASE_SSL=false # ⚠️ Força SSL false
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ..:/app # ⚠️ Volume mounting para hot reload
      - /app/node_modules # ⚠️ Volume separado para node_modules
    networks:
      - financial-network-dev

  db:
    image: postgres:16-alpine
    container_name: financial-db-dev
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=financial_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data_dev:/var/lib/postgresql/data
      - ../scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql:ro # ⚠️ Caminho relativo correto
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d financial_db"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - financial-network-dev

volumes:
  postgres_data_dev:

networks:
  financial-network-dev:
    driver: bridge
```

### 🚀 `.docker/docker-compose.prod.yml` - Produção

```yaml
services:
  api:
    build:
      context: ..
      dockerfile: .docker/Dockerfile.prod
    container_name: financial-api-prod
    restart: unless-stopped
    ports:
      - "${API_PORT:-3000}:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL:-postgresql://postgres:postgres@db:5432/financial_db?sslmode=require}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-15m}
      - PORT=3000
      - API_PREFIX=${API_PREFIX:-api/v1}
      - THROTTLE_TTL=${THROTTLE_TTL:-60}
      - THROTTLE_LIMIT=${THROTTLE_LIMIT:-10} # Rate limiting restritivo para prod
      - FRONTEND_URL=${FRONTEND_URL}
    depends_on:
      db:
        condition: service_healthy
    networks:
      - financial-network-prod
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 512M
        reservations:
          cpus: "0.25"
          memory: 256M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  db:
    image: postgres:16-alpine
    container_name: financial-db-prod
    restart: unless-stopped
    ports:
      - "${DB_PORT:-5432}:5432"
    environment:
      - POSTGRES_DB=${DB_NAME:-financial_db}
      - POSTGRES_USER=${DB_USER:-postgres}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data_prod:/var/lib/postgresql/data
      - ../scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql:ro
      - ../backups:/backups
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "pg_isready -U ${DB_USER:-postgres} -d ${DB_NAME:-financial_db}",
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    networks:
      - financial-network-prod
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 1G
        reservations:
          cpus: "0.5"
          memory: 512M

  # Nginx para produção
  nginx:
    image: nginx:alpine
    container_name: financial-nginx-prod
    restart: unless-stopped
    ports:
      - "${NGINX_PORT:-80}:80"
      - "${NGINX_SSL_PORT:-443}:443"
    volumes:
      - ../nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ../nginx/ssl:/etc/nginx/ssl:ro
      - ../logs/nginx:/var/log/nginx
    depends_on:
      - api
    networks:
      - financial-network-prod

volumes:
  postgres_data_prod:

networks:
  financial-network-prod:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

---

## 📋 Variáveis de Ambiente

### 🔧 `.env.development`

```env
# Configurações de Desenvolvimento
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@db:5432/financial_db?sslmode=disable
DATABASE_SSL=false
DB_NAME=financial_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_PORT=5432

# API
API_PORT=3000
PORT=3000
API_PREFIX=api/v1

# JWT
JWT_SECRET=dev-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Rate Limiting (mais permissivo em dev)
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# CORS
FRONTEND_URL=http://localhost:3001

# Logging
LOG_LEVEL=debug
```

### 🚀 `.env.production`

```env
# Configurações de Produção
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@db:5432/financial_db?sslmode=require
DB_NAME=financial_db
DB_USER=postgres
DB_PASSWORD=CHANGE_THIS_PASSWORD
DB_PORT=5432

# API
API_PORT=3000
PORT=3000
API_PREFIX=api/v1

# JWT (ALTERAR EM PRODUÇÃO)
JWT_SECRET=CHANGE_THIS_JWT_SECRET_IN_PRODUCTION
JWT_EXPIRES_IN=15m

# Rate Limiting (mais restritivo em produção)
THROTTLE_TTL=60
THROTTLE_LIMIT=10

# CORS
FRONTEND_URL=https://yourdomain.com

# Nginx
NGINX_PORT=80
NGINX_SSL_PORT=443

# Data Path
DATA_PATH=/var/lib/financial-app

# Logging
LOG_LEVEL=warn
```

---

## 📜 Scripts package.json Atualizados

### ⚠️ **IMPORTANTE**: Scripts para usar com a estrutura organizada

```json
{
  "scripts": {
    "docker:dev": "docker-compose -f .docker/docker-compose.dev.yml --env-file .env.development up -d",
    "docker:dev:build": "docker-compose -f .docker/docker-compose.dev.yml --env-file .env.development up -d --build",
    "docker:dev:logs": "docker-compose -f .docker/docker-compose.dev.yml --env-file .env.development logs -f",
    "docker:dev:down": "docker-compose -f .docker/docker-compose.dev.yml --env-file .env.development down",
    "docker:dev:clean": "docker-compose -f .docker/docker-compose.dev.yml --env-file .env.development down -v --remove-orphans",

    "docker:prod": "docker-compose -f .docker/docker-compose.prod.yml --env-file .env.production up -d",
    "docker:prod:build": "docker-compose -f .docker/docker-compose.prod.yml --env-file .env.production up -d --build",
    "docker:prod:logs": "docker-compose -f .docker/docker-compose.prod.yml --env-file .env.production logs -f",
    "docker:prod:down": "docker-compose -f .docker/docker-compose.prod.yml --env-file .env.production down",
    "docker:prod:clean": "docker-compose -f .docker/docker-compose.prod.yml --env-file .env.production down -v --remove-orphans"
  }
}
```

---

## 🔧 Configuração TypeORM para SSL

### ⚠️ **PROBLEMA COMUM**: Erro de SSL em desenvolvimento

**Solução**: Configurar SSL corretamente no TypeORM:

```typescript
// src/infra/db/typeorm/config/data-source.ts
import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";

const configService = new ConfigService();

export const typeOrmConfig = {
  type: "postgres" as const,
  url: configService.get<string>("DATABASE_URL"),
  entities: [UserEntity, EntryEntity, CategoryEntity],
  migrations: ["dist/infra/db/typeorm/migrations/*.js"],
  synchronize: configService.get<string>("NODE_ENV") === "development",
  logging: configService.get<string>("NODE_ENV") === "development",
  // ⚠️ IMPORTANTE: Configuração SSL por ambiente
  ssl: false, // Para desenvolvimento sempre false
  autoLoadEntities: true,
};
```

---

## 🚨 Problemas Comuns e Soluções

### 1. **Erro: "The server does not support SSL connections"**

**Causa**: TypeORM tentando usar SSL em desenvolvimento
**Solução**:

- Adicionar `?sslmode=disable` na `DATABASE_URL`
- Configurar `ssl: false` no TypeORM
- Usar `DATABASE_SSL=false` na .env

### 2. **Erro: "Cannot find module '/app/dist/main.js'"**

**Causa**: Caminho incorreto para o arquivo compilado
**Solução**:

- Usar `CMD ["node", "dist/src/main.js"]` no Dockerfile
- Verificar estrutura de build do NestJS

### 3. **Erro: "EACCES: permission denied"**

**Causa**: Problemas de permissão com volumes
**Solução**:

- Remover usuário não-root em desenvolvimento
- Configurar permissões corretas em produção

### 4. **Erro: "npm ci command failed"**

**Causa**: Usar npm quando projeto usa yarn
**Solução**:

- Usar `yarn install --frozen-lockfile` consistentemente
- Copiar `yarn.lock` junto com `package.json`

### 5. **Erro: Extension "pg_crypto" not available**

**Causa**: Nome incorreto da extensão PostgreSQL
**Solução**:

- Usar `pgcrypto` em vez de `pg_crypto` no init-db.sql

---

## 🛠️ Comandos de Desenvolvimento

### Via Scripts NPM/Yarn (Recomendado)

```bash
# Desenvolvimento
yarn docker:dev:build    # Construir e iniciar
yarn docker:dev:logs     # Ver logs
yarn docker:dev:down     # Parar

# Produção
yarn docker:prod:build   # Construir e iniciar
yarn docker:prod:logs    # Ver logs
yarn docker:prod:down    # Parar
```

### Via Makefile (Se disponível)

```bash
make build-dev    # Desenvolvimento
make build-prod   # Produção
make logs-dev     # Logs de desenvolvimento
make status-dev   # Status dos containers
make clean-dev    # Limpeza completa
```

---

## 📊 Checklist de Implementação

### ✅ Estrutura de Arquivos

- [ ] Criar pasta `.docker/`
- [ ] Mover todos Dockerfiles para `.docker/`
- [ ] Mover todos docker-compose para `.docker/`
- [ ] Criar `.env.development` e `.env.production`
- [ ] Criar arquivos de exemplo (`env.*.example`)

### ✅ Configurações

- [ ] Atualizar scripts no `package.json`
- [ ] Configurar SSL corretamente no TypeORM
- [ ] Usar Yarn consistentemente
- [ ] Configurar caminhos relativos corretos
- [ ] Adicionar healthchecks

### ✅ Testes

- [ ] Testar ambiente de desenvolvimento
- [ ] Testar ambiente de produção
- [ ] Verificar hot reload em desenvolvimento
- [ ] Testar endpoints da API
- [ ] Verificar logs dos containers

### ✅ Documentação

- [ ] Atualizar README principal
- [ ] Criar README na pasta `.docker/`
- [ ] Documentar comandos essenciais
- [ ] Listar problemas comuns e soluções

---

## 🎯 Benefícios da Nova Estrutura

1. **🗂️ Organização**: Todos arquivos Docker centralizados
2. **🔧 Ambientes**: Configurações específicas e isoladas
3. **🚀 Deploy**: Scripts claros para cada ambiente
4. **🛡️ Segurança**: SSL e permissões configuradas corretamente
5. **📝 Manutenção**: Documentação clara e problemas conhecidos
6. **⚡ Performance**: Multi-stage builds e otimizações
7. **🔄 Hot Reload**: Desenvolvimento fluido com volumes

---

Esta estrutura evita **TODOS os problemas comuns** encontrados durante a implementação e fornece uma base sólida para projetos futuros! 🎉
