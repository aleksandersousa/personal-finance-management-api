# 📚 Scripts de Observabilidade - Guia Completo

Este documento detalha todos os scripts `npm run obs:*` disponíveis para gerenciar observabilidade por ambiente.

## 🚀 Início Rápido

```bash
# Configuração inicial (primeira vez)
npm run obs:setup

# Verificar se está funcionando
npm run obs:test

# Ver todas as URLs de monitoramento
npm run obs:monitor

# Ver ajuda completa
npm run obs:help
```

## 🏗️ Ambientes Suportados

### 🔧 Development (Desenvolvimento)

- **Arquivo**: `docker-compose.override.yml`
- **Características**: Logs detalhados, retenção de 7 dias, debug habilitado
- **Recursos**: ~150MB RAM adicional

### 🧪 Staging (Homologação)

- **Arquivo**: `docker-compose.override.yml` (mesmo do dev)
- **Características**: Configuração similar ao desenvolvimento para testes

### 🚀 Production (Produção)

- **Arquivo**: `docker-compose.prod.observability.yml`
- **Características**: Logs otimizados, retenção de 30 dias, segurança reforçada
- **Recursos**: Otimizado para performance

## 📋 Scripts por Categoria

### 🔧 Development Environment

| Script                    | Descrição                        | Exemplo de Uso                    |
| ------------------------- | -------------------------------- | --------------------------------- |
| `obs:dev`                 | Inicia API + Observabilidade     | `npm run obs:dev`                 |
| `obs:dev:build`           | Inicia com rebuild               | `npm run obs:dev:build`           |
| `obs:dev:down`            | Para todos os serviços           | `npm run obs:dev:down`            |
| `obs:dev:clean`           | Para e remove volumes            | `npm run obs:dev:clean`           |
| `obs:dev:logs`            | Mostra logs de todos os serviços | `npm run obs:dev:logs`            |
| `obs:dev:logs:api`        | Logs apenas da API               | `npm run obs:dev:logs:api`        |
| `obs:dev:logs:prometheus` | Logs do Prometheus               | `npm run obs:dev:logs:prometheus` |
| `obs:dev:logs:grafana`    | Logs do Grafana                  | `npm run obs:dev:logs:grafana`    |
| `obs:dev:restart`         | Reinicia Prometheus + Grafana    | `npm run obs:dev:restart`         |
| `obs:dev:status`          | Status dos containers            | `npm run obs:dev:status`          |
| `obs:dev:metrics`         | Mostra métricas da API           | `npm run obs:dev:metrics`         |
| `obs:dev:health`          | Verifica health da API           | `npm run obs:dev:health`          |
| `obs:dev:reset`           | Reset completo (limpa dados)     | `npm run obs:dev:reset`           |

### 🚀 Production Environment

| Script            | Descrição                       | Exemplo de Uso            |
| ----------------- | ------------------------------- | ------------------------- |
| `obs:prod`        | Inicia observabilidade produção | `npm run obs:prod`        |
| `obs:prod:down`   | Para observabilidade produção   | `npm run obs:prod:down`   |
| `obs:prod:logs`   | Logs de produção                | `npm run obs:prod:logs`   |
| `obs:prod:status` | Status produção                 | `npm run obs:prod:status` |
| `obs:prod:health` | Health check produção           | `npm run obs:prod:health` |
| `obs:prod:reset`  | Reset produção                  | `npm run obs:prod:reset`  |

### 🧪 Staging Environment

| Script               | Descrição      | Exemplo de Uso               |
| -------------------- | -------------- | ---------------------------- |
| `obs:staging`        | Inicia staging | `npm run obs:staging`        |
| `obs:staging:down`   | Para staging   | `npm run obs:staging:down`   |
| `obs:staging:logs`   | Logs staging   | `npm run obs:staging:logs`   |
| `obs:staging:status` | Status staging | `npm run obs:staging:status` |

### 📊 Monitoring & Utilities

| Script          | Descrição                         | Exemplo de Uso          |
| --------------- | --------------------------------- | ----------------------- |
| `obs:monitor`   | Mostra URLs de monitoramento      | `npm run obs:monitor`   |
| `obs:test`      | Testa se observabilidade funciona | `npm run obs:test`      |
| `obs:check:all` | Verifica todos os ambientes       | `npm run obs:check:all` |
| `obs:help`      | Ajuda completa                    | `npm run obs:help`      |

### 📝 Logs Management

| Script                 | Descrição                  | Exemplo de Uso                 |
| ---------------------- | -------------------------- | ------------------------------ |
| `obs:logs:tail`        | Tail dos logs da aplicação | `npm run obs:logs:tail`        |
| `obs:logs:tail:errors` | Tail apenas dos erros      | `npm run obs:logs:tail:errors` |
| `obs:logs:clean`       | Limpa arquivos de log      | `npm run obs:logs:clean`       |

### 💾 Backup & Restore

| Script            | Descrição                       | Exemplo de Uso            |
| ----------------- | ------------------------------- | ------------------------- |
| `obs:backup:dev`  | Backup métricas desenvolvimento | `npm run obs:backup:dev`  |
| `obs:backup:prod` | Backup métricas produção        | `npm run obs:backup:prod` |

