# 👤 User Stories & Tasks (Backend)

### Story 1: Add fixed income

As a user, I want to register my salary so I can see it monthly.

- Tasks: Use AddEntry with `is_fixed = true`, `type = INCOME`
- Endpoint:  
  `POST /entries`

---

### Story 2: View summary

As a user, I want to view the monthly balance.

- Tasks: Use GetMonthlySummary
- Endpoint:  
  `GET /summary?month=YYYY-MM`

---

### Story 3: Add dynamic expense

As a user, I want to add occasional expenses so I can track irregular spending.

- Tasks: Use AddEntry with `is_fixed = false`, `type = EXPENSE`
- Endpoint:  
  `POST /entries`

---

### Story 4: Update an entry

As a user, I want to correct any mistakes in entries to keep my finances accurate.

- Tasks: Use UpdateEntry with the entry ID and updated data
- Endpoint:  
  `PUT /entries/:id`

---

### Story 5: Delete an entry

As a user, I want to remove entries I no longer want to track.

- Tasks: Use DeleteEntry with the entry ID
- Endpoint:  
  `DELETE /entries/:id`

---

### Story 6: List entries by month

As a user, I want to see all my entries for a given month to analyze spending and income.

- Tasks: Use ListEntriesByMonth with year and month parameters
- Endpoint:  
  `GET /entries?month=YYYY-MM`

---

### Story 7: Predict cash flow

As a user, I want to forecast my future cash flow based on fixed and dynamic entries.

- Tasks: Use PredictCashFlow to generate prediction data
- Endpoint:  
  `GET /forecast`

---

### Story 8: Manage categories

As a user, I want to create, update, delete, and list categories for better organization.

- Tasks:
  - AddCategory to create new categories  
    Endpoint: `POST /categories`
  - UpdateCategory to modify existing categories  
    Endpoint: `PUT /categories/:id`
  - DeleteCategory to remove categories  
    Endpoint: `DELETE /categories/:id`
  - ListCategories to retrieve all categories  
    Endpoint: `GET /categories`

---

### Story 9: User registration and login

As a user, I want to securely create an account and log in.

- Tasks:
  - RegisterUser to create a new user  
    Endpoint: `POST /auth/register`
  - LoginUser to authenticate credentials and generate JWT  
    Endpoint: `POST /auth/login`

---

### Story 10: Social authentication

As a user, I want to log in using Google, Apple, Twitter, etc.

- Tasks: Use AuthenticateWithProvider for social login flows
- Endpoint:  
  `POST /auth/social`

---

### Story 11: Refresh session

As a user, I want to refresh my authentication token without re-logging.

- Tasks: Use RefreshToken to generate a new access token using refresh token
- Endpoint:  
  `POST /auth/refresh`

---

### Story 12: Manage recurring entries

As a user, I want to add, list, and deactivate recurring entries (e.g., monthly subscriptions).

- Tasks:
  - AddRecurringEntry to add recurring expenses/incomes  
    Endpoint: `POST /recurring-entries`
  - ListRecurringEntries to view all active recurring entries  
    Endpoint: `GET /recurring-entries`
  - DeactivateRecurringEntry to stop a recurring entry  
    Endpoint: `PATCH /recurring-entries/:id/deactivate`

---

# 🧩 Use Cases and Tasks

( ... [mantém igual ao documento anterior] ... )

---

# 🌐 API Endpoints

| Method | Path                                | Description                        |
| ------ | ----------------------------------- | ---------------------------------- |
| POST   | `/entries`                          | Create new entry                   |
| GET    | `/entries?month=YYYY-MM`            | List entries for a month           |
| PUT    | `/entries/:id`                      | Update entry by ID                 |
| DELETE | `/entries/:id`                      | Delete entry by ID                 |
| GET    | `/summary?month=YYYY-MM`            | Get financial summary              |
| GET    | `/forecast`                         | Predict cash flow                  |
| POST   | `/categories`                       | Create new category                |
| GET    | `/categories`                       | List all categories                |
| PUT    | `/categories/:id`                   | Update category by ID              |
| DELETE | `/categories/:id`                   | Delete category by ID              |
| POST   | `/auth/register`                    | Register new user                  |
| POST   | `/auth/login`                       | User login                         |
| POST   | `/auth/social`                      | Social login (Google, Apple, etc.) |
| POST   | `/auth/refresh`                     | Refresh authentication token       |
| POST   | `/recurring-entries`                | Add recurring entry                |
| GET    | `/recurring-entries`                | List recurring entries             |
| PATCH  | `/recurring-entries/:id/deactivate` | Deactivate recurring entry         |

---
