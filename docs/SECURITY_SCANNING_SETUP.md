# 🛡️ Security Scanning Setup

Este documento explica como configurar o security scanning no GitHub para o projeto.

## 🔧 Configuração Atual

O workflow já está configurado com **Trivy vulnerability scanning** que funciona independentemente do GitHub Code Scanning. Ele:

- ✅ Escaneia vulnerabilidades HIGH e CRITICAL
- ✅ Gera relatórios em formato JSON
- ✅ Faz upload dos relatórios como artifacts
- ✅ Comenta resultados em Pull Requests
- ✅ Não falha o build por vulnerabilidades (apenas alerta)

## 📊 Como Funciona

### 1. **Scan Automático**

- Executa após o build da imagem Docker
- Escaneia a imagem final de produção
- Foca em vulnerabilidades HIGH e CRITICAL

### 2. **Relatórios**

- **Console**: Tabela resumida no log do workflow
- **JSON**: Relatório detalhado salvo como artifact
- **PR Comments**: Resumo automático em Pull Requests

### 3. **Artifacts**

- Relatórios ficam disponíveis por 30 dias
- Download via interface do GitHub Actions

## 🚀 Habilitando GitHub Code Scanning (Opcional)

Para integração completa com GitHub Security, você pode habilitar o Code Scanning:

### Via Interface Web

1. **Acesse o repositório** → **Settings** → **Code security and analysis**

2. **Habilite as seguintes opções**:

   - ✅ **Dependency graph**
   - ✅ **Dependabot alerts**
   - ✅ **Dependabot security updates**
   - ✅ **Code scanning** → **Set up** → **Default**

3. **Configure Secret scanning** (se disponível):
   - ✅ **Secret scanning**
   - ✅ **Push protection**

### Via GitHub CLI

```bash
# Habilitar dependency graph
gh api repos/:owner/:repo/vulnerability-alerts --method PUT

# Habilitar Dependabot alerts
gh api repos/:owner/:repo/automated-security-fixes --method PUT

# Verificar configuração
gh api repos/:owner/:repo/vulnerability-alerts
```

## 🔍 Interpretando os Resultados

### Níveis de Severidade

| Severidade      | Descrição                 | Ação Recomendada         |
| --------------- | ------------------------- | ------------------------ |
| 🔴 **CRITICAL** | Vulnerabilidades críticas | Corrigir imediatamente   |
| 🟠 **HIGH**     | Vulnerabilidades altas    | Corrigir antes do deploy |
| 🟡 **MEDIUM**   | Vulnerabilidades médias   | Planejar correção        |
| 🔵 **LOW**      | Vulnerabilidades baixas   | Monitorar                |

### Exemplo de Relatório

```json
{
  "Results": [
    {
      "Target": "node_modules/package/file",
      "Vulnerabilities": [
        {
          "VulnerabilityID": "CVE-2023-1234",
          "Severity": "HIGH",
          "Title": "Vulnerability Title",
          "Description": "Detailed description...",
          "FixedVersion": "1.2.3"
        }
      ]
    }
  ]
}
```

## 🛠️ Customizando o Scan

### Alterando Severidades

Para incluir vulnerabilidades MEDIUM e LOW:

```yaml
--severity HIGH,CRITICAL,MEDIUM,LOW
```

### Ignorando Vulnerabilidades

Crie um arquivo `.trivyignore`:

```
# Ignore specific CVE
CVE-2023-1234

# Ignore by package
npm:package-name

# Ignore by path
/path/to/ignore
```

### Configurações Avançadas

```yaml
# Scan apenas dependências de produção
--skip-dirs node_modules/dev-dependency

# Timeout personalizado
--timeout 10m

# Cache personalizado
--cache-dir /tmp/trivy-cache
```

## 📈 Monitoramento Contínuo

### 1. **Workflow Automático**

- Executa em todos os pushes para branches principais
- Executa em Pull Requests
- Pode ser executado manualmente

### 2. **Notificações**

- Comentários automáticos em PRs
- Artifacts com relatórios detalhados
- Logs detalhados no workflow

### 3. **Integração com Deploy**

- Deploy continua mesmo com vulnerabilidades
- Alertas são registrados para revisão
- Relatórios ficam disponíveis para auditoria

## 🚨 Troubleshooting

### Erro: "failed to parse the image name"

**Causa**: Nome da imagem malformado ou múltiplas tags.

**Solução**: O workflow já extrai a primeira tag automaticamente.

### Erro: "Code scanning is not enabled"

**Causa**: GitHub Code Scanning não está habilitado.

**Solução**:

- Habilite via Settings → Code security and analysis
- Ou use a versão atual que não depende do Code Scanning

### Scan muito lento

**Soluções**:

- Use `--scanners vuln` para desabilitar secret scanning
- Configure cache personalizado
- Limite severidades escaneadas

## 📋 Checklist de Configuração

- [x] Trivy scanning configurado no workflow
- [x] Relatórios JSON sendo gerados
- [x] Artifacts sendo salvos
- [x] Comentários em PR funcionando
- [ ] GitHub Code Scanning habilitado (opcional)
- [ ] Dependabot configurado (opcional)
- [ ] Secret scanning habilitado (opcional)

## 🔗 Links Úteis

- [Trivy Documentation](https://trivy.dev/)
- [GitHub Code Scanning](https://docs.github.com/en/code-security/code-scanning)
- [Dependabot](https://docs.github.com/en/code-security/dependabot)
- [Security Advisories](https://docs.github.com/en/code-security/security-advisories)

## 📞 Suporte

Se houver problemas com o security scanning:

1. Verifique os logs do workflow
2. Consulte a documentação do Trivy
3. Teste o scan localmente: `docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image your-image`
4. Abra uma issue se necessário
