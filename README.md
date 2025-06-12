# Personal Financial Management API

Uma API REST completa para gerenciamento de finanças pessoais, desenvolvida com **NestJS**, **TypeORM** e **PostgreSQL**, seguindo os princípios da **Clean Architecture**.

## 📋 Características

- ✅ **Clean Architecture** com separação clara de responsabilidades
- ✅ **TypeScript** para type safety
- ✅ **PostgreSQL** como banco de dados
- ✅ **Docker** para facilitar desenvolvimento e deploy
- ✅ **Swagger** para documentação automática da API
- ✅ **JWT** para autenticação e autorização
- ✅ **Testes unitários e E2E** com Jest
- ✅ **Rate limiting** para proteção contra abuso
- ✅ **Validação** robusta de dados de entrada

## 🎯 Story 1: Add Fixed Income - Implementada

Esta API implementa completamente o caso de uso **"Story 1: Add fixed income"**:

- **Endpoint**: `POST /api/v1/entries`
- **Funcionalidade**: Permite registrar salários e outras rendas fixas
- **Segurança**: Protegido por JWT authentication
- **Validação**: Dados de entrada rigorosamente validados
- **Documentação**: Totalmente documentado no Swagger

## 🏗️ Arquitetura

```
src/
├── domain/          # Regras de negócio e interfaces
│   ├── models/      # Modelos de domínio
│   └── usecases/    # Interfaces dos casos de uso
├── data/            # Implementação dos casos de uso
│   ├── protocols/   # Contratos para infraestrutura
│   └── usecases/    # Implementações concretas
├── infra/           # Infraestrutura e frameworks
│   ├── db/          # TypeORM entities e repositórios
│   └── implementations/ # Implementações dos protocolos
├── presentation/    # Controllers e DTOs
│   ├── controllers/ # Controllers do NestJS
│   ├── dtos/        # Data Transfer Objects
│   └── guards/      # Guards de autenticação
└── main/            # Composição e módulos
    ├── factories/   # Factories para DI
    └── modules/     # Módulos do NestJS
```

## 🚀 Como Executar

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- npm ou yarn

### 1. Clone o repositório

```bash
git clone <repository-url>
cd personal-financial-management-api
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o ambiente

```bash
# Crie o arquivo .env baseado no .env.example
cp .env.example .env

# Edite as variáveis conforme necessário
```

### 4. Execute com Docker (Recomendado)

```bash
# Inicia todos os serviços (API + PostgreSQL)
docker-compose up -d

# Visualize os logs
docker-compose logs -f api
```

### 5. Ou execute localmente

```bash
# Inicie apenas o PostgreSQL
docker-compose up -d db

# Execute a aplicação
npm run start:dev
```

## 📚 Documentação da API

Após iniciar a aplicação, acesse:

- **Swagger UI**: http://localhost:3000/api/v1/docs
- **API Base URL**: http://localhost:3000/api/v1

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Coverage
npm run test:cov
```

## 🔑 Autenticação

A API utiliza JWT Bearer tokens. Para testar os endpoints protegidos:

1. Faça login para obter um token JWT (endpoint será implementado em stories futuras)
2. Inclua o token no header: `Authorization: Bearer <seu-token>`

## 📝 Exemplo de Uso - Story 1

### Criar uma renda fixa (salário)

```bash
curl -X POST http://localhost:3000/api/v1/entries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <seu-jwt-token>" \
  -d '{
    "description": "Salário - Janeiro 2025",
    "amount": 5000.00,
    "date": "2025-01-15T10:00:00Z",
    "type": "INCOME",
    "isFixed": true,
    "categoryId": "optional-category-uuid"
  }'
```

### Resposta esperada:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "user-uuid",
  "description": "Salário - Janeiro 2025",
  "amount": 5000.0,
  "date": "2025-01-15T10:00:00.000Z",
  "type": "INCOME",
  "isFixed": true,
  "categoryId": "optional-category-uuid",
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-01-15T10:00:00.000Z"
}
```

## 📊 Banco de Dados

### Estrutura das Tabelas

- **users**: Usuários do sistema
- **entries**: Entradas financeiras (receitas e despesas)
- **categories**: Categorias para organização
- **auth_providers**: Provedores de autenticação

### Migrações

```bash
# Gerar nova migração
npm run migration:generate -- src/infra/db/typeorm/migrations/NewMigration

# Executar migrações
npm run migration:run

