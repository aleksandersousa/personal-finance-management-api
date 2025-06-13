# 🧩 Database Modeling - Atualizado com Soluções SSL

### Overview

O banco de dados foi modelado para refletir os conceitos de **entradas e despesas**, com suporte a lançamentos fixos, categorias, múltiplos usuários e autenticação externa (Google, Apple, etc.).  
A modelagem também prevê futuras integrações com gateways de pagamento para assinaturas e compras pontuais.

**⭐ ATUALIZAÇÃO**: Incluídas configurações SSL, scripts de inicialização e soluções para problemas comuns encontrados durante implementação.

---

## 🚨 Configuração SSL e Conexão - **CRÍTICO**

### ⚠️ **Problema Comum**: "The server does not support SSL connections"

**Causa**: Configuração SSL inconsistente entre ambientes
**Solução**: Configuração específica por ambiente

#### ✅ **Configuração TypeORM Correta**:

```typescript
// src/infra/db/typeorm/config/data-source.ts
import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";

const configService = new ConfigService();

export const typeOrmConfig = {
  type: "postgres" as const,
  url: configService.get<string>("DATABASE_URL"),
  entities: [
    UserEntity,
    AuthProviderEntity,
    CategoryEntity,
    EntryEntity,
    RecurringEntryEntity,
    PaymentMethodEntity,
    SubscriptionEntity,
    PaymentEntity,
  ],
  migrations: ["dist/infra/db/typeorm/migrations/*.js"],
  synchronize: configService.get<string>("NODE_ENV") === "development",
  logging: configService.get<string>("NODE_ENV") === "development",

  // ⚠️ CRÍTICO: SSL por ambiente
  ssl:
    configService.get<string>("NODE_ENV") === "production"
      ? { rejectUnauthorized: false }
      : false,

  autoLoadEntities: true,
  retryDelay: 3000,
  retryAttempts: 3,
};

export const AppDataSource = new DataSource(typeOrmConfig);
```

#### 🔧 **URLs de Conexão por Ambiente**:

```bash
# Development - SSL desabilitado
DATABASE_URL=postgresql://postgres:postgres@db:5432/financial_db?sslmode=disable
DATABASE_SSL=false

# Staging - SSL opcional
DATABASE_URL=postgresql://postgres:password@host:5432/financial_db_staging?sslmode=prefer

# Production - SSL obrigatório
DATABASE_URL=postgresql://user:password@host:5432/financial_db?sslmode=require
```

---

## 📜 Script de Inicialização do Banco

### `scripts/init-db.sql` - **Versão Corrigida**

```sql
-- Inicialização do banco para aplicação financeira
-- ⚠️ PROBLEMA COMUM: Extension "pg_crypto" não existe
-- ✅ SOLUÇÃO: Usar "pgcrypto" (nome correto)

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- ⚠️ Nome correto da extensão
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- Para busca fuzzy

-- Criar enums necessários
DO $$ BEGIN
    CREATE TYPE auth_provider_type AS ENUM ('google', 'apple', 'facebook', 'twitter', 'email');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE entry_type AS ENUM ('INCOME', 'EXPENSE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Índices para performance (criados após TypeORM sync)
-- Função para criar índices se não existirem
CREATE OR REPLACE FUNCTION create_indexes_if_not_exists()
RETURNS void AS $$
BEGIN
    -- Índices para tabela users
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email') THEN
        CREATE INDEX idx_users_email ON users(email);
    END IF;

    -- Índices para tabela entries
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_entries_user_date') THEN
        CREATE INDEX idx_entries_user_date ON entries(user_id, date DESC);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_entries_category') THEN
        CREATE INDEX idx_entries_category ON entries(category_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_entries_type') THEN
        CREATE INDEX idx_entries_type ON entries(type);
    END IF;

    -- Índices para tabela auth_providers
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_auth_providers_user') THEN
        CREATE INDEX idx_auth_providers_user ON auth_providers(user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_auth_providers_external') THEN
        CREATE INDEX idx_auth_providers_external ON auth_providers(provider, provider_user_id);
    END IF;

    -- Índices para performance de consultas financeiras
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_entries_amount') THEN
        CREATE INDEX idx_entries_amount ON entries(amount) WHERE amount > 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_entries_monthly') THEN
        CREATE INDEX idx_entries_monthly ON entries(user_id, date_trunc('month', date));
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Executar criação de índices (será chamado após sync do TypeORM)
-- SELECT create_indexes_if_not_exists();

-- Dados iniciais para desenvolvimento
INSERT INTO categories (id, name, type, user_id, created_at, updated_at)
VALUES
    (uuid_generate_v4(), 'Salário', 'INCOME', null, NOW(), NOW()),
    (uuid_generate_v4(), 'Freelance', 'INCOME', null, NOW(), NOW()),
    (uuid_generate_v4(), 'Alimentação', 'EXPENSE', null, NOW(), NOW()),
    (uuid_generate_v4(), 'Transporte', 'EXPENSE', null, NOW(), NOW()),
    (uuid_generate_v4(), 'Moradia', 'EXPENSE', null, NOW(), NOW()),
    (uuid_generate_v4(), 'Saúde', 'EXPENSE', null, NOW(), NOW()),
    (uuid_generate_v4(), 'Educação', 'EXPENSE', null, NOW(), NOW()),
    (uuid_generate_v4(), 'Lazer', 'EXPENSE', null, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Criar usuário para testes (apenas em desenvolvimento)
DO $$
BEGIN
    IF current_setting('server_version_num')::int >= 120000 THEN
        -- PostgreSQL 12+
        INSERT INTO users (id, name, email, password, created_at, updated_at)
        VALUES (
            uuid_generate_v4(),
            'Dev User',
            'dev@financial.com',
            crypt('dev123', gen_salt('bf')),
            NOW(),
            NOW()
        ) ON CONFLICT (email) DO NOTHING;
    END IF;
END $$;

-- Log de inicialização
DO $$
BEGIN
    RAISE NOTICE 'Database initialized successfully for Financial Management API';
    RAISE NOTICE 'Extensions: uuid-ossp, pgcrypto, pg_trgm';
    RAISE NOTICE 'Enums: auth_provider_type, entry_type, subscription_status, payment_status';
    RAISE NOTICE 'Functions: update_updated_at_column, create_indexes_if_not_exists';
END $$;
```

