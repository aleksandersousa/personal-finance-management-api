# Project Domain - Personal Financial Management API

## Overview

A REST API for personal financial management that enables users to track income and expenses, analyze spending patterns, forecast cash flow, and receive automated payment reminders.

## Core Domain Entities

### User

- Authentication and authorization (JWT-based)
- Email verification and password reset flows
- User preferences (notifications, timezone)
- Profile management (name, avatar, email)

### Entry

- Financial transactions (income or expense)
- Attributes: description, amount, date, category, payment status
- Fixed entries (recurring income/expenses)
- Payment tracking (isPaid flag)
- Notification scheduling for upcoming expenses

### Category

- Customizable income and expense categories
- Default categories provided
- Category metadata (color, icon, description)
- Category statistics (entry count, total amount, last used)

### Notification

- Scheduled email reminders for upcoming expenses
- Configurable notification timing
- Status tracking (pending, sent, cancelled)
- Queue-based processing for reliability

## Key Features

### Authentication & User Management

- User registration with email verification
- JWT-based authentication and refresh tokens
- Password reset via email
- User profile management

### Financial Entries Management

- Create, read, update, delete entries
- Support for income and expense types
- Fixed/recurring entry management
- Payment status tracking (paid/unpaid)
- Filter entries by month and year
- Category assignment

### Category Management

- Create custom categories
- Update and delete categories
- List categories with optional statistics
- Filter by type (income/expense/all)
- Search and pagination support

### Financial Analytics

- Monthly summaries with income/expense breakdown
- Comparison with previous month
- Category-wise spending analysis
- Current balance calculation

### Cash Flow Forecasting

- Multi-month cash flow projections
- Fixed entry-based predictions
- Balance projections over time
- Insights and recommendations
- Cached results for performance

### Notifications

- Schedule email reminders for expenses
- Configurable notification timing (minutes before due date)
- Automatic email delivery via queue workers
- Cancel scheduled notifications
- User preference-based opt-out

### SQL Agent

- AI-powered natural language queries
- Secure read-only database access
- Integration with CentralMind Gateway
- Conversational financial insights

### Observability

- Prometheus metrics endpoint
- Structured logging with trace correlation
- Health check endpoints
- Request/response tracking
- Business event logging

## Technical Capabilities

### Infrastructure

- PostgreSQL database with TypeORM
- Redis for caching and queues
- BullMQ for background job processing
- Mailgun for transactional emails
- LiquidJS templates for email rendering

### Security

- JWT authentication
- Rate limiting
- Input validation
- CORS protection
- Security headers (Helmet)
- Password hashing (bcrypt)

### Performance

- Query result caching
- Database indexing
- Queue-based async processing
- Optimized aggregation queries

## User Flows

### Registration Flow

1. User registers with email and password
2. Verification email sent
3. User clicks verification link
4. Account activated

### Entry Creation Flow

1. User creates income/expense entry
2. Optionally assigns category
3. Can mark as fixed/recurring
4. Can schedule notification
5. Entry saved and available in monthly views

### Monthly Summary Flow

1. User requests summary for specific month
2. System aggregates all entries
3. Calculates totals, comparisons, category breakdown
4. Returns formatted summary data

### Cash Flow Forecast Flow

1. User requests forecast for N months
2. System retrieves fixed entries and current balance
3. Generates monthly projections
4. Calculates insights and recommendations
5. Caches result for subsequent requests

### Notification Flow

1. User creates entry with notification time
2. System schedules notification job
3. Worker processes notification at scheduled time
4. Email sent to user
5. Notification status updated

## Business Rules

- Entries belong to a user (user isolation)
- Categories can be income or expense type
- Fixed entries repeat monthly
- Notifications only sent for unpaid expenses
- Email verification required for account activation
- Password reset tokens expire after use
- Cash flow forecasts consider fixed entries and current balance
- Monthly summaries include all entries for that month

## API Structure

- `/api/v1/auth` - Authentication endpoints
- `/api/v1/entries` - Entry management
- `/api/v1/categories` - Category management
- `/api/v1/summary` - Monthly summaries
- `/api/v1/forecast` - Cash flow forecasting
- `/api/v1/sql-agent` - AI-powered queries
- `/api/v1/health` - Health checks
- `/api/v1/metrics` - Prometheus metrics
- `/api/v1/docs` - Swagger documentation

## Non-Functional Requirements

- Clean Architecture for maintainability
- TypeScript for type safety
- Comprehensive test coverage
- Docker support for deployment
- Environment-based configuration
- Structured logging and monitoring
- Queue-based async processing
- Cache-friendly design