# Reverter migração
npm run migration:revert
```

## 🛡️ Segurança

- ✅ **JWT Authentication** para todas as rotas protegidas
- ✅ **Rate Limiting** configurável
- ✅ **Helmet** para headers de segurança
- ✅ **CORS** configurado adequadamente
- ✅ **Validação** rigorosa de entrada
- ✅ **SQL Injection** prevenido pelo TypeORM

## 🔧 Configuração

### Variáveis de Ambiente

| Variável         | Descrição                       | Padrão                                                       |
| ---------------- | ------------------------------- | ------------------------------------------------------------ |
| `DATABASE_URL`   | URL do PostgreSQL               | `postgresql://postgres:postgres@localhost:5432/financial_db` |
| `NODE_ENV`       | Ambiente da aplicação           | `development`                                                |
| `PORT`           | Porta da aplicação              | `3000`                                                       |
| `API_PREFIX`     | Prefixo da API                  | `api/v1`                                                     |
| `JWT_SECRET`     | Chave secreta para JWT          | `your-jwt-secret-key-here`                                   |
| `JWT_EXPIRES_IN` | Tempo de expiração do JWT       | `15m`                                                        |
| `THROTTLE_TTL`   | TTL do rate limiting (segundos) | `60`                                                         |
| `THROTTLE_LIMIT` | Limite de requisições por TTL   | `10`                                                         |

## 🚀 Deploy

### Configuração por Ambiente

O projeto possui configurações específicas para cada ambiente:

- **Desenvolvimento**: `Dockerfile.dev` + `docker-compose.dev.yml`
- **Produção**: `Dockerfile.prod` + `docker-compose.prod.yml`

### Início Rápido

#### Desenvolvimento

```bash
# Configurar ambiente de desenvolvimento
make setup-dev

# Ou manualmente:
cp env.dev.example .env
yarn install
yarn docker:dev:build
```

#### Produção

```bash
# Configurar ambiente de produção
make setup-prod
# Edite o arquivo .env com suas configurações!

# Ou manualmente:
cp env.prod.example .env
# Edite as variáveis sensíveis (JWT_SECRET, senhas, etc.)
yarn docker:prod:build
```

### Comandos Disponíveis

#### Via Makefile

```bash
make help                 # Lista todos os comandos disponíveis
make dev                  # Inicia ambiente de desenvolvimento
make build-dev            # Reconstrói e inicia desenvolvimento
make logs-dev             # Mostra logs de desenvolvimento
make prod                 # Inicia ambiente de produção
make build-prod           # Reconstrói e inicia produção
make test                 # Executa testes
make lint                 # Executa linting
```

#### Via NPM/Yarn

```bash
# Desenvolvimento
yarn docker:dev          # Inicia ambiente de desenvolvimento
yarn docker:dev:build    # Reconstrói e inicia desenvolvimento
yarn docker:dev:logs     # Mostra logs de desenvolvimento
yarn docker:dev:down     # Para ambiente de desenvolvimento
yarn docker:dev:clean    # Limpa completamente ambiente de desenvolvimento

# Produção
yarn docker:prod         # Inicia ambiente de produção
yarn docker:prod:build   # Reconstrói e inicia produção
yarn docker:prod:logs    # Mostra logs de produção
yarn docker:prod:down    # Para ambiente de produção
yarn docker:prod:clean   # Limpa completamente ambiente de produção
```

### Estrutura de Arquivos

```
├── .docker/                 # Configurações Docker
│   ├── Dockerfile.dev       # Docker para desenvolvimento
│   ├── Dockerfile.prod      # Docker para produção
│   ├── docker-compose.yml   # Compose base
│   ├── docker-compose.dev.yml  # Compose para desenvolvimento
│   ├── docker-compose.prod.yml # Compose para produção
│   └── README.md           # Documentação Docker
├── .env                    # Variáveis de ambiente padrão
├── .env.development        # Variáveis de ambiente - dev
├── .env.production         # Variáveis de ambiente - prod
├── env.dev.example         # Exemplo - dev
├── env.prod.example        # Exemplo - prod
└── Makefile                # Comandos úteis
```

docker-compose -f docker-compose.prod.yml up -d

```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🎯 Próximas Stories

- [ ] Story 2: View summary
- [ ] Story 3: Add dynamic expense
- [ ] Story 4: Update an entry
- [ ] Story 5: Delete an entry
- [ ] Story 6: List entries by month
- [ ] Story 7: Predict cash flow
- [ ] Story 8: Manage categories
- [ ] Story 9: User registration and login
- [ ] Story 10: Social authentication
- [ ] Story 11: Refresh session
- [ ] Story 12: Manage recurring entries

---

## 📞 Suporte

Para dúvidas, problemas ou sugestões, abra uma issue no repositório.
```