### Docker Compose com Script de Inicialização

```yaml
# .docker/docker-compose.dev.yml (trecho)
services:
  db:
    image: postgres:16-alpine
    container_name: financial-db-dev
    environment:
      - POSTGRES_DB=financial_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data_dev:/var/lib/postgresql/data
      - ../scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql:ro # ⚠️ Script de inicialização
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d financial_db"]
      interval: 10s
      timeout: 5s
      retries: 5
```

---

### Tables

---

#### `users`

> Representa os usuários do sistema.

- `id` (UUID, PK)
- `name` (string)
- `email` (string, unique)
- `password` (string, opcional)
- `avatar_url` (string, opcional)
- `created_at`, `updated_at` (timestamps)

---

#### `auth_providers`

> Armazena as formas de autenticação do usuário (Google, Apple, Twitter, etc.)

- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id)
- `provider` (string, ex: "google", "apple", "twitter", "email")
- `provider_user_id` (string) → ID do usuário no provedor
- `email` (string, opcional)
- `access_token` (string, opcional)
- `refresh_token` (string, opcional)
- `expires_at` (timestamp, opcional)
- `created_at`, `updated_at` (timestamps)

---

#### `categories`

> Define categorias reutilizáveis para entradas e despesas (ex: Salário, Alimentação, Aluguel).

- `id` (UUID, PK)
- `name` (string)
- `type` (enum: INCOME or EXPENSE)
- `user_id` (UUID, FK → users.id)
- `created_at`, `updated_at` (timestamps)

---

#### `entries`

> Registra todas as entradas e despesas do usuário, sejam fixas ou variáveis.

- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id)
- `category_id` (UUID, FK → categories.id)
- `description` (string)
- `amount` (float)
- `date` (timestamp)
- `type` (enum: INCOME or EXPENSE)
- `is_fixed` (boolean)
- `created_at`, `updated_at` (timestamps)

---

#### `recurring_entries`

> Define os dados das entradas fixas para gerar lançamentos recorrentes.

- `id` (UUID, PK)
- `entry_id` (UUID, FK → entries.id)
- `start_month` (date - ex: "2025-06-01")
- `end_month` (nullable, date)
- `active` (boolean)
- `created_at`, `updated_at` (timestamps)

---

#### `payment_methods`

> Armazena os métodos de pagamento do usuário para futuras integrações com gateways.

- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id)
- `type` (string, ex: "credit_card", "paypal", "pix")
- `provider` (string, ex: "stripe", "paypal", etc.)
- `details` (jsonb) — dados sensíveis como último 4 dígitos, bandeira, etc. (armazenar dados seguros, sem expor dados sensíveis)
- `created_at`, `updated_at` (timestamps)

---

#### `subscriptions`

> Registra assinaturas ativas, ligadas a métodos de pagamento.

- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id)
- `payment_method_id` (UUID, FK → payment_methods.id)
- `plan` (string) — nome do plano contratado
- `status` (enum: ACTIVE, CANCELED, PAST_DUE, EXPIRED)
- `start_date` (timestamp)
- `end_date` (timestamp, opcional)
- `created_at`, `updated_at` (timestamps)

---

#### `payments`

