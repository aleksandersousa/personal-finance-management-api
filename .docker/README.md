# Docker Configuration

Esta pasta contém todos os arquivos relacionados ao Docker para a API de Gestão Financeira Pessoal.

## 📁 Estrutura dos Arquivos

```
.docker/
├── Dockerfile.dev           # Dockerfile para desenvolvimento
├── Dockerfile.prod          # Dockerfile para produção
├── docker-compose.yml       # Compose base (configurável)
├── docker-compose.dev.yml   # Compose específico para desenvolvimento
├── docker-compose.prod.yml  # Compose específico para produção
└── README.md               # Este arquivo
```

## 🐳 Dockerfiles

### Dockerfile.dev

- **Propósito**: Ambiente de desenvolvimento com hot reload
- **Características**:
  - Instala todas as dependências (incluindo devDependencies)
  - Volume mounting para código fonte
  - Executa com `yarn start:dev`
  - Sem otimizações de produção

### Dockerfile.prod

- **Propósito**: Ambiente de produção otimizado
- **Características**:
  - Multi-stage build
  - Apenas dependências de produção
  - Imagem final mínima
  - Usuário não-root para segurança
  - Healthcheck configurado

## 🔧 Docker Compose Files

### docker-compose.dev.yml

- **Ambiente**: Desenvolvimento
- **Características**:
  - Hot reload habilitado
  - Volumes para código fonte
  - Rate limiting permissivo
  - Logs detalhados
  - SSL desabilitado

### docker-compose.prod.yml

- **Ambiente**: Produção
- **Características**:
  - Inclui Nginx como reverse proxy
  - SSL configurado
  - Rate limiting restritivo
  - Recursos limitados
  - Logs otimizados
  - Volumes persistentes para dados

## 🚀 Como Usar

### Desenvolvimento

```bash
# Via NPM/Yarn
yarn docker:dev:build

# Via Makefile
make build-dev

# Via Docker Compose direto
docker-compose -f .docker/docker-compose.dev.yml --env-file .env.development up -d --build
```

### Produção

```bash
# Via NPM/Yarn
yarn docker:prod:build

# Via Makefile
make build-prod

# Via Docker Compose direto
docker-compose -f .docker/docker-compose.prod.yml --env-file .env.production up -d --build
```

## 📋 Variáveis de Ambiente

Os arquivos de ambiente devem estar na raiz do projeto:

- `.env.development` - Variáveis para desenvolvimento
- `.env.production` - Variáveis para produção
- `.env` - Arquivo padrão (cópia do development)

## 🔒 Segurança

### Desenvolvimento

- SSL desabilitado para simplicidade
- Rate limiting permissivo
- Logs verbosos

### Produção

- SSL obrigatório
- Rate limiting restritivo
- Usuário não-root
- Recursos limitados
- Logs otimizados

## 📊 Monitoramento

### Healthchecks

- **API**: `GET /api/v1/health`
- **Database**: `pg_isready`

### Logs

```bash
# Desenvolvimento
make logs-dev

# Produção
make logs-prod
```

## 🗄️ Volumes

### Desenvolvimento

- **Código fonte**: Hot reload via volume mounting
- **node_modules**: Volume separado para performance
- **Banco**: Volume temporário

### Produção

- **Dados do banco**: Volume persistente
- **Backups**: Volume para backups
- **Logs**: Volume para logs do Nginx
- **SSL**: Volume para certificados

## 🌐 Networking

### Desenvolvimento

- **Rede**: `financial-network-dev`
- **Portas expostas**: 3000 (API), 5432 (DB)

### Produção

- **Rede**: `financial-network-prod`
- **Subnet**: 172.20.0.0/16
- **Portas expostas**: 80 (HTTP), 443 (HTTPS), 5432 (DB)

## 🔄 Comandos Úteis

```bash
# Status dos containers
make status-dev    # ou status-prod

# Logs específicos
docker logs financial-api-dev
docker logs financial-db-dev

# Backup do banco (produção)
make backup-db

# Limpeza completa
make clean-dev     # ou clean-prod
```
