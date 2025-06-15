# 📦 GitHub Container Registry Setup

Este documento explica como configurar as permissões necessárias para o GitHub Container Registry (GHCR) no CI/CD.

## 🚨 Problemas Atuais

### Erro 1: `denied: installation not allowed to Create organization package`

Este erro indica que o GITHUB_TOKEN não tem permissões para criar pacotes no GitHub Container Registry.

### Erro 2: `Invalid format 'ghcr.io/user/repo:tag'`

Este erro ocorre quando outputs multi-linha são usados em variáveis de ambiente do GitHub Actions.

**Status**: ✅ **CORRIGIDO** - Implementada extração de tag primária em todos os workflows.

## 🔧 Soluções Implementadas

### 1. **Múltiplas Estratégias de Build**

O workflow agora tenta várias abordagens:

1. **Build principal**: Formato padrão do metadata-action
2. **Build alternativo**: Formato `ghcr.io/username/repo:branch`
3. **Build separado**: AMD64 e ARM64 individualmente
4. **Manifest combinado**: Cria multi-arch a partir dos builds separados

### 2. **Configuração Robusta**

```yaml
# Permissões necessárias no workflow
permissions:
  contents: read
  packages: write
  security-events: write
  actions: read
```

## 🛠️ Configuração Manual Necessária

### **Opção 1: Via Interface Web (RECOMENDADO)**

1. **Acesse as configurações do repositório**:

   - Vá para **Settings** → **Actions** → **General**

2. **Configure as permissões do GITHUB_TOKEN**:

   - Em "Workflow permissions", selecione: **"Read and write permissions"**
   - Marque: **"Allow GitHub Actions to create and approve pull requests"**

3. **Configure o Container Registry**:

   - Vá para **Settings** → **Packages**
   - Em "Package creation", selecione: **"Public"** ou **"Private"** conforme necessário

4. **Verifique as permissões de organização** (se aplicável):

   - Se o repositório estiver em uma organização, vá para as configurações da organização
   - **Settings** → **Member privileges** → **Package creation**
   - Certifique-se de que está habilitado

5. **⚠️ IMPORTANTE para Staging**:
   - O erro específico `installation not allowed to Create organization package` geralmente ocorre quando:
     - O repositório está em uma organização e as permissões não estão configuradas
     - O primeiro package ainda não foi criado manualmente
     - As configurações de visibilidade do package não estão definidas

### **Opção 2: Via GitHub CLI**

```bash
# Configurar permissões do repositório
gh api repos/aleksandersousa/personal-financial-management-api/actions/permissions \
  --method PUT \
  --field default_workflow_permissions=write \
  --field can_approve_pull_request_reviews=true

# Verificar configuração
gh api repos/aleksandersousa/personal-financial-management-api/actions/permissions
```

### **Opção 3: Teste Manual**

Para verificar se as permissões estão funcionando:

```bash
# 1. Gerar um token pessoal (se necessário)
# Vá para Settings → Developer settings → Personal access tokens
# Crie um token com escopo 'write:packages'

# 2. Testar login
echo $GITHUB_TOKEN | docker login ghcr.io -u aleksandersousa --password-stdin

# 3. Testar push de uma imagem simples
docker pull hello-world
docker tag hello-world ghcr.io/aleksandersousa/personal-financial-management-api:test
docker push ghcr.io/aleksandersousa/personal-financial-management-api:test
```

## 🔍 Diagnóstico de Problemas

### **Verificar Status Atual**

```bash
# Verificar permissões do repositório
gh api repos/aleksandersousa/personal-financial-management-api/actions/permissions

# Verificar pacotes existentes
gh api user/packages?package_type=container

# Verificar configurações de organização (se aplicável)
gh api orgs/aleksandersousa/actions/permissions
```

### **Logs Detalhados**

No workflow, você pode adicionar debug:

```yaml
- name: 🔍 Debug GHCR permissions
  run: |
    echo "Actor: ${{ github.actor }}"
    echo "Repository: ${{ github.repository }}"
    echo "Repository Owner: ${{ github.repository_owner }}"
    echo "Registry: ${{ env.REGISTRY }}"
    echo "Image Name: ${{ env.IMAGE_NAME }}"
```

## 🚀 Alternativas se GHCR Não Funcionar

### **1. Docker Hub (Fallback)**

Se o GHCR continuar com problemas, você pode usar Docker Hub:

```yaml
env:
  REGISTRY: docker.io
  IMAGE_NAME: aleksandersousa/personal-financial-management-api
```

E adicionar secrets:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

### **2. Registry Privado**

Configurar um registry privado (AWS ECR, Azure ACR, etc.)

## 📋 Checklist de Resolução

- [ ] **Permissões do workflow** configuradas no YAML
- [ ] **"Read and write permissions"** habilitado nas configurações do repositório
- [ ] **Configurações de pacotes** definidas (público/privado)
- [ ] **Permissões de organização** verificadas (se aplicável)
- [ ] **Teste manual** de push funcionando
- [ ] **Workflow com fallbacks** implementado

## 🎯 Próximos Passos

1. **Configure as permissões** via interface web (mais confiável)
2. **Execute o workflow** novamente
3. **Verifique os logs** para ver qual estratégia funcionou
4. **Se ainda falhar**, considere usar Docker Hub temporariamente

## 🔗 Links Úteis

- [GitHub Packages Documentation](https://docs.github.com/en/packages)
- [Container Registry Guide](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [GitHub Actions Permissions](https://docs.github.com/en/actions/security-guides/automatic-token-authentication)
- [Troubleshooting GHCR](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry#troubleshooting)

## 📞 Status do Workflow

O workflow agora tem **múltiplas estratégias de fallback**:

1. ✅ **Tenta build principal** com formato padrão
2. ✅ **Tenta build alternativo** com formato simplificado
3. ✅ **Tenta builds separados** por arquitetura
4. ✅ **Combina em manifest** multi-arquitetura
5. ✅ **Continua deploy** mesmo se algumas estratégias falharem

Pelo menos uma das estratégias deve funcionar após configurar as permissões!