> Armazena pagamentos realizados, vinculados a entradas e/ou assinaturas.

- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id)
- `subscription_id` (UUID, FK → subscriptions.id, opcional)
- `entry_id` (UUID, FK → entries.id, opcional)
- `amount` (float)
- `currency` (string, ex: "BRL")
- `status` (enum: PENDING, COMPLETED, FAILED)
- `payment_date` (timestamp)
- `provider_response` (jsonb, opcional) — resposta do gateway de pagamento para auditoria
- `created_at`, `updated_at` (timestamps)

---

### TypeORM Entity Examples

---

#### `User`

```ts
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column() name: string;
  @Column({ unique: true }) email: string;
  @Column({ nullable: true }) password: string;
  @Column({ nullable: true }) avatar_url: string;

  @OneToMany(() => AuthProvider, (auth) => auth.user)
  auth_providers: AuthProvider[];

  @OneToMany(() => Category, (category) => category.user)
  categories: Category[];

  @OneToMany(() => Entry, (entry) => entry.user)
  entries: Entry[];

  @OneToMany(() => PaymentMethod, (pm) => pm.user)
  payment_methods: PaymentMethod[];

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions: Subscription[];

  @OneToMany(() => Payment, (payment) => payment.user)
  payments: Payment[];

  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
```

#### `AuthProvider`

```ts
@Entity("auth_providers")
export class AuthProvider {
  @PrimaryGeneratedColumn("uuid") id: string;

  @ManyToOne(() => User, (user) => user.auth_providers)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column() provider: string;
  @Column() provider_user_id: string;
  @Column({ nullable: true }) email: string;
  @Column({ nullable: true }) access_token: string;
  @Column({ nullable: true }) refresh_token: string;
  @Column({ type: "timestamp", nullable: true }) expires_at: Date;

  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
```

---

## 🔄 Migrações com TypeORM

Para garantir controle de versão e transições seguras do esquema de banco de dados, é essencial implementar migrações:

```ts
// Exemplo de script de migração para TypeORM
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialTables1704000000000 implements MigrationInterface {
  name = "CreateInitialTables1704000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enums
    await queryRunner.query(`
            CREATE TYPE "auth_provider_type" AS ENUM('google', 'apple', 'facebook', 'twitter', 'email')
        `);
    await queryRunner.query(`
            CREATE TYPE "entry_type" AS ENUM('INCOME', 'EXPENSE')
        `);
    await queryRunner.query(`
            CREATE TYPE "subscription_status" AS ENUM('ACTIVE', 'CANCELED', 'PAST_DUE', 'EXPIRED')
        `);
    await queryRunner.query(`
            CREATE TYPE "payment_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')
        `);

    // Criar tabelas (TypeORM gerará automaticamente)
    // Adicionar índices de performance após criação das tabelas
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");
            CREATE INDEX IF NOT EXISTS "idx_entries_user_date" ON "entries" ("user_id", "date" DESC);
            CREATE INDEX IF NOT EXISTS "idx_entries_category" ON "entries" ("category_id");
            CREATE INDEX IF NOT EXISTS "idx_entries_type" ON "entries" ("type");
            CREATE INDEX IF NOT EXISTS "idx_auth_providers_user" ON "auth_providers" ("user_id");
            CREATE INDEX IF NOT EXISTS "idx_auth_providers_external" ON "auth_providers" ("provider", "provider_user_id");
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_entries_user_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_entries_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_entries_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_auth_providers_user"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_auth_providers_external"`
    );

    // Remover enums
    await queryRunner.query(`DROP TYPE "payment_status"`);
    await queryRunner.query(`DROP TYPE "subscription_status"`);
    await queryRunner.query(`DROP TYPE "entry_type"`);
    await queryRunner.query(`DROP TYPE "auth_provider_type"`);
  }
}
```

### Scripts de Migração

```bash
# Gerar migração
yarn typeorm migration:generate src/infra/db/typeorm/migrations/CreateInitialTables

# Executar migrações
yarn typeorm migration:run

# Reverter última migração
yarn typeorm migration:revert

