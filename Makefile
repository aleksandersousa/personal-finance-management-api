# Makefile para Personal Financial Management API

.PHONY: help dev prod build-dev build-prod logs-dev logs-prod down-dev down-prod clean-dev clean-prod test lint

# Configurações
DEV_COMPOSE_FILE := .docker/docker-compose.dev.yml
PROD_COMPOSE_FILE := .docker/docker-compose.prod.yml
DEV_ENV_FILE := .env.development
PROD_ENV_FILE := .env.production

# Comandos padrão
help: ## Mostra esta ajuda
	@echo "Comandos disponíveis:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

# Desenvolvimento
dev: ## Inicia ambiente de desenvolvimento
	docker-compose -f $(DEV_COMPOSE_FILE) --env-file $(DEV_ENV_FILE) up -d

build-dev: ## Reconstrói e inicia ambiente de desenvolvimento
	docker-compose -f $(DEV_COMPOSE_FILE) --env-file $(DEV_ENV_FILE) up -d --build

logs-dev: ## Mostra logs do ambiente de desenvolvimento
	docker-compose -f $(DEV_COMPOSE_FILE) --env-file $(DEV_ENV_FILE) logs -f

down-dev: ## Para ambiente de desenvolvimento
	docker-compose -f $(DEV_COMPOSE_FILE) --env-file $(DEV_ENV_FILE) down

clean-dev: ## Limpa completamente ambiente de desenvolvimento
	docker-compose -f $(DEV_COMPOSE_FILE) --env-file $(DEV_ENV_FILE) down -v --remove-orphans
	docker system prune -f

# Produção
prod: ## Inicia ambiente de produção
	docker-compose -f $(PROD_COMPOSE_FILE) --env-file $(PROD_ENV_FILE) up -d

build-prod: ## Reconstrói e inicia ambiente de produção
	docker-compose -f $(PROD_COMPOSE_FILE) --env-file $(PROD_ENV_FILE) up -d --build

logs-prod: ## Mostra logs do ambiente de produção
	docker-compose -f $(PROD_COMPOSE_FILE) --env-file $(PROD_ENV_FILE) logs -f

down-prod: ## Para ambiente de produção
	docker-compose -f $(PROD_COMPOSE_FILE) --env-file $(PROD_ENV_FILE) down

clean-prod: ## Limpa completamente ambiente de produção
	docker-compose -f $(PROD_COMPOSE_FILE) --env-file $(PROD_ENV_FILE) down -v --remove-orphans

# Banco de dados
db-dev: ## Inicia apenas o banco de desenvolvimento
	docker-compose -f $(DEV_COMPOSE_FILE) --env-file $(DEV_ENV_FILE) up -d db

db-prod: ## Inicia apenas o banco de produção
	docker-compose -f $(PROD_COMPOSE_FILE) --env-file $(PROD_ENV_FILE) up -d db

# Testes e Linting
test: ## Executa testes
	yarn test

test-cov: ## Executa testes com cobertura
	yarn test:cov

test-e2e: ## Executa testes e2e
	yarn test:e2e

lint: ## Executa linting
	yarn lint

format: ## Formata código
	yarn format

# Migrações
migration-generate: ## Gera nova migração
	yarn migration:generate -- src/infra/db/typeorm/migrations/$(name)

migration-run: ## Executa migrações
	yarn migration:run

migration-revert: ## Reverte última migração
	yarn migration:revert

# Status
status-dev: ## Mostra status dos containers de desenvolvimento
	docker-compose -f $(DEV_COMPOSE_FILE) --env-file $(DEV_ENV_FILE) ps

status-prod: ## Mostra status dos containers de produção
	docker-compose -f $(PROD_COMPOSE_FILE) --env-file $(PROD_ENV_FILE) ps

# Backup (apenas produção)
backup-db: ## Faz backup do banco de produção
	docker-compose -f $(PROD_COMPOSE_FILE) --env-file $(PROD_ENV_FILE) exec db pg_dump -U $$DB_USER -d $$DB_NAME > backup_$(shell date +%Y%m%d_%H%M%S).sql

# Instalação
install: ## Instala dependências
	yarn install

setup-dev: ## Configura ambiente de desenvolvimento
	cp env.dev.example .env.development
	cp .env.development .env
	make install
	make build-dev

setup-prod: ## Configura ambiente de produção
	cp env.prod.example .env.production
	@echo "⚠️  Edite o arquivo .env.production com suas configurações de produção!"
	@echo "⚠️  Não esqueça de alterar JWT_SECRET e senhas!" 