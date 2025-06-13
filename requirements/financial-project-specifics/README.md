# 💰 Financial Project Specific Documentation

## Overview

Esta pasta contém toda a documentação específica do domínio financeiro pessoal. Diferente das guidelines genéricas, estes arquivos contêm regras de negócio, casos de uso e requisitos específicos deste projeto.

## 📋 Documentation Structure

### 🎯 [MVP Requirements](./mvp-requirements.md)

Requisitos mínimos para o produto viável mínimo

- Funcionalidades essenciais
- Requisitos não-funcionais específicos
- Critérios de aceitação do MVP

### 📋 [Use Cases & Tasks Requirements](./usecases-and-tasks-requirements.md)

Especificação completa de casos de uso e user stories

- Casos de uso detalhados por prioridade
- User stories com critérios de aceitação
- Especificações de API endpoints
- Regras de negócio específicas
- Tasks de desenvolvimento por camada

## 🏗️ Domain Context

### Financial Management Domain

Este projeto foca em **gerenciamento financeiro pessoal** com as seguintes características:

- **Usuários**: Pessoas físicas gerenciando finanças pessoais
- **Entidades principais**: Entries (receitas/despesas), Categories, Users
- **Fluxos principais**: Registro de entradas, visualização de resumos, previsões
- **Regras de negócio**: Isolamento por usuário, categorização, histórico temporal

### Key Business Concepts

**Entry (Lançamento)**

- Receita ou despesa financeira
- Pode ser fixa (recorrente) ou dinâmica (única)
- Associada a uma categoria e usuário
- Possui data, valor e descrição

**Category (Categoria)**

- Classificação dos lançamentos
- Permite organização e análise
- Definida pelo usuário

**Financial Summary (Resumo Financeiro)**

- Visão consolidada por período
- Balanço, total de receitas e despesas
- Base para tomada de decisões

## 🎯 Business Rules

### User Isolation

- Todos os dados são isolados por usuário
- Autenticação obrigatória para todas as operações
- Não há compartilhamento de dados entre usuários

### Data Consistency

- Valores monetários em centavos (integers)
- Datas em formato ISO para consistência temporal
- Validações rigorosas de entrada

### Financial Logic

- Receitas têm valor positivo
- Despesas têm valor positivo (valor absoluto)
- Balanço = Total Receitas - Total Despesas
- Previsões baseadas em entradas fixas

## 🔄 Evolution Strategy

### Phase 1: MVP

Funcionalidades básicas de entrada e visualização

### Phase 2: Enhanced Features

- Relatórios avançados
- Gráficos e visualizações
- Metas e orçamentos

### Phase 3: Advanced Features

- Integração bancária
- Categorização automática
- Análises preditivas

## 📞 Domain Expertise

### Financial Terms

- **Entry**: Lançamento financeiro (receita ou despesa)
- **Fixed Entry**: Lançamento recorrente (salário, aluguel)
- **Dynamic Entry**: Lançamento único ou esporádico
- **Balance**: Saldo (receitas - despesas)
- **Cash Flow**: Fluxo de caixa projetado

### Business Validation Rules

- Valores devem ser positivos
- Datas não podem ser futuras demais (limite configurável)
- Categorias devem existir e pertencer ao usuário
- Descrições são obrigatórias para rastreabilidade

## 🤖 AI Assistant Context

Quando trabalhando com este projeto:

1. **Domain Focus**: Sempre considere o contexto de finanças pessoais
2. **User Privacy**: Implemente isolamento rigoroso de dados
3. **Financial Accuracy**: Use integers para valores monetários
4. **Business Logic**: Siga as regras definidas nos casos de uso
5. **MVP First**: Implemente funcionalidades na ordem de prioridade definida

## 👨‍💻 Developer Context

### Key Implementation Notes

- Use TypeORM entities com isolamento por userId
- Implemente validações de negócio na camada de domínio
- Mantenha logs de auditoria para operações financeiras
- Considere performance para queries de histórico

### Testing Strategy

- Testes unitários para regras de negócio
- Testes de integração para cenários financeiros
- Testes E2E para fluxos completos de usuário
- Validação de isolamento entre usuários

---

## 🔗 Integration with Generic Guidelines

While this documentation is project-specific, it should be implemented following the **generic guidelines**:

- **API patterns** from `../guidelines/api-requirements.md`
- **Database design** from `../guidelines/database-requirements.md`
- **Testing approach** from `../guidelines/testing-requirements.md`
- **Development workflow** from `../workflows/development-workflow.md`

**The combination of generic guidelines + domain-specific requirements = robust financial management API! 💰**
