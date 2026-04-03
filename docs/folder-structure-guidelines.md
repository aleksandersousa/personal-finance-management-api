## Folder Structure Guidelines

This document describes how the `api` project is organized and where to place new files.

## Top-Level Layout

- **Root**

  - `src/`: application source code
  - `test/`: end-to-end and higher-level integration tests
  - `dist/`: compiled JavaScript output (generated)
  - `.docker/`: Docker-related configuration
  - `docs/`: architecture, testing, and folder structure guidelines

- **Key configs**
  - `package.json`: scripts, dependencies, and tooling
  - `tsconfig.json`: TypeScript configuration
  - `jest.config.js`: Jest configuration
  - `nest-cli.json`: NestJS CLI configuration

## `src` Structure Overview

- **Main folders**

  - `src/domain`: business rules and core abstractions
  - `src/data`: application-level orchestration (if used)
  - `src/infra`: infrastructure and external integrations
  - `src/presentation`: HTTP and interface layer
  - `src/main`: application composition (modules, config, factories)
  - `src/workers` and `src/worker.ts`: background job processors

- **Entry points**
  - `src/main.ts`: main NestJS HTTP application bootstrap
  - `src/worker.ts`: worker/queue processing bootstrap

## `src/domain`

- **Purpose**

  - Holds domain models, use cases, contracts, and constants.
  - Must remain independent from frameworks and external libraries.

- **Subfolders**

  - `constants/`: domain constants and enums
  - `contracts/`: interfaces for repositories and external services
  - `models/`: core domain entities and value objects
  - `usecases/`: application use cases / business operations

- **When adding new code**
  - Create or extend `models` and `usecases` for new business features.
  - Add `contracts` for new external dependencies instead of depending on concrete implementations.

## `src/data` (if used)

- **Purpose**

  - Central place for application-level orchestration that is not pure domain.
  - Implements domain contracts or provides data mappers and services.

- **Guideline**
  - Only add here when logic does not fit cleanly in `domain` or `infra` but still belongs to the core application.

## `src/infra`

- **Purpose**

  - Technical implementations for DB, cache, queues, email, logging, metrics, middleware, and external services.

- **Typical subfolders**

  - `ai/`: AI-related adapters and clients
  - `cache/`: Redis or other cache clients and helpers
  - `db/`: TypeORM data-source, entities, migrations, and repositories
  - `email/`: email providers and templates
  - `implementations/`: concrete implementations of domain/data contracts
  - `logging/`: logging configuration and logger instances
  - `metrics/`: metrics registry and exporters
  - `middleware/`: NestJS middlewares
  - `notifications/`: notification channels and dispatchers
  - `queue/`: queue definitions and BullMQ setup

- **When adding new code**
  - Put new external-service clients or adapters in the most appropriate subfolder.
  - Implement domain contracts here, not in `domain` or `presentation`.
  - Keep ORM entities and persistence-specific details inside `db/`.

## `src/presentation`

- **Purpose**

  - All HTTP layer and interface concerns: controllers, DTOs, guards, filters, interceptors, and auth strategies.

- **Subfolders**

  - `controllers/`: NestJS controllers per bounded context
  - `decorators/`: custom decorators (e.g., auth, user extraction)
  - `dtos/`: request and response DTO classes
  - `filters/`: exception filters
  - `guards/`: authorization and access control guards
  - `interceptors/`: cross-cutting concerns at HTTP level (logging, transformation, etc.)
  - `strategies/`: auth strategies (e.g., JWT, local)

- **When adding new code**
  - For new endpoints: add a controller method and corresponding DTOs.
  - For new auth or access rules: add/update `guards`, `strategies`, and `decorators`.
  - Keep controllers thin; delegate business logic to `domain` use cases.

## `src/main`

- **Purpose**

  - Application composition: NestJS modules, configuration, and factories.

- **Subfolders**

  - `config/`: environment configuration, validation, and config providers
  - `factories/`: factories to instantiate use cases and services
  - `modules/`: NestJS modules grouping controllers and providers by feature or bounded context

- **When adding new code**
  - Register new controllers and providers inside the relevant `modules`.
  - Add configuration keys and validation rules in `config`.
  - Create factories when complex wiring is needed for use cases or services.

## `src/workers`

- **Purpose**

  - Background processing logic for queued jobs and scheduled tasks.

- **Guidelines**
  - Group workers by domain/feature when appropriate.
  - Use domain use cases inside workers instead of duplicating business logic.
  - Configure queue bindings and processors in coordination with `infra/queue`.

## `test`

- **Purpose**

  - Central place for e2e tests and broader integration scenarios.

- **Guidelines**
  - Use `*.e2e-spec.ts` for end-to-end tests.
  - Keep domain-level unit tests close to their code (e.g., `*.spec.ts` in `src`), and e2e in `test/`.