### 🔧 Setup & Configuration

| Script                    | Descrição                     | Exemplo de Uso                    |
| ------------------------- | ----------------------------- | --------------------------------- |
| `obs:setup`               | Configuração inicial completa | `npm run obs:setup`               |
| `obs:dev:open:grafana`    | Abre Grafana no browser       | `npm run obs:dev:open:grafana`    |
| `obs:dev:open:prometheus` | Abre Prometheus no browser    | `npm run obs:dev:open:prometheus` |

## 🎯 Workflows Comuns

### 🏗️ Desenvolvimento Diário

```bash
# Manhã - Iniciar desenvolvimento
npm run obs:dev

# Durante o desenvolvimento - monitorar
npm run obs:dev:logs:api        # Ver logs da API
npm run obs:dev:status          # Ver status dos serviços
npm run obs:test               # Verificar se está funcionando

# Fim do dia - parar serviços
npm run obs:dev:down
```

### 🚀 Deploy para Produção

```bash
# Antes do deploy - backup
npm run obs:backup:prod

# Deploy da observabilidade
npm run obs:prod

# Verificar se funcionou
npm run obs:prod:health
npm run obs:prod:status

# Monitorar logs
npm run obs:prod:logs
```

### 🔍 Troubleshooting

```bash
# Verificar status de tudo
npm run obs:check:all

# Ver métricas brutas
npm run obs:dev:metrics

# Reiniciar apenas observabilidade
npm run obs:dev:restart

# Reset completo se necessário
npm run obs:dev:reset
```

### 📊 Monitoramento

```bash
# Ver todas as URLs
npm run obs:monitor

# Abrir dashboards
npm run obs:dev:open:grafana
npm run obs:dev:open:prometheus

# Monitorar logs em tempo real
npm run obs:logs:tail
```

## 🔧 Configurações por Ambiente

### Development

```yaml
# Características:
- LOG_LEVEL: info
- Retenção: 7 dias
- Scrape interval: 15s
- Health check: 30s
- Console logs: habilitado
```

### Production

```yaml
# Características:
- LOG_LEVEL: warn
- Retenção: 30 dias
- Scrape interval: 30s
- Health check: 60s
- Console logs: desabilitado
- Métricas filtradas
```

## 📈 URLs de Acesso por Ambiente

### Development

- **Grafana**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **API Health**: http://localhost:3000/api/v1/health
- **API Metrics**: http://localhost:3000/api/v1/metrics

### Production

- **Grafana**: http://localhost:3001 (admin/CHANGE_PASSWORD)
- **Prometheus**: http://localhost:9090
- **API Health**: http://localhost:3000/api/v1/health

## 🚨 Scripts de Emergência

```bash
# Parar tudo imediatamente
npm run obs:dev:down

# Limpar tudo e recomeçar
npm run obs:dev:clean
npm run obs:setup

# Backup de emergência
npm run obs:backup:dev
npm run obs:backup:prod

# Verificar o que está rodando
npm run obs:dev:status
docker ps
```

## 💡 Dicas e Truques

### 🔍 Debug

```bash
# Ver logs em tempo real durante desenvolvimento
npm run obs:dev:logs:api

# Ver apenas erros
npm run obs:logs:tail:errors

# Verificar métricas específicas
npm run obs:dev:metrics | grep "http_requests"
```

### ⚡ Performance

```bash
# Verificar uso de recursos
docker stats

# Limpar logs antigos
npm run obs:logs:clean

# Restart apenas observabilidade (não API)
npm run obs:dev:restart
```

### 📊 Monitoramento Avançado

```bash
# Backup automático (adicionar ao cron)
0 2 * * * cd /path/to/project && npm run obs:backup:prod

# Verificação de saúde (adicionar ao monitoramento)
*/5 * * * * cd /path/to/project && npm run obs:test
```

## 🎓 Exemplos Práticos

### Cenário 1: Primeiro uso

```bash
# 1. Configurar pela primeira vez
npm run obs:setup

# 2. Abrir dashboards
npm run obs:dev:open:grafana

# 3. Testar API e ver métricas
curl http://localhost:3000/api/v1/health
# Refresh dashboard no Grafana
```

### Cenário 2: Problema em produção

```bash
# 1. Backup antes de qualquer coisa
npm run obs:backup:prod

# 2. Verificar logs
npm run obs:prod:logs | grep ERROR

# 3. Verificar status
npm run obs:prod:status

# 4. Restart se necessário
npm run obs:prod:restart
```

### Cenário 3: Desenvolvimento de nova feature

```bash
# 1. Iniciar ambiente
npm run obs:dev

# 2. Desenvolver e testar...

# 3. Monitorar impacto
npm run obs:dev:open:grafana
# Verificar dashboards de performance

# 4. Verificar logs
npm run obs:logs:tail
```

---

## 🆘 Precisa de Ajuda?

```bash
# Ajuda rápida
npm run obs:help

# Verificar se tudo está funcionando
npm run obs:test

# Ver todas as URLs
npm run obs:monitor
```

**Lembre-se**: Use `npm run obs:help` a qualquer momento para ver todos os comandos disponíveis! 🚀
