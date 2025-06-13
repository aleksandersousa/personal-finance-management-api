# 📋 Guidelines Documentation Index

## Overview

Esta pasta contém todas as guidelines genéricas reutilizáveis para desenvolvimento de APIs. Estas guidelines são independentes de domínio e podem ser aplicadas em qualquer projeto de API.

## 📚 Guidelines Available

### 🌐 API Development

- **[`api-requirements.md`](./api-requirements.md)** - Padrões RESTful, versionamento, documentação Swagger
- **[`testing-requirements.md`](./testing-requirements.md)** - Estratégias de teste, cobertura, mocks, TDD

### 🗄️ Data & Database

- **[`database-requirements.md`](./database-requirements.md)** - Design de schema, migrations, performance, TypeORM

### 🔧 Infrastructure & DevOps

- **[`docker-requirements.md`](./docker-requirements.md)** - Containerização, multi-stage builds, environments
- **[`deploy-ci-cd-guidelines.md`](./deploy-ci-cd-guidelines.md)** - Pipelines, environments, rollback strategies

### 📊 Observability & Monitoring

- **[`observability-requirements.md`](./observability-requirements.md)** - Conceitos gerais e originais
- **[`observability-implementation-guidelines.md`](./observability-implementation-guidelines.md)** - Implementação prática completa

### 🔄 Development Process

- **[`git-workflow-requirements.md`](./git-workflow-requirements.md)** - Branching strategy, commits, code review

## 🎯 How to Use

### 📖 For New Projects

1. Read **all guidelines** before starting
2. Reference specific guidelines during implementation
3. Follow the patterns and examples provided

### 🔄 For Existing Projects

1. Use as reference for consistency
2. Adapt existing code to follow guidelines
3. Update patterns based on new learnings

### 🤖 For AI Assistants

1. **Follow guidelines strictly** - they contain tested patterns
2. **Reference specific sections** when implementing features
3. **Ask for clarification** if patterns are unclear
4. **Suggest improvements** based on implementation experience

## 🔗 Related Documentation

- **[Workflows](../workflows/README.md)** - Step-by-step development processes
- **[Project Specifics](../financial-project-specifics/)** - Domain-specific requirements

## 🎓 Guidelines Principles

### ✅ **Consistency**

All guidelines follow the same structure and level of detail

### ✅ **Completeness**

Each guideline covers all aspects of its domain

### ✅ **Practicality**

Guidelines include real-world examples and code patterns

### ✅ **Testability**

Implementation can be validated through automated tests

### ✅ **Maintainability**

Patterns support long-term project maintenance

## 📋 Quick Reference

| Guideline                      | Primary Focus                | Key Technologies         |
| ------------------------------ | ---------------------------- | ------------------------ |
| API Requirements               | REST patterns, documentation | NestJS, Swagger, OpenAPI |
| Database Requirements          | Schema design, performance   | TypeORM, PostgreSQL      |
| Docker Requirements            | Containerization             | Docker, Docker Compose   |
| Testing Requirements           | Quality assurance            | Jest, Supertest          |
| CI/CD Guidelines               | Deployment automation        | GitHub Actions, Docker   |
| Git Workflow                   | Version control              | Git, GitHub              |
| Observability (Original)       | Monitoring concepts          | Prometheus, Grafana      |
| Observability (Implementation) | Practical implementation     | Winston, Metrics         |

## 🚀 Getting Started

1. **Start with**: `api-requirements.md` for overall API structure
2. **Then read**: `database-requirements.md` for data layer
3. **Follow with**: `docker-requirements.md` for containerization
4. **Implement**: `observability-implementation-guidelines.md` for monitoring
5. **Setup**: `testing-requirements.md` for quality assurance
6. **Deploy**: `deploy-ci-cd-guidelines.md` for automation

## 🔄 Continuous Improvement

These guidelines are living documents that should be updated based on:

- New technology adoption
- Lessons learned from implementations
- Industry best practices evolution
- Team feedback and experiences

### 📝 Contributing to Guidelines

1. **Identify patterns** that repeat across projects
2. **Document thoroughly** with examples and rationale
3. **Test in practice** before documenting
4. **Maintain consistency** with existing guidelines
5. **Update related workflows** when changing guidelines

---

**These guidelines form the foundation for consistent, high-quality API development across all projects! 🚀**
