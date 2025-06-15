# 🚀 CI/CD Quick Start Guide

## 📋 Setup Rápido

```bash
# Validar setup do CI/CD
npm run ci:validate

# Configurar CI/CD
npm run ci:setup
```

## 🛠️ Scripts de Deploy

```bash
# Development
npm run deploy:dev

# Staging
npm run deploy:staging

# Production
npm run deploy:prod

# Ajuda
npm run deploy:help
```

## 📊 Monitoramento

```bash
# Monitorar development
npm run monitor:dev

# Monitorar staging
npm run monitor:staging

# Monitorar production
npm run monitor:prod

# Monitorar todos os ambientes
npm run monitor:all

# Ajuda de monitoramento
npm run monitor:help
```

## 🌊 Fluxo Básico

### 1. Feature Development

```bash
git checkout develop
git checkout -b feature/nova-funcionalidade
# Desenvolvimento...
git add .
git commit -m "feat: nova funcionalidade"
git push origin feature/nova-funcionalidade
# Criar PR para develop via GitHub
```

### 2. Deploy para Staging

```bash
git checkout staging
git merge develop
git push origin staging
# Deploy automático via GitHub Actions
```

### 3. Deploy para Production

```bash
git checkout main
git merge staging
git push origin main
# Deploy automático com aprovação manual
```

## 🔧 Comandos Úteis

```bash
# Validar se workflows estão corretos
ls -la .github/workflows/

# Testar scripts localmente
./scripts/deploy.sh development --dry-run

# Monitorar deployment em progresso
./scripts/monitor-deployment.sh production --continuous

# Rollback de emergência
./scripts/deploy.sh production --rollback
```

## 🚨 Troubleshooting Rápido

```bash
# Se deploy falhar
npm run monitor:prod --verbose

# Se tests falharem no CI
npm test
npm run test:e2e

# Ver logs de deployment
ls -la logs/monitoring/

# Forçar redeploy (emergência)
./scripts/deploy.sh production --force --skip-tests
```

## 📚 Documentação Completa

Para documentação completa, leia: [docs/CI-CD-SETUP.md](docs/CI-CD-SETUP.md)

## 🎯 Environments

- **Development:** http://localhost:3000
- **Staging:** https://staging.financial-app.com
- **Production:** https://financial-app.com

---

**Tip:** Use `npm run deploy:help` e `npm run monitor:help` para ver todas as opções disponíveis!
