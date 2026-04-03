## Testing Guidelines

This document describes how to structure and write tests for the API, aligned with the existing Clean Architecture.

- **Goals**
  - High confidence in core business rules
  - Fast and reliable feedback in CI
  - Clear separation between unit, integration, and e2e tests
  - Tests that are easy to read and maintain

## Test Types and Scope

- **Unit tests**

  - Target: domain `usecases`, `models`, and pure functions
  - No external I/O (DB, network, queues, Redis, etc.)
  - Use in-memory collaborators or mocks/stubs

- **Integration tests**

  - Target: infrastructure components and adapters (`infra/db`, `infra/cache`, `infra/queue`, `infra/email`, etc.)
  - May touch a real or containerized Postgres/Redis (via Docker) or use lightweight test doubles
  - Focus on how components interact and persist/consume data

- **End-to-end (e2e) tests**
  - Target: HTTP layer and modules (controllers + NestJS DI + real infra)
  - Start the NestJS app, hit real endpoints, and assert on responses and side effects
  - Use the existing `test:e2e` setup and fixtures

## Folder Structure

- **General structure**

  - `test/` for e2e and high-level integration tests
  - `src/**/__tests__` or `*.spec.ts` colocated with implementation for unit/integration tests

- **Recommendations**
  - For domain and small units: colocate tests near the code (`*.spec.ts`)
  - For API flows and contracts: use `test/` with dedicated e2e suites

## Naming and Conventions

- **File naming**

  - Test files must end with `.spec.ts` or `.e2e-spec.ts` for e2e

- **Test naming**

  - Use `describe` blocks for units or behaviors
  - Use `it`/`test` with expressive sentences (e.g., `it('creates a transaction when data is valid')`)

- **Structure**
  - Arrange tests as: `Arrange` (setup) → `Act` (execute) → `Assert` (expectations)

## Domain and Use Case Tests

- **What to test**

  - Business rules, invariants, and calculations
  - Input validation and error paths at the domain level (where applicable)

- **How to test**
  - Instantiate use cases directly without NestJS
  - Use simple test doubles for contracts (e.g., in-memory repositories)
  - Avoid TypeORM entities, HTTP objects, or framework-specific constructs

## Infrastructure Tests

- **Repositories and DB**

  - Use migrations to create schema before tests where possible
  - Clean database between tests (transaction rollback or truncate strategy)
  - Assert on persistence behavior and mappings between entities and domain models

- **Queues and workers**

  - For queues: assert that jobs are enqueued with correct payloads
  - For workers: test processors in isolation when possible, using in-memory or test queues

- **External services**
  - Prefer mocking HTTP/SMTP/AI calls at the boundary
  - Do not call real external services in automated test runs

## Presentation and E2E Tests

- **HTTP contracts**

  - Use `supertest` to interact with NestJS HTTP server in e2e tests
  - Assert on status codes, response body, and headers
  - Cover both success and error cases (validation errors, unauthorized, forbidden, etc.)

- **Authentication and authorization**

  - Include tests for guards, strategies, and decorators
  - Verify that protected routes require proper authentication/authorization

- **DTOs and validation**
  - Ensure DTOs enforce required fields and constraints
  - For complex DTO logic, add focused unit tests

## Testing Practices

- **Independence**

  - Tests must not depend on each other; each test should be self-contained

- **Determinism**

  - Avoid time, randomness, or external state without controlling them (e.g., using fixed dates, seeded RNG, or fakes)

- **Performance**

  - Keep unit tests fast; move slow interactions (DB, network) to integration/e2e suites

- **Assertions**
  - Prefer clear, direct assertions over overly generic ones
  - For async code, always `await` promises and use async test helpers

## Running Tests

- **Available scripts** (from `package.json`)

  - `yarn test`: run unit tests
  - `yarn test:watch`: run tests in watch mode
  - `yarn test:coverage`: run tests with coverage
  - `yarn test:e2e`: run end-to-end tests
  - `yarn test:all`: run unit and e2e tests

- **CI**
  - `yarn test:ci` should be used in continuous integration to run the full test suite and coverage
