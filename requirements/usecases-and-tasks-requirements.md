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

**Development Tasks:**

- User entity (id, email, password, name, createdAt)
- RegisterUser use case
- LoginUser use case
- JWT token service
- Password hashing (bcrypt)
- AuthController with validation

**Endpoints:**

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - User login

---

### **UC-01: Register Fixed Income**

**User Story:** As a user, I want to register my salary so I can track my monthly income.

**Use Case:** AddEntry

- **Type:** INCOME
- **IsFixed:** true
- **Endpoint:** `POST /entries`

**Development Tasks:**

- Entry entity with amount, description, type, isFixed, categoryId, userId, date
- AddEntry use case
- EntryController
- Input validation

---

### **UC-02: Register Fixed Expense**

**User Story:** As a user, I want to register fixed expenses like rent so I can track monthly costs.

**Use Case:** AddEntry

- **Type:** EXPENSE
- **IsFixed:** true
- **Endpoint:** `POST /entries`

**Development Tasks:**

- Same AddEntry use case with different type
- Expense validation rules

---

### **UC-03: Register Dynamic Income**

**User Story:** As a user, I want to register occasional income like freelance work.

**Use Case:** AddEntry

- **Type:** INCOME
- **IsFixed:** false
- **Endpoint:** `POST /entries`

---

### **UC-04: Register Dynamic Expense**

**User Story:** As a user, I want to register occasional expenses like shopping.

**Use Case:** AddEntry

- **Type:** EXPENSE
- **IsFixed:** false
- **Endpoint:** `POST /entries`

---

### **UC-05: List Entries by Month**

**User Story:** As a user, I want to see all my entries for a specific month.

**Use Case:** ListEntriesByMonth

- **Endpoint:** `GET /entries?month=YYYY-MM`

**Development Tasks:**

- Date filtering logic
- Entry repository with month queries
- Pagination support

---

### **UC-06: Update Entry**

**User Story:** As a user, I want to correct mistakes in my entries.

**Use Case:** UpdateEntry

- **Endpoint:** `PUT /entries/:id`

**Development Tasks:**

- UpdateEntry use case
- Ownership validation
- UpdateEntryDTO

---

### **UC-07: Delete Entry**

**User Story:** As a user, I want to remove entries I no longer need.

**Use Case:** DeleteEntry

- **Endpoint:** `DELETE /entries/:id`

**Development Tasks:**

- DeleteEntry use case
- Soft delete implementation
- Ownership validation

---

### **UC-08: View Monthly Summary**

**User Story:** As a user, I want to see my balance, total income and expenses for the month.

**Use Case:** GetMonthlySummary

- **Endpoint:** `GET /summary?month=YYYY-MM`

**Development Tasks:**

- Summary calculation logic
- Income/expense aggregation
- Balance calculation

---

### **UC-09: Predict Cash Flow**

**User Story:** As a user, I want to forecast future cash flow based on fixed entries.

**Use Case:** PredictCashFlow

- **Endpoint:** `GET /forecast`

**Development Tasks:**

- Prediction algorithm
- Fixed entry projection
- Future balance calculation

---

## 🚀 Additional Features (Priority 2 - Post-MVP)

> **Extended Features**: Advanced functionality for enhanced user experience

### **EXT-01: Category Management** 📂

**User Story:** As a user, I want to organize my entries with custom categories.

**Use Cases:**

- UC-CAT-01: Create custom categories
- UC-CAT-02: List user categories
- UC-CAT-03: Update category details
- UC-CAT-04: Delete categories

**Development Tasks:**

- Category entity (id, name, description, userId, type)
- Category CRUD use cases
- CategoryController
- Default categories on user registration

**Endpoints:**

- `POST /categories` - Create category
- `GET /categories` - List categories
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

---

### **EXT-02: Refresh Token System** 🔄

**User Story:** As a user, I want to stay logged in without re-entering credentials frequently.

**Use Cases:**

- UC-AUTH-04: Refresh expired access tokens
- UC-AUTH-05: Secure token rotation

**Development Tasks:**

- RefreshToken entity and repository
- RefreshToken use case
- Token blacklist mechanism
- Extended AuthController

**Endpoints:**

- `POST /auth/refresh` - Refresh access token

---

### **EXT-03: Recurring Entries** 🔄

**User Story:** As a user, I want to automate recurring income/expenses like salary and subscriptions.

**Use Cases:**

- UC-REC-01: Create recurring entries
- UC-REC-02: List active recurring entries
- UC-REC-03: Deactivate recurring entries
- UC-REC-04: Process recurring entries automatically

**Development Tasks:**

- RecurringEntry entity (frequency, startDate, endDate, isActive)
- Recurring entry CRUD use cases
- Background job processor
- RecurringEntryController

**Endpoints:**

- `POST /recurring-entries` - Create recurring entry
- `GET /recurring-entries` - List recurring entries
- `PATCH /recurring-entries/:id/deactivate` - Deactivate recurring entry

---

### **EXT-04: Social Authentication** 🌐

**User Story:** As a user, I want to login using Google, Apple, or other social providers.

**Use Cases:**

- UC-SOCIAL-01: Google OAuth login
- UC-SOCIAL-02: Apple Sign-In
- UC-SOCIAL-03: Account linking

**Development Tasks:**

- AuthProvider entity for social accounts
- OAuth integration services
- Social profile mapping
- Extended AuthController

**Endpoints:**

- `POST /auth/social` - Social authentication
- `GET /auth/providers` - List available providers

---

### **EXT-05: Advanced Analytics** 📊

**User Story:** As a user, I want detailed insights into my spending patterns and trends.

**Use Cases:**

- UC-ANALYTICS-01: Category spending breakdown
- UC-ANALYTICS-02: Monthly/yearly comparisons
- UC-ANALYTICS-03: Spending trends analysis
- UC-ANALYTICS-04: Budget vs actual analysis

**Development Tasks:**

- Analytics service with complex queries
- Chart data preparation
- AnalyticsController
- Statistical calculations

**Endpoints:**

- `GET /analytics/spending-by-category` - Category breakdown
- `GET /analytics/monthly-comparison` - Monthly trends
- `GET /analytics/trends` - Spending patterns

---

### **EXT-06: Budgeting System** 💰

**User Story:** As a user, I want to set budgets for categories and track my progress.

**Use Cases:**

- UC-BUDGET-01: Create category budgets
- UC-BUDGET-02: Track budget progress
- UC-BUDGET-03: Budget alerts and notifications
- UC-BUDGET-04: Budget vs actual reports

**Development Tasks:**

- Budget entity (categoryId, amount, period, alertThreshold)
- Budget tracking use cases
- Budget alert system
- BudgetController

**Endpoints:**

- `POST /budgets` - Create budget
- `GET /budgets` - List budgets with progress
- `PUT /budgets/:id` - Update budget
- `GET /budgets/alerts` - Get budget alerts

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