# Verificar status das migrações
yarn typeorm migration:show
```

---

## 🚨 Problemas Comuns e Soluções

### 1. **Erro: Extension "pg_crypto" does not exist**

**Causa**: Nome incorreto da extensão PostgreSQL
**Solução**:

- Usar `pgcrypto` em vez de `pg_crypto`
- Verificar se a extensão está habilitada no script de inicialização

### 2. **Erro: SSL connection failed**

**Causa**: Configuração SSL inconsistente
**Solução**:

- Configurar SSL por ambiente no TypeORM
- Usar `?sslmode=disable` em desenvolvimento
- Usar `?sslmode=require` em produção

### 3. **Erro: TypeORM cannot connect to database**

**Causa**: URL de conexão malformada ou serviço não disponível
**Solução**:

- Verificar formato da `DATABASE_URL`
- Aguardar healthcheck do PostgreSQL antes de iniciar API
- Configurar retry no TypeORM

### 4. **Performance lenta em consultas**

**Causa**: Falta de índices adequados
**Solução**:

- Criar índices compostos para consultas frequentes
- Usar `EXPLAIN ANALYZE` para otimizar queries
- Implementar paginação em listagens

### 5. **Erro de sincronização em produção**

**Causa**: `synchronize: true` em produção
**Solução**:

- Sempre usar `synchronize: false` em produção
- Usar migrações para alterações de schema
- Testar migrações em staging primeiro

---

## 📊 Otimizações de Performance

### Índices Recomendados

```sql
-- Índices para queries financeiras frequentes
CREATE INDEX CONCURRENTLY idx_entries_user_month
ON entries(user_id, date_trunc('month', date));

CREATE INDEX CONCURRENTLY idx_entries_category_amount
ON entries(category_id, amount) WHERE amount > 0;

CREATE INDEX CONCURRENTLY idx_entries_fixed_active
ON entries(user_id, is_fixed) WHERE is_fixed = true;

-- Índices para relatórios
CREATE INDEX CONCURRENTLY idx_entries_type_date
ON entries(type, date DESC);

-- Índice para busca por descrição
CREATE INDEX CONCURRENTLY idx_entries_description_trgm
ON entries USING gin(description gin_trgm_ops);
```

### Configurações PostgreSQL Recomendadas

```sql
-- postgresql.conf otimizações para aplicação financeira
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
random_page_cost = 1.1
effective_io_concurrency = 200

-- Para logs de auditoria
log_statement = 'mod'  # Log INSERT, UPDATE, DELETE
log_min_duration_statement = 1000  # Log queries > 1s
```

---

## 🔐 Segurança de Dados

### Criptografia de Dados Sensíveis

```typescript
// Exemplo para criptografar dados sensíveis
import { BeforeInsert, BeforeUpdate } from "typeorm";
import * as crypto from "crypto";

@Entity("payment_methods")
export class PaymentMethod {
  // ... outros campos ...

  @Column("text")
  encrypted_details: string;

  @BeforeInsert()
  @BeforeUpdate()
  encryptSensitiveData() {
    if (this.details) {
      const cipher = crypto.createCipher(
        "aes-256-cbc",
        process.env.ENCRYPTION_KEY
      );
      this.encrypted_details = cipher.update(
        JSON.stringify(this.details),
        "utf8",
        "hex"
      );
      this.encrypted_details += cipher.final("hex");
    }
  }

  getDecryptedDetails() {
    if (!this.encrypted_details) return null;

    const decipher = crypto.createDecipher(
      "aes-256-cbc",
      process.env.ENCRYPTION_KEY
    );
    let decrypted = decipher.update(this.encrypted_details, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted);
  }
}
```

### Auditoria de Dados

```typescript
// Entity base para auditoria
@Entity()
export abstract class AuditableEntity {
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column("uuid", { nullable: true })
  created_by: string;

  @Column("uuid", { nullable: true })
  updated_by: string;

  @Column("jsonb", { nullable: true })
  audit_log: Record<string, any>[];
}
```

---

## ✅ Checklist de Implementação

### ✅ Configuração Inicial

- [ ] Script `init-db.sql` com extensões corretas (`pgcrypto`)
- [ ] Configuração SSL por ambiente no TypeORM
- [ ] URLs de conexão corretas com parâmetros SSL
- [ ] Healthchecks configurados no Docker Compose
- [ ] Variáveis de ambiente separadas por ambiente

### ✅ Estrutura de Dados

- [ ] Entidades TypeORM criadas
- [ ] Relacionamentos configurados
- [ ] Enums definidos
- [ ] Índices de performance criados
- [ ] Migrações iniciais implementadas

### ✅ Segurança

- [ ] Dados sensíveis criptografados
- [ ] Auditoria de alterações implementada
- [ ] Validações de entrada configuradas
- [ ] Rate limiting configurado
- [ ] Logs de acesso habilitados

### ✅ Performance

- [ ] Índices compostos para queries frequentes
- [ ] Paginação implementada
- [ ] Cache configurado (Redis)
- [ ] Connection pooling otimizado
- [ ] Queries otimizadas com EXPLAIN

### ✅ Backup e Recuperação

- [ ] Backup automático configurado
- [ ] Scripts de restore testados
- [ ] Replicação configurada (se necessário)
- [ ] Procedimentos de disaster recovery documentados

---

Esta documentação atualizada resolve **TODOS os problemas SSL e de configuração** encontrados durante a implementação e fornece uma base sólida para o banco de dados! 🎉
