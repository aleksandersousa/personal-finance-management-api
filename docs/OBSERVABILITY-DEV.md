# 🔍 Observabilidade em Desenvolvimento

## 🚀 Início Rápido

### 1. Subir todos os serviços (API + Observabilidade)

```bash
# Subir API, Database, Prometheus e Grafana
docker-compose up -d

# Verificar se todos os serviços estão funcionando
docker-compose ps
```

### 2. Acessar ferramentas

- **API Health**: http://localhost:3000/api/v1/health
- **API Metrics**: http://localhost:3000/api/v1/metrics
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin123)

## 📊 Dashboard Automático

O Grafana já vem configurado com um dashboard chamado **"Financial API - Development Overview"** que inclui:

- **Request Rate**: Requisições por segundo
- **API Success Rate**: Taxa de sucesso (gauge)
- **Response Time Percentiles**: P50, P95, P99
- **Financial Transactions Rate**: Transações financeiras
- **Authentication Events**: Eventos de autenticação
- **Active Users**: Usuários ativos

## 🛠️ Como Usar Durante o Desenvolvimento

### 1. Monitoramento em Tempo Real

1. Abra o Grafana: http://localhost:3001
2. Login: `admin` / `admin123`
3. Vá para **Dashboards** → **Financial Management** → **Financial API - Development Overview**
4. Configure refresh para **5s** para ver dados em tempo real

### 2. Teste sua API e veja as métricas

```bash
# Fazer algumas requisições para gerar dados
curl http://localhost:3000/api/v1/health
curl http://localhost:3000/api/v1/metrics

# Se você tiver endpoints de transações, teste-os também
# curl -X POST http://localhost:3000/api/v1/entries -H "Content-Type: application/json" -d '{"amount": 100, "type": "INCOME"}'
```

### 3. Verificar logs estruturados

```bash
# Ver logs em tempo real
docker-compose logs -f api

# Ver apenas logs da aplicação (sem Docker)
tail -f logs/combined.log

# Ver apenas erros
tail -f logs/error.log
```

## 🔍 Troubleshooting Comum

### Prometheus não está coletando métricas

```bash
# 1. Verificar se API está expondo métricas
curl http://localhost:3000/api/v1/metrics

# 2. Verificar se Prometheus consegue acessar a API
docker-compose exec prometheus wget -qO- http://api:3000/api/v1/metrics

# 3. Verificar targets no Prometheus
# Abrir http://localhost:9090/targets
```

### Grafana não mostra dados

1. Verifique se o datasource Prometheus está funcionando:

   - Grafana → Configuration → Data sources → Prometheus
   - Click em **Test** - deve retornar "Data source is working"

2. Verifique se há dados no Prometheus:
   - Abra http://localhost:9090
   - Digite: `http_requests_total`
   - Click **Execute**

### Logs não aparecem

```bash
# Verificar se diretório de logs existe
ls -la logs/

# Criar se não existir
mkdir -p logs

# Verificar permissões
sudo chown -R $USER:$USER logs/
```

## 📈 Métricas Disponíveis para Desenvolvimento

### HTTP Metrics

- `http_requests_total` - Total de requisições HTTP
- `http_request_duration_seconds` - Duração das requisições

### Business Metrics

- `financial_transactions_total` - Total de transações financeiras
- `auth_events_total` - Eventos de autenticação
- `financial_active_users` - Usuários ativos

### Error Metrics

- `api_errors_total` - Total de erros da API

## 🎯 Comandos Úteis para Desenvolvimento

```bash
# Reiniciar apenas observabilidade (mantém dados da API)
docker-compose restart prometheus grafana

# Ver status dos containers
docker-compose ps

# Ver logs de um serviço específico
docker-compose logs -f grafana
docker-compose logs -f prometheus

# Entrar no container da API para debug
docker-compose exec api bash

# Limpar dados de métricas (resetar Prometheus)
docker-compose down
docker volume rm api_prometheus_data_dev
docker-compose up -d
```

## ⚡ Performance em Desenvolvimento

### Configurações Otimizadas para Dev

O `docker-compose.override.yml` já está configurado com:

- **Prometheus retention**: 7 dias (vs 15 dias em produção)
- **Grafana session**: 2 horas
- **Scrape interval**: 15s (suficiente para desenvolvimento)
- **Log level**: Info (não debug para evitar spam)

### Recursos Utilizados

- **Prometheus**: ~100MB RAM
- **Grafana**: ~50MB RAM
- **Total adicional**: ~150MB RAM

## 🔄 Workflow de Desenvolvimento

1. **Desenvolver feature** → código
2. **Testar endpoint** → `curl` ou Postman
3. **Verificar métricas** → Grafana dashboard
4. **Analisar logs** → `logs/combined.log`
5. **Otimizar se necessário** → baseado nas métricas

## 🚨 Alertas Básicos (Opcional)

Se quiser configurar alertas básicos durante desenvolvimento:

1. No Grafana, vá para **Alerting** → **Alert Rules**
2. Crie regras como:
   - API response time > 2s
   - Error rate > 5%
   - API down

## 📋 Checklist Diário

- [ ] Dashboard Grafana carregando
- [ ] Métricas sendo coletadas (verificar últimos 5min)
- [ ] Logs sendo gerados em `logs/`
- [ ] Health check retornando `200 OK`
- [ ] Prometheus targets `UP`

---

## 💡 Dicas Pro

1. **Use o dashboard como segunda tela** enquanto desenvolve
2. **Configure alertas no browser** para não perder notificações importantes
3. **Analise padrões de performance** antes de cada commit
4. **Use os logs para debug** em vez de `console.log`
5. **Monitore memory usage** para detectar vazamentos

## 🎓 Para Aprender Mais

- **Prometheus Query Language (PromQL)**: https://prometheus.io/docs/prometheus/latest/querying/
- **Grafana Dashboards**: https://grafana.com/docs/grafana/latest/dashboards/
- **Observability Best Practices**: https://opentelemetry.io/docs/

---

**Lembre-se**: A observabilidade em desenvolvimento é uma ferramenta de aprendizado. Use-a para entender como sua aplicação se comporta e para identificar problemas antes que cheguem à produção! 🎯
