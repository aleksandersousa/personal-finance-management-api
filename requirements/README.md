# 📋 Requirements - Personal Financial Management API

Esta pasta contém toda a documentação de requirements, guidelines e workflows para o desenvolvimento da API de Gestão Financeira Pessoal.

## 🚨 ATUALIZAÇÕES CRÍTICAS - Janeiro 2025

### Problemas Identificados e Corrigidos

Durante a implementação e testes, foram identificados e corrigidos diversos problemas críticos na documentação:

#### ✅ Problemas de Teste Resolvidos:

1. **E2E Tests com SQLite vs PostgreSQL**

   - **Problema:** ENUMs PostgreSQL não funcionam em SQLite
   - **Solução:** Abordagem com mocks completos em E2E

2. **JWT Strategy em Testes**

   - **Problema:** `Unknown authentication strategy 'jwt'`
   - **Solução:** Mock guard com `handleRequest`

3. **Spies com Métodos Incorretos**
   - **Problema:** `loggedEvents/recordedMetrics is not a function`
   - **Solução:** Usar métodos corretos como `getBusinessEvents()`

#### ✅ Problemas de Git Resolvidos:

1. **Commits Falhando**
   - **Problema:** `Please tell me who you are`
   - **Solução:** Configuração obrigatória de Git user

#### ✅ Problemas de Configuração:

1. **Jest Configuration**

   - **Problema:** Paths e estrutura incorreta
   - **Solução:** Configuração atualizada com paths corretos

2. **Package Manager**
   - **Problema:** Mistura npm/yarn
   - **Solução:** Yarn consistente em toda documentação

## 📂 Estrutura da Documentação

### Guidelines (`/guidelines/`)

- **`testing-requirements.md`** ⚠️ **ATUALIZADO** - Estratégias de teste corrigidas
- **`api-requirements.md`** - Especificações da API
- **`database-requirements.md`** - Configurações de banco
- **`docker-requirements.md`** - Configurações Docker
- **`git-workflow-requirements.md`** - Workflow Git
- **`observability-implementation-guidelines.md`** - Implementação de observabilidade
- **`deploy-ci-cd-guidelines.md`** - Deploy e CI/CD

### Workflows (`/workflows/`)

- **`new-api-setup-boilerplate.md`** ⚠️ **ATUALIZADO** - Setup inicial corrigido
- **`development-workflow.md`** ⚠️ **ATUALIZADO** - Workflow desenvolvimento corrigido

### Específicos do Projeto (`/financial-project-specifics/`)

- **`usecases-and-tasks-requirements.md`** - Use cases específicos
- **`README.md`** - Inclui requisitos MVP consolidados

## 🔄 Status de Implementação

### ✅ Documentos Validados (Funcionando)

- `testing-requirements.md` - Testado e funcionando
- `new-api-setup-boilerplate.md` - Validado com correções
- `development-workflow.md` - Testado com problemas resolvidos

### ⚠️ Documentos que Precisam Validação

- `deploy-ci-cd-guidelines.md` - Precisa validação com correções recentes
- `docker-requirements.md` - Verificar consistência com práticas atuais
- `observability-requirements.md` - Validar integração com correções

## 🛠️ Como Usar Esta Documentação

### Para Criar um Novo Projeto:

1. **Siga:** `workflows/new-api-setup-boilerplate.md`
2. **Configure Git:** Seção de configuração Git é OBRIGATÓRIA
3. **Use:** Configurações Jest corrigidas
4. **Evite:** SQLite em testes E2E - use mocks

### Para Desenvolvimento:

1. **Siga:** `workflows/development-workflow.md`
2. **Use:** Estratégias de mock atualizadas
3. **Implemente:** Guards com `handleRequest`
4. **Verifique:** UUIDs válidos em testes

### Para Testes:

1. **Consulte:** `guidelines/testing-requirements.md`
2. **Use:** Spies com métodos corretos
3. **Implemente:** E2E com mocks, não banco real
4. **Configure:** Jest com paths corretos

## 🚨 Problemas Conhecidos Evitados

### ❌ NÃO FAÇA:

```typescript
// SQLite em E2E com PostgreSQL ENUMs
TypeOrmModule.forRoot({ type: 'sqlite' })

// Guard sem handleRequest
.overrideGuard(JwtAuthGuard).useValue({ canActivate: jest.fn() })

// Spies com propriedades erradas
expect(loggerSpy.loggedEvents).toHaveLength(1)

// Git sem configuração
git commit // Falha sem user.name/email
```

### ✅ FAÇA:

```typescript
// E2E com mocks
providers: [{ provide: UseCase, useValue: mockUseCase }]

// Guard completo
.overrideGuard(JwtAuthGuard).useValue({
  canActivate: jest.fn().mockReturnValue(true),
  handleRequest: jest.fn().mockImplementation(() => ({ id: 'valid-uuid' }))
})

// Spies com métodos corretos
expect(loggerSpy.getBusinessEvents('event')).toHaveLength(1)

// Git configurado
git config user.name "Nome"
git config user.email "email@exemplo.com"
```

## 📋 Checklist de Validação

### Antes de Seguir Qualquer Documento:

- [ ] Git user configurado (`git config --list | grep user`)
- [ ] Node.js 20+ instalado
- [ ] Yarn instalado (não npm)
- [ ] Docker funcionando (se necessário)

### Para Novos Projetos:

- [ ] Seguir boilerplate atualizado
- [ ] Configurar Jest corretamente
- [ ] Usar mocks em E2E
- [ ] Configurar Git user

### Para Desenvolvimento:

- [ ] Workflow atualizado consultado
- [ ] Estratégias de teste corretas
- [ ] UUIDs válidos usados
- [ ] Spies com métodos corretos

## 🔗 Links Importantes

- **Issues GitHub:** Para reportar problemas na documentação
- **Conventional Commits:** Para padrão de commits
- **Jest Documentation:** Para configurações de teste
- **NestJS Testing:** Para estratégias específicas do framework

## 📞 Suporte

Se encontrar problemas não documentados aqui:

1. **Verifique:** Seção de troubleshooting nos documentos
2. **Compare:** Com exemplos corrigidos
3. **Reporte:** Issues no repositório com detalhes
4. **Documente:** Soluções encontradas para próximas implementações

---

**Última atualização:** Janeiro 2025
**Status:** Documentação validada e funcionando
**Próximos passos:** Validação contínua durante desenvolvimento
