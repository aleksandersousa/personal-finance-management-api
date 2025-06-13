# Observability Configuration

Esta pasta contém todas as configurações necessárias para observabilidade em desenvolvimento.

## Estrutura

```
observability/
├── README.md                           # Este arquivo
├── prometheus.yml                      # Configuração do Prometheus
└── grafana/
    ├── provisioning/
    │   ├── datasources/
    │   │   └── datasources.yml         # Datasources do Grafana
    │   └── dashboards/
    │       └── dashboards.yml          # Configuração de dashboards
    └── dashboards/
        └── financial-api-overview.json # Dashboard principal
```

## Como Funciona

1. **docker-compose.override.yml**: Estende o docker-compose.yml principal com Prometheus e Grafana
2. **prometheus.yml**: Configura coleta de métricas da API
3. **grafana/**: Configuração automática do Grafana com dashboard pré-configurado

## Uso

```bash
# Subir tudo
docker-compose up -d

# Acessar
# - Grafana: http://localhost:3001 (admin/admin123)
# - Prometheus: http://localhost:9090
# - API Metrics: http://localhost:3000/api/v1/metrics
```

## Customização

- **prometheus.yml**: Adicionar novos jobs ou alterar intervalos
- **grafana/dashboards/**: Adicionar novos dashboards JSON
- **grafana/provisioning/**: Modificar datasources ou configurações

Para mais detalhes, veja `OBSERVABILITY-DEV.md` na raiz do projeto.
