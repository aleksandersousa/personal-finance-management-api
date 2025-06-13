# 📋 Use Cases & User Stories - Complete Specification

## 🎯 MVP Core Features (Priority 1 - Essential)

> **MVP Scope**: Basic financial entry management with user authentication for data isolation

### **MVP-01: User Authentication** 🔐

**User Story:** As a user, I want to create an account and login securely to manage my personal finances.

**Use Cases:**

- UC-AUTH-01: Register new user account
- UC-AUTH-02: Login with email/password
- UC-AUTH-03: Refresh access token
- UC-AUTH-04: JWT token management

**Endpoints:**

**Register:** `POST /auth/register`
**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2024-01-15T10:30:00Z",
  "tokens": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "expiresIn": 900
  }
}
```

**Login:** `POST /auth/login`
**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "tokens": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "expiresIn": 900
  }
}
```

**Refresh Token:** `POST /auth/refresh`
**Request Body:**

```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response:**

```json
{
  "accessToken": "new-jwt-access-token",
  "expiresIn": 900
}
```

**Development Tasks:**

**Domain Layer:**

- User entity (id, email, password, name, createdAt, updatedAt)
- RegisterUser use case with validation
- LoginUser use case with authentication
- RefreshToken use case
- Password validation protocols

**Infrastructure Layer:**

- User repository (TypeORM)
- JWT token service (access: 15min, refresh: 7days)
- Password encryption service (bcrypt, salt rounds: 10)
- Token blacklist mechanism

**Presentation Layer:**

- AuthController with comprehensive validation
- RegisterUserDTO, LoginUserDTO, RefreshTokenDTO
- Authentication guards and middleware
- Error handling and response formatting

**Business Rules:**

- Email must be unique and valid format
- Password minimum 8 characters with complexity requirements
- Refresh tokens expire after 7 days
- Access tokens expire after 15 minutes
- Failed login attempts tracking

**Security Considerations:**

- Password hashing with bcrypt
- JWT token signing with secret rotation
- Rate limiting for auth endpoints
- Email enumeration prevention
- CSRF protection

---

### **UC-01: Register Fixed Income**

**User Story:** As a user, I want to register my salary so I can track my monthly income.

**Use Case:** AddEntry (Type: INCOME, IsFixed: true)

**Endpoint:** `POST /entries`

**Request Body:**

```json
{
  "amount": 5000.0,
  "description": "Monthly Salary",
  "type": "INCOME",
  "isFixed": true,
  "categoryId": "uuid-category-id",
  "date": "2024-01-15"
}
```

**Response:**

```json
{
  "id": "uuid",
  "amount": 5000.0,
  "description": "Monthly Salary",
  "type": "INCOME",
  "isFixed": true,
  "categoryId": "uuid-category-id",
  "categoryName": "Salary",
  "userId": "uuid-user-id",
  "date": "2024-01-15T00:00:00Z",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Development Tasks:**

**Domain Layer:**

- Entry entity (id, amount, description, type, isFixed, categoryId, userId, date, createdAt, updatedAt)
- AddEntry use case with validation
- Entry validation rules (amount > 0, required fields)
- User ownership protocols

**Infrastructure Layer:**

- Entry repository (TypeORM) with user relationships
- Category relationship validation
- Database constraints and indexes
- Transaction management

**Presentation Layer:**

- EntryController with JWT authentication
- CreateEntryDTO with validation decorators
- Error handling for validation failures
- Response formatting

**Business Rules:**

- Amount must be positive number
- Description is required (max 255 characters)
- Type must be INCOME or EXPENSE
- Category must exist and belong to user
- Date defaults to current date if not provided
- User can only create entries for themselves

**Security Considerations:**

- JWT authentication required
- User data isolation
- Input sanitization
- Category ownership validation

---

### **UC-02: Register Fixed Expense**

**User Story:** As a user, I want to register fixed expenses like rent so I can track monthly costs.

**Use Case:** AddEntry (Type: EXPENSE, IsFixed: true)

**Endpoint:** `POST /entries`

**Request Body:**

```json
{
  "amount": 1200.0,
  "description": "Monthly Rent",
  "type": "EXPENSE",
  "isFixed": true,
  "categoryId": "uuid-housing-category",
  "date": "2024-01-01"
}
```

**Response:** Same format as UC-01

**Development Tasks:** Same as UC-01 (uses same AddEntry use case)

---

### **UC-03: Register Dynamic Income**

**User Story:** As a user, I want to register occasional income like freelance work.

**Use Case:** AddEntry (Type: INCOME, IsFixed: false)

**Endpoint:** `POST /entries`

**Request Body:**

```json
{
  "amount": 800.0,
  "description": "Freelance Project Payment",
  "type": "INCOME",
  "isFixed": false,
  "categoryId": "uuid-freelance-category",
  "date": "2024-01-15"
}
```

**Response:** Same format as UC-01

**Development Tasks:** Same as UC-01 (uses same AddEntry use case)

---

### **UC-04: Register Dynamic Expense**

**User Story:** As a user, I want to register occasional expenses like shopping.

**Use Case:** AddEntry (Type: EXPENSE, IsFixed: false)

**Endpoint:** `POST /entries`

**Request Body:**

```json
{
  "amount": 150.0,
  "description": "Grocery Shopping",
  "type": "EXPENSE",
  "isFixed": false,
  "categoryId": "uuid-food-category",
  "date": "2024-01-15"
}
```

**Response:** Same format as UC-01

**Development Tasks:** Same as UC-01 (uses same AddEntry use case)

---

### **UC-05: List Entries by Month**

**User Story:** As a user, I want to see all my entries for a specific month to analyze my financial activity.

**Use Case:** ListEntriesByMonth

**Endpoint:** `GET /entries?month=YYYY-MM&page=1&limit=20&sort=date&order=desc&type=all&category=all`

**Request Parameters:**

- `month` (required): YYYY-MM format
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sort` (optional): Sort field - date, amount, description (default: date)
- `order` (optional): asc/desc (default: desc)
- `type` (optional): INCOME/EXPENSE/all (default: all)
- `category` (optional): categoryId or "all" (default: all)

**Response Format:**

```json
{
  "data": [
    {
      "id": "uuid",
      "amount": 1500.0,
      "description": "Salary",
      "type": "INCOME",
      "isFixed": true,
      "categoryId": "uuid",
      "categoryName": "Salary",
      "date": "2024-01-15T00:00:00Z",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "summary": {
    "totalIncome": 3500.0,
    "totalExpenses": 2100.0,
    "balance": 1400.0,
    "entriesCount": 45
  }
}
```

**Development Tasks:**

**Domain Layer:**

- ListEntriesByMonth use case with filtering parameters
- Entry filtering and sorting logic
- User ownership validation
- Pagination logic

**Infrastructure Layer:**

- Entry repository with complex month queries
- Date range filtering (start/end of month)
- SQL optimization with proper indexes
- Category join queries

**Presentation Layer:**

- Query parameter validation and sanitization
- Response DTO with pagination metadata
- Error handling for invalid dates/parameters
- JWT authentication middleware

**Business Rules:**

- Users can only see their own entries
- Date format validation (YYYY-MM)
- Pagination limits (max 100 items per page)
- Sort field validation
- Category ownership validation

**Security Considerations:**

- Authentication required
- User data isolation
- Parameter sanitization
- SQL injection prevention

---

### **UC-06: Update Entry**

**User Story:** As a user, I want to correct mistakes in my entries to keep my financial records accurate.

**Use Case:** UpdateEntry

**Endpoint:** `PUT /entries/:id`

**Request Body:**

```json
{
  "amount": 5200.0,
  "description": "Updated Monthly Salary",
  "type": "INCOME",
  "isFixed": true,
  "categoryId": "uuid-salary-category",
  "date": "2024-01-15"
}
```

**Response:**

```json
{
  "id": "uuid",
  "amount": 5200.0,
  "description": "Updated Monthly Salary",
  "type": "INCOME",
  "isFixed": true,
  "categoryId": "uuid-salary-category",
  "categoryName": "Salary",
  "userId": "uuid-user-id",
  "date": "2024-01-15T00:00:00Z",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-16T14:20:00Z"
}
```

**Development Tasks:**

**Domain Layer:**

- UpdateEntry use case with validation
- Entry ownership verification
- Field update validation
- Audit trail logging

**Infrastructure Layer:**

- Entry repository update methods
- Optimistic locking for concurrency
- Category relationship validation
- Database transaction management

**Presentation Layer:**

- UpdateEntryDTO with validation
- Ownership middleware
- Error handling for not found/unauthorized
- Response formatting

**Business Rules:**

- User can only update their own entries
- All validation rules from creation apply
- Cannot change userId
- Must provide valid categoryId if updating
- Audit trail maintained

**Security Considerations:**

- JWT authentication required
- Ownership validation
- Input sanitization
- Prevent unauthorized updates

---

### **UC-07: Delete Entry**

**User Story:** As a user, I want to remove entries I no longer need to keep my records clean.

**Use Case:** DeleteEntry

**Endpoint:** `DELETE /entries/:id`

**Response:**

```json
{
  "deletedAt": "2024-01-16T15:30:00Z"
}
```

**Development Tasks:**

**Domain Layer:**

- DeleteEntry use case
- Entry ownership verification
- Soft delete implementation
- Cascade deletion rules

**Infrastructure Layer:**

- Entry repository delete methods
- Soft delete with deletedAt timestamp
- Related data cleanup
- Database indexes for soft deletes

**Presentation Layer:**

- Delete endpoint with authentication
- Ownership validation middleware
- Error handling for not found
- Confirmation response

**Business Rules:**

- User can only delete their own entries
- Soft delete (mark as deleted, don't remove)
- Cannot delete already deleted entries
- Maintain referential integrity

**Security Considerations:**

- JWT authentication required
- Ownership validation
- Prevent unauthorized deletions
- Audit logging

---

### **UC-08: View Monthly Summary**

**User Story:** As a user, I want to see my balance, total income and expenses for the month to understand my financial situation.

**Use Case:** GetMonthlySummary

**Endpoint:** `GET /summary?month=YYYY-MM&includeCategories=true`

**Request Parameters:**

- `month` (required): YYYY-MM format
- `includeCategories` (optional): Include category breakdown (default: false)

**Response:**

```json
{
  "month": "2024-01",
  "summary": {
    "totalIncome": 6800.0,
    "totalExpenses": 4200.0,
    "balance": 2600.0,
    "fixedIncome": 5000.0,
    "dynamicIncome": 1800.0,
    "fixedExpenses": 2500.0,
    "dynamicExpenses": 1700.0,
    "entriesCount": {
      "total": 28,
      "income": 12,
      "expenses": 16
    }
  },
  "categoryBreakdown": [
    {
      "categoryId": "uuid",
      "categoryName": "Salary",
      "type": "INCOME",
      "total": 5000.0,
      "count": 1
    },
    {
      "categoryId": "uuid",
      "categoryName": "Housing",
      "type": "EXPENSE",
      "total": 1200.0,
      "count": 3
    }
  ],
  "comparisonWithPrevious": {
    "incomeChange": 200.0,
    "expenseChange": -150.0,
    "balanceChange": 350.0,
    "percentageChanges": {
      "income": 3.03,
      "expense": -3.45,
      "balance": 15.56
    }
  }
}
```

**Development Tasks:**

**Domain Layer:**

- GetMonthlySummary use case
- Financial calculation algorithms
- Period comparison logic
- Category aggregation rules

**Infrastructure Layer:**

- Complex aggregation queries
- Optimized database queries for performance
- Caching layer for repeated requests
- Date range calculations

**Presentation Layer:**

- SummaryController with authentication
- Query parameter validation
- Response formatting and pagination
- Error handling for invalid dates

**Business Rules:**

- Users can only see their own summary
- Month format validation (YYYY-MM)
- Include only non-deleted entries
- Category breakdown optional
- Previous month comparison automatic

**Security Considerations:**

- JWT authentication required
- User data isolation
- Parameter validation
- Performance optimization to prevent DoS

---

### **UC-09: Predict Cash Flow**

**User Story:** As a user, I want to forecast future cash flow based on fixed entries to plan my finances.

**Use Case:** PredictCashFlow

**Endpoint:** `GET /forecast?months=6&includeFixed=true&includeRecurring=false`

**Request Parameters:**

- `months` (optional): Number of months to forecast (default: 3, max: 12)
- `includeFixed` (optional): Include fixed entries in prediction (default: true)
- `includeRecurring` (optional): Include recurring entries (default: false, MVP doesn't support)

**Response:**

```json
{
  "forecastPeriod": {
    "startDate": "2024-02-01",
    "endDate": "2024-07-31",
    "monthsCount": 6
  },
  "currentBalance": 2600.0,
  "monthlyProjections": [
    {
      "month": "2024-02",
      "projectedIncome": 5000.0,
      "projectedExpenses": 2500.0,
      "netFlow": 2500.0,
      "cumulativeBalance": 5100.0,
      "confidence": "high"
    },
    {
      "month": "2024-03",
      "projectedIncome": 5000.0,
      "projectedExpenses": 2500.0,
      "netFlow": 2500.0,
      "cumulativeBalance": 7600.0,
      "confidence": "high"
    }
  ],
  "summary": {
    "totalProjectedIncome": 30000.0,
    "totalProjectedExpenses": 15000.0,
    "totalNetFlow": 15000.0,
    "finalBalance": 17600.0,
    "averageMonthlyFlow": 2500.0
  },
  "insights": {
    "trend": "positive",
    "riskLevel": "low",
    "recommendations": [
      "Your fixed income covers all fixed expenses",
      "Consider increasing savings rate",
      "Emergency fund looks stable"
    ]
  }
}
```

**Development Tasks:**

**Domain Layer:**

- PredictCashFlow use case
- Fixed entry projection algorithms
- Trend analysis calculations
- Risk assessment logic

**Infrastructure Layer:**

- Historical data analysis queries
- Projection calculation services
- Caching for complex calculations
- Performance optimization

**Presentation Layer:**

- ForecastController with authentication
- Parameter validation and defaults
- Complex response formatting
- Error handling

**Business Rules:**

- Based only on fixed entries for MVP
- Maximum 12 months forecast
- Confidence levels based on data consistency
- Only user's own data included
- Exclude deleted entries

**Security Considerations:**

- JWT authentication required
- User data isolation
- Parameter validation
- Rate limiting for complex calculations

---

## 🚀 Additional Features (Priority 2 - Post-MVP)

> **Extended Features**: Advanced functionality for enhanced user experience

### **EXT-01: Category Management** 📂

**User Story:** As a user, I want to organize my entries with custom categories for better financial tracking.

**Use Cases:**

- UC-CAT-01: Create custom categories
- UC-CAT-02: List user categories
- UC-CAT-03: Update category details
- UC-CAT-04: Delete categories

**Endpoints:**

**Create Category:** `POST /categories`
**Request Body:**

```json
{
  "name": "Freelance Work",
  "description": "Income from freelance projects",
  "type": "INCOME",
  "color": "#4CAF50",
  "icon": "work"
}
```

**Response:**

```json
{
  "id": "uuid",
  "name": "Freelance Work",
  "description": "Income from freelance projects",
  "type": "INCOME",
  "color": "#4CAF50",
  "icon": "work",
  "userId": "uuid-user-id",
  "isDefault": false,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**List Categories:** `GET /categories?type=all&includeStats=true`
**Request Parameters:**

- `type` (optional): INCOME/EXPENSE/all (default: all)
- `includeStats` (optional): Include usage statistics (default: false)

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Salary",
      "description": "Monthly salary",
      "type": "INCOME",
      "color": "#2196F3",
      "icon": "account_balance_wallet",
      "isDefault": true,
      "entriesCount": 12,
      "totalAmount": 60000.0,
      "lastUsed": "2024-01-15T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "summary": {
    "total": 8,
    "income": 3,
    "expense": 5,
    "custom": 6,
    "default": 2
  }
}
```

**Update Category:** `PUT /categories/:id`
**Delete Category:** `DELETE /categories/:id`

**Development Tasks:**

**Domain Layer:**

- Category entity (id, name, description, type, color, icon, userId, isDefault)
- Category CRUD use cases with validation
- Default category seeding logic
- Category usage validation

**Infrastructure Layer:**

- Category repository with user relationships
- Entry-Category relationship management
- Migration strategy for default categories
- Soft delete for categories with entries

**Presentation Layer:**

- CategoryController with full CRUD
- Category DTOs with validation
- Error handling for constraints
- Response formatting

**Business Rules:**

- Users can only manage their own categories
- Cannot delete categories with existing entries
- Default categories cannot be deleted
- Category names must be unique per user
- Type cannot be changed after creation

**Security Considerations:**

- JWT authentication required
- User data isolation
- Prevent manipulation of default categories
- Validate category ownership on operations

---

### **EXT-02: Refresh Token System** 🔄

**User Story:** As a user, I want to stay logged in without re-entering credentials frequently for better user experience.

**Use Cases:**

- UC-AUTH-04: Refresh expired access tokens
- UC-AUTH-05: Secure token rotation

**Endpoint:** `POST /auth/refresh` (Already detailed in MVP-01)

**Additional Development Tasks:**

**Domain Layer:**

- RefreshToken entity (id, token, userId, expiresAt, isRevoked)
- Token rotation use cases
- Token cleanup logic

**Infrastructure Layer:**

- RefreshToken repository
- Token blacklist mechanism
- Automatic token cleanup jobs
- Secure token storage

**Business Rules:**

- Refresh tokens expire after 7 days
- Old refresh tokens invalidated on use
- Maximum 5 active refresh tokens per user
- Token rotation on each refresh

**Security Considerations:**

- Secure token generation
- Token binding to device/session
- Automatic cleanup of expired tokens
- Rate limiting on refresh endpoint

---

### **EXT-03: Recurring Entries** 🔄

**User Story:** As a user, I want to automate recurring income/expenses like salary and subscriptions to save time.

**Use Cases:**

- UC-REC-01: Create recurring entries
- UC-REC-02: List active recurring entries
- UC-REC-03: Deactivate recurring entries
- UC-REC-04: Process recurring entries automatically

**Endpoints:**

**Create Recurring Entry:** `POST /recurring-entries`
**Request Body:**

```json
{
  "entryTemplate": {
    "amount": 5000.0,
    "description": "Monthly Salary",
    "type": "INCOME",
    "categoryId": "uuid-salary-category"
  },
  "frequency": "MONTHLY",
  "dayOfMonth": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "isActive": true
}
```

**Response:**

```json
{
  "id": "uuid",
  "entryTemplate": {
    "amount": 5000.0,
    "description": "Monthly Salary",
    "type": "INCOME",
    "categoryId": "uuid-salary-category",
    "categoryName": "Salary"
  },
  "frequency": "MONTHLY",
  "dayOfMonth": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "isActive": true,
  "nextExecutionDate": "2024-02-01",
  "createdEntriesCount": 0,
  "userId": "uuid-user-id",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**List Recurring Entries:** `GET /recurring-entries?status=active&includeHistory=false`
**Request Parameters:**

- `status` (optional): active/inactive/all (default: active)
- `includeHistory` (optional): Include execution history (default: false)

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "entryTemplate": { "..." },
      "frequency": "MONTHLY",
      "dayOfMonth": 1,
      "isActive": true,
      "nextExecutionDate": "2024-02-01",
      "createdEntriesCount": 12,
      "executionHistory": [
        {
          "executedAt": "2024-01-01T00:00:00Z",
          "entryId": "uuid",
          "status": "success"
        }
      ]
    }
  ],
  "summary": {
    "total": 5,
    "active": 3,
    "inactive": 2,
    "totalMonthlyAmount": 6500.00
  }
}
```

**Deactivate:** `PATCH /recurring-entries/:id/deactivate`

**Development Tasks:**

**Domain Layer:**

- RecurringEntry entity (id, entryTemplate, frequency, dayOfMonth, startDate, endDate, isActive, userId)
- Recurring entry CRUD use cases
- Entry generation algorithm
- Execution tracking logic

**Infrastructure Layer:**

- RecurringEntry repository
- Background job scheduler (cron jobs)
- Entry creation automation
- Execution history tracking

**Presentation Layer:**

- RecurringEntryController
- Complex DTOs for templates
- Background job monitoring
- Error handling for failed executions

**Business Rules:**

- Frequencies: DAILY, WEEKLY, MONTHLY, YEARLY
- Cannot modify past executions
- Automatic entry creation on schedule
- Entry template validation
- Maximum 50 active recurring entries per user

**Security Considerations:**

- JWT authentication required
- User data isolation
- Template validation
- Prevent resource exhaustion

---

### **EXT-04: Social Authentication** 🌐

**User Story:** As a user, I want to login using Google, Apple, or other social providers for easier access.

**Use Cases:**

- UC-SOCIAL-01: Google OAuth login
- UC-SOCIAL-02: Apple Sign-In
- UC-SOCIAL-03: Account linking

**Endpoints:**

**Social Login:** `POST /auth/social`
**Request Body:**

```json
{
  "provider": "google",
  "token": "oauth-token-from-provider",
  "deviceInfo": {
    "platform": "web",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Response:**

```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@gmail.com",
    "avatar": "https://avatar-url.com/image.jpg",
    "emailVerified": true
  },
  "tokens": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "expiresIn": 900
  },
  "isNewUser": false,
  "linkedProviders": ["google", "email"]
}
```

**List Providers:** `GET /auth/providers`

**Development Tasks:**

**Domain Layer:**

- AuthProvider entity (id, provider, providerUserId, userId, email, profileData)
- Social authentication use cases
- Account linking logic
- Profile data mapping

**Infrastructure Layer:**

- OAuth integration services (Google, Apple, Facebook)
- Provider token validation
- User profile synchronization
- Multiple provider linking

**Presentation Layer:**

- Extended AuthController for social flows
- Provider-specific DTOs
- Error handling for OAuth failures
- Response normalization

**Business Rules:**

- Link multiple providers to same account via email
- Social accounts must have verified email
- Profile data sync on each login
- Cannot unlink last authentication method

**Security Considerations:**

- Token validation with providers
- Email verification requirements
- Secure profile data storage
- OAuth state verification

---

### **EXT-05: Advanced Analytics** 📊

**User Story:** As a user, I want detailed insights into my spending patterns and trends to make better financial decisions.

**Use Cases:**

- UC-ANALYTICS-01: Category spending breakdown
- UC-ANALYTICS-02: Monthly/yearly comparisons
- UC-ANALYTICS-03: Spending trends analysis
- UC-ANALYTICS-04: Budget vs actual analysis

**Endpoints:**

**Category Breakdown:** `GET /analytics/spending-by-category?period=last-6-months&type=expense`
**Response:**

```json
{
  "period": {
    "start": "2023-08-01",
    "end": "2024-01-31",
    "months": 6
  },
  "data": [
    {
      "categoryId": "uuid",
      "categoryName": "Food",
      "totalAmount": 3600.0,
      "percentage": 25.5,
      "averageMonthly": 600.0,
      "trend": "increasing",
      "entries": 45
    }
  ],
  "summary": {
    "totalAmount": 14100.0,
    "categoriesCount": 8,
    "topCategory": "Food",
    "trends": {
      "increasing": 3,
      "stable": 2,
      "decreasing": 3
    }
  }
}
```

**Monthly Comparison:** `GET /analytics/monthly-comparison?months=12`
**Trends Analysis:** `GET /analytics/trends?metric=balance&period=year`

**Development Tasks:**

**Domain Layer:**

- Analytics calculation algorithms
- Trend detection logic
- Statistical analysis methods
- Period comparison calculations

**Infrastructure Layer:**

- Complex aggregation queries
- Data caching strategies
- Performance optimization
- Chart data preparation services

**Presentation Layer:**

- AnalyticsController with multiple endpoints
- Complex response formatting
- Parameter validation
- Chart-ready data structures

**Business Rules:**

- Data only from user's entries
- Configurable time periods
- Trend calculation algorithms
- Performance limits for large datasets

**Security Considerations:**

- User data isolation
- Query performance limits
- Resource usage monitoring
- Cached data security

---

### **EXT-06: Budgeting System** 💰

**User Story:** As a user, I want to set budgets for categories and track my progress to control my spending.

**Use Cases:**

- UC-BUDGET-01: Create category budgets
- UC-BUDGET-02: Track budget progress
- UC-BUDGET-03: Budget alerts and notifications
- UC-BUDGET-04: Budget vs actual reports

**Endpoints:**

**Create Budget:** `POST /budgets`
**Request Body:**

```json
{
  "categoryId": "uuid-food-category",
  "amount": 800.0,
  "period": "MONTHLY",
  "alertThreshold": 80,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "isActive": true
}
```

**Response:**

```json
{
  "id": "uuid",
  "categoryId": "uuid-food-category",
  "categoryName": "Food",
  "amount": 800.0,
  "period": "MONTHLY",
  "alertThreshold": 80,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "isActive": true,
  "currentSpent": 0.0,
  "percentageUsed": 0,
  "status": "safe",
  "userId": "uuid-user-id",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**List Budgets:** `GET /budgets?period=current&status=all&includeHistory=false`
**Request Parameters:**

- `period` (optional): current/next/all (default: current)
- `status` (optional): safe/warning/exceeded/all (default: all)
- `includeHistory` (optional): Include spending history (default: false)

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "categoryName": "Food",
      "amount": 800.0,
      "currentSpent": 640.0,
      "remaining": 160.0,
      "percentageUsed": 80,
      "status": "warning",
      "daysRemaining": 8,
      "averageDailySpent": 21.33,
      "projectedTotal": 853.0,
      "spendingHistory": [
        {
          "date": "2024-01-01",
          "amount": 45.0,
          "cumulativeSpent": 45.0
        }
      ]
    }
  ],
  "summary": {
    "totalBudgets": 5,
    "safe": 2,
    "warning": 2,
    "exceeded": 1,
    "totalBudgeted": 3500.0,
    "totalSpent": 2800.0,
    "totalRemaining": 700.0
  }
}
```

**Budget Alerts:** `GET /budgets/alerts`
**Update Budget:** `PUT /budgets/:id`

**Development Tasks:**

**Domain Layer:**

- Budget entity (id, categoryId, amount, period, alertThreshold, startDate, endDate, isActive, userId)
- Budget tracking and calculation use cases
- Alert generation logic
- Progress monitoring algorithms

**Infrastructure Layer:**

- Budget repository with category relationships
- Spending aggregation queries
- Alert notification system
- Background job for budget monitoring

**Presentation Layer:**

- BudgetController with full CRUD
- Complex budget DTOs
- Real-time progress calculations
- Alert delivery mechanisms

**Business Rules:**

- One budget per category per period
- Alert thresholds: 50%, 80%, 100%
- Period types: WEEKLY, MONTHLY, YEARLY
- Budget status: safe, warning, exceeded
- Maximum 20 active budgets per user

**Security Considerations:**

- JWT authentication required
- User data isolation
- Category ownership validation
- Alert rate limiting

---

## 🏗️ Implementation Priority

### **Phase 1: MVP Core (Essential)**

1. User authentication system (MVP-01)
2. Entry entity & repository with user relationships
3. AddEntry use case (covers UC-01 to UC-04)
4. ListEntriesByMonth use case (UC-05)
5. UpdateEntry use case (UC-06)
6. DeleteEntry use case (UC-07)
7. GetMonthlySummary use case (UC-08)
8. PredictCashFlow use case (UC-09)

### **Phase 2: Essential Extensions**

9. Category management (EXT-01)
10. Refresh token system (EXT-02)

### **Phase 3: Automation Features**

11. Recurring entries (EXT-03)
12. Background job processing

### **Phase 4: Advanced Features**

13. Social authentication (EXT-04)
14. Advanced analytics (EXT-05)
15. Budgeting system (EXT-06)

---

## 🔧 Technical Implementation

### **MVP Entities Required:**

- User (id, email, password, name, createdAt)
- Entry (id, amount, description, type, isFixed, categoryId, userId, date)
- Category (optional - can use simple strings initially)

### **Extended Entities (Post-MVP):**

- Category (id, name, description, userId, type)
- RefreshToken (id, token, userId, expiresAt)
- RecurringEntry (id, frequency, startDate, endDate, isActive, entryTemplate)
- AuthProvider (id, provider, providerUserId, userId)
- Budget (id, categoryId, amount, period, alertThreshold)

### **MVP Use Cases Required:**

- RegisterUser, LoginUser
- AddEntry
- ListEntriesByMonth
- UpdateEntry
- DeleteEntry
- GetMonthlySummary
- PredictCashFlow

### **MVP Controllers Required:**

- AuthController
- EntryController
- SummaryController

### **Complete API Endpoints:**

**MVP Endpoints:**
| Method | Path | Use Case |
| ------ | ------------------------ | ------------------ |
| POST | `/auth/register` | RegisterUser |
| POST | `/auth/login` | LoginUser |
| POST | `/auth/refresh` | RefreshToken |
| POST | `/entries` | AddEntry |
| GET | `/entries?month=YYYY-MM` | ListEntriesByMonth |
| PUT | `/entries/:id` | UpdateEntry |
| DELETE | `/entries/:id` | DeleteEntry |
| GET | `/summary?month=YYYY-MM` | GetMonthlySummary |
| GET | `/forecast` | PredictCashFlow |

**Extended Endpoints:**
| Method | Path | Feature |
| ------ | --------------------------------- | ---------- |
| POST | `/auth/refresh` | EXT-02 |
| POST | `/auth/social` | EXT-04 |
| POST | `/categories` | EXT-01 |
| GET | `/categories` | EXT-01 |
| PUT | `/categories/:id` | EXT-01 |
| DELETE | `/categories/:id` | EXT-01 |
| POST | `/recurring-entries` | EXT-03 |
| GET | `/recurring-entries` | EXT-03 |
| PATCH | `/recurring-entries/:id/deactivate` | EXT-03 |
| GET | `/analytics/spending-by-category` | EXT-05 |
| GET | `/analytics/monthly-comparison` | EXT-05 |
| POST | `/budgets` | EXT-06 |
| GET | `/budgets` | EXT-06 |
