## Architecture Overview

This API follows a Clean Architecture approach with clear separation between domain, application, infrastructure, and presentation concerns.

- **Goals**
  - Maintainable and testable codebase
  - Clear boundaries between layers
  - Technology-agnostic domain rules
  - Easy to extend with new features and integrations

## Layer Responsibilities

- **Domain (`src/domain`)**

  - Contains business rules and core abstractions
  - Defines `models`, `usecases`, `contracts`, and `constants`
  - Does not depend on NestJS, TypeORM, or external libraries

- **Data / Application (`src/data`)**

  - Orchestrates use case execution and data transformations
  - Implements domain `contracts` where needed
  - Encapsulates application-specific logic that is not pure domain

- **Infrastructure (`src/infra`)**

  - Integrations and technical details (DB, cache, email, logging, metrics, queues, AI)
  - Contains concrete implementations of domain and data contracts
  - Responsible for TypeORM entities, repositories, Redis, queues, and external APIs

- **Presentation (`src/presentation`)**

  - HTTP and authentication layer
  - Contains `controllers`, `dtos`, `decorators`, `filters`, `guards`, `interceptors`, and `strategies`
  - Maps HTTP requests to use cases and maps responses back to transport-friendly DTOs

- **Composition (`src/main`)**

  - `config`: environment configuration, validation, and configuration providers
  - `modules`: NestJS modules that wire controllers, providers, and infrastructure implementations
  - `factories`: factories for building use cases and other high-level services

- **Workers (`src/workers`, `src/worker.ts`)**
  - Background jobs and queue processors
  - Should reuse domain use cases and infra implementations

## Dependency Direction

- **Allowed dependencies**

  - `domain` depends on nothing
  - `data` can depend on `domain`
  - `infra` can depend on `domain` and `data`
  - `presentation` can depend on `domain`, `data`, and `infra` contracts
  - `main` can depend on all layers to wire them together

- **Forbidden dependencies**
  - `domain` must not depend on `infra`, `presentation`, or NestJS
  - Cross-layer imports should always point inward (towards domain), never outward

## Modules and Use Cases

- **Use cases**

  - Each important business operation should be expressed as a domain `usecase`
  - Use cases should expose simple methods (e.g., `execute`) with explicit input and output models
  - Use cases should not know about HTTP, controllers, or frameworks

- **NestJS modules**
  - Group related controllers and providers by bounded context (e.g., users, accounts, transactions)
  - Wire use case implementations with infrastructure providers through NestJS DI
  - Keep module definitions thin: no business logic inside `Module` classes

## Data and Persistence

- **Repositories**

  - Domain defines repository contracts
  - `infra/db` implements these contracts using TypeORM
  - Do not leak ORM entities into domain models; map between entities and domain models

- **Migrations**
  - Managed via TypeORM CLI using the configured data source
  - Schema changes should follow domain needs and avoid leaking technical shortcuts into domain

## API and DTOs

- **Controllers**

  - Thin: validate input, call use cases, map results to DTOs
  - Do not put business rules in controllers

- **DTOs**
  - Live in `src/presentation/dtos`
  - Represent HTTP request and response shapes
  - Use class-validator and class-transformer for validation and serialization

## Cross-Cutting Concerns

- **Logging**

  - Centralize logging in `src/infra/logging`
  - Use structured logs and avoid logging sensitive data

- **Metrics**

  - Expose application metrics via `src/infra/metrics`
  - Track key business and technical indicators (latency, errors, throughput)

- **Security**
  - Use `guards`, `strategies`, and `decorators` in `src/presentation` for auth and authorization
  - Validate and sanitize all external inputs via DTOs and pipes

## Background Jobs and Queues

- **Queues**

  - Defined in `src/infra/queue` using BullMQ and Redis
  - Jobs should call domain use cases, not embed business logic directly

- **Workers**
  - Implement processors that consume queue jobs
  - Ensure idempotency where possible and handle retries gracefully

## General Guidelines

- Prefer pure functions and domain models in `domain`
- Keep controllers, providers, and modules small and focused
- When adding a new feature:
  - Start from `domain` (models, usecases, contracts)
  - Implement contracts in `infra`
  - Wire everything in `main/modules`
  - Expose operations via `presentation` controllers and DTOs
