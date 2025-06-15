# 📦 GitHub Container Registry Setup

Este documento explica como configurar as permissões necessárias para o GitHub Container Registry (GHCR) no CI/CD.

## 🔧 Configuração Necessária

### 1. Permissões do Repositório

O workflow já está configurado com as permissões necessárias:

```yaml
permissions:
  contents: read
  packages: write
  security-events: write
  actions: read
```

### 2. Configurações do GitHub

#### Opção A: Configurar via Interface Web

1. **Acesse as configurações do repositório**:

   - Vá para `Settings` → `Actions` → `General`

2. **Configure as permissões do GITHUB_TOKEN**:

   - Em "Workflow permissions", selecione: **"Read and write permissions"**
   - Marque: **"Allow GitHub Actions to create and approve pull requests"**

3. **Configure o Container Registry**:
   - Vá para `Settings` → `Packages`
   - Em "Package creation", selecione: **"Public"** ou **"Private"** conforme necessário

#### Opção B: Configurar via GitHub CLI

```bash
# Instalar GitHub CLI se não tiver
# https://cli.github.com/

# Configurar permissões do repositório
gh api repos/:owner/:repo/actions/permissions \
  --method PUT \
  --field default_workflow_permissions=write \
  --field can_approve_pull_request_reviews=true

# Verificar configuração
gh api repos/:owner/:repo/actions/permissions
```

### 3. Verificar Configuração

Após configurar, você pode verificar se está funcionando:

```bash
# Testar push manual de uma imagem
docker build -t ghcr.io/aleksandersousa/personal-financial-management-api:test .
echo $GITHUB_TOKEN | docker login ghcr.io -u aleksandersousa --password-stdin
docker push ghcr.io/aleksandersousa/personal-financial-management-api:test
```

## 🚨 Troubleshooting

### Erro: "denied: installation not allowed to Create organization package"

**Causa**: O GITHUB_TOKEN não tem permissões para criar pacotes.

**Solução**:

1. Verifique se as permissões do workflow estão corretas
2. Configure "Read and write permissions" nas configurações do repositório
3. Se for uma organização, verifique as políticas de pacotes da organização

### Erro: "denied: requested access to the resource is denied"

**Causa**: Problema de autenticação ou nome do pacote.

**Solução**:

1. Verifique se o nome do repositório está correto
2. Confirme que você tem acesso de escrita ao repositório
3. Verifique se o pacote já existe e você tem permissões

### Erro: "unauthorized: authentication required"

**Causa**: Token de autenticação inválido ou expirado.

**Solução**:

1. O GITHUB_TOKEN é gerado automaticamente pelo GitHub Actions
2. Verifique se as permissões do workflow estão configuradas
3. Em caso de token personalizado, verifique se não expirou

## 📋 Checklist de Configuração

- [ ] Permissões do workflow configuradas no arquivo YAML
- [ ] "Read and write permissions" habilitado nas configurações do repositório
- [ ] Configurações de pacotes definidas (público/privado)
- [ ] Nome da imagem correto no workflow
- [ ] Teste manual de push funcionando

## 🔗 Links Úteis

- [GitHub Packages Documentation](https://docs.github.com/en/packages)
- [Container Registry Guide](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [GitHub Actions Permissions](https://docs.github.com/en/actions/security-guides/automatic-token-authentication)

## 📞 Suporte

Se ainda houver problemas:

1. Verifique os logs detalhados do GitHub Actions
2. Teste o push manual da imagem
3. Consulte a documentação oficial do GitHub
4. Abra uma issue no repositório se necessário
