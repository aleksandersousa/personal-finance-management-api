# Git Workflow Requirements

## Overview

This document outlines the git workflow, branching strategy, and commit conventions for the Personal Financial Management API project. The project follows **Git Flow** methodology with **Conventional Commits** to ensure clean, traceable, and maintainable version control.

## Table of Contents

1. [Git Flow Overview](#git-flow-overview)
2. [Branch Types](#branch-types)
3. [Branching Strategy](#branching-strategy)
4. [Conventional Commits](#conventional-commits)
5. [Workflow Examples](#workflow-examples)
6. [Best Practices](#best-practices)
7. [Tools and Setup](#tools-and-setup)

## Git Flow Overview

Git Flow is a branching model that defines a strict branching model designed around the project release. It provides a robust framework for managing larger projects with scheduled releases.

### Main Branches

- **`main`**: Production-ready code. Only stable, tested code is merged here.
- **`develop`**: Integration branch for features. All feature development is merged here first.

### Supporting Branches

- **Feature branches**: For developing new features
- **Release branches**: For preparing new production releases
- **Hotfix branches**: For fixing critical issues in production

## Branch Types

### 1. Feature Branches

- **Purpose**: Develop new features or user stories
- **Naming Convention**: `feature/US-{story-number}-{brief-description}`
- **Base Branch**: `develop`
- **Merge Target**: `develop`

**Examples:**

```bash
feature/US-001-user-authentication
feature/US-002-transaction-management
feature/US-003-budget-tracking
```

### 2. Release Branches

- **Purpose**: Prepare for production releases
- **Naming Convention**: `release/{version}`
- **Base Branch**: `develop`
- **Merge Target**: `main` and `develop`

**Examples:**

```bash
release/1.0.0
release/1.1.0
release/2.0.0
```

### 3. Hotfix Branches

- **Purpose**: Fix critical issues in production
- **Naming Convention**: `hotfix/{version}-{brief-description}`
- **Base Branch**: `main`
- **Merge Target**: `main` and `develop`

**Examples:**

```bash
hotfix/1.0.1-authentication-fix
hotfix/1.0.2-database-connection
```

### 4. Bug Fix Branches

- **Purpose**: Fix non-critical bugs during development
- **Naming Convention**: `bugfix/US-{story-number}-{brief-description}`
- **Base Branch**: `develop`
- **Merge Target**: `develop`

**Examples:**

```bash
bugfix/US-001-validation-error
bugfix/US-002-response-format
```

## Branching Strategy

### User Story Implementation Process

1. **Create Feature Branch**

   ```bash
   git switch develop
   git pull origin develop
   git switch -c feature/US-001-user-authentication
   ```

2. **Implement in Small Steps**

   - Each implementation step should have its own commit
   - Follow conventional commit format
   - Commit frequently with meaningful messages

3. **Push and Create Pull Request**

   ```bash
   git push origin feature/US-001-user-authentication
   # Create PR from feature branch to develop
   ```

4. **Code Review and Merge**
   - Require at least one code review
   - Run automated tests
   - Merge to develop after approval

## Conventional Commits

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

| Type         | Description               | Example                                          |
| ------------ | ------------------------- | ------------------------------------------------ |
| **feat**     | New feature               | `feat(auth): add JWT authentication`             |
| **fix**      | Bug fix                   | `fix(transactions): resolve date parsing issue`  |
| **docs**     | Documentation changes     | `docs(api): update endpoint documentation`       |
| **style**    | Code style changes        | `style(user): format code with prettier`         |
| **refactor** | Code refactoring          | `refactor(database): optimize query performance` |
| **test**     | Adding or modifying tests | `test(auth): add unit tests for login`           |
| **chore**    | Maintenance tasks         | `chore(deps): update dependencies`               |
| **ci**       | CI/CD changes             | `ci(docker): update build pipeline`              |
| **perf**     | Performance improvements  | `perf(api): optimize response time`              |
| **build**    | Build system changes      | `build(webpack): update configuration`           |

### Scopes (Optional)

Common scopes for this project:

- `auth` - Authentication related
- `transactions` - Transaction management
- `users` - User management
- `budgets` - Budget tracking
- `reports` - Reporting features
- `api` - API endpoints
- `database` - Database related
- `tests` - Testing related
- `docs` - Documentation

### Breaking Changes

For breaking changes, add `!` after the type/scope:

```bash
feat(api)!: change user authentication endpoint

BREAKING CHANGE: The /auth/login endpoint now requires additional parameters
```

## Workflow Examples

### Example 1: Implementing User Authentication (US-001)

```bash
# 1. Create feature branch
git checkout develop
git pull origin develop
git checkout -b feature/US-001-user-authentication

# 2. Implementation steps with commits
# Step 1: Setup basic structure
git add .
git commit -m "feat(auth): setup authentication module structure"

# Step 2: Add user entity
git add .
git commit -m "feat(auth): add user entity and validation"

# Step 3: Implement login endpoint
git add .
git commit -m "feat(auth): implement login endpoint with JWT"

# Step 4: Add tests
git add .
git commit -m "test(auth): add unit tests for authentication"

# Step 5: Update documentation
git add .
git commit -m "docs(auth): add authentication API documentation"

# 3. Push and create PR
git push origin feature/US-001-user-authentication
```

### Example 2: Bug Fix During Development

```bash
# 1. Create bugfix branch
git checkout develop
git pull origin develop
git checkout -b bugfix/US-001-validation-error

# 2. Fix the issue
git add .
git commit -m "fix(auth): resolve email validation error"

# 3. Add test to prevent regression
git add .
git commit -m "test(auth): add test for email validation fix"

# 4. Push and create PR
git push origin bugfix/US-001-validation-error
```

### Example 3: Production Hotfix

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/1.0.1-critical-auth-fix

# 2. Fix the critical issue
git add .
git commit -m "fix(auth): resolve critical JWT expiration issue"

# 3. Add test
git add .
git commit -m "test(auth): add test for JWT expiration fix"

# 4. Push and create PRs to both main and develop
git push origin hotfix/1.0.1-critical-auth-fix
```

## Best Practices

### Commit Guidelines

1. **Commit Often**: Make small, logical commits for each step
2. **Clear Messages**: Write descriptive commit messages
3. **Single Responsibility**: Each commit should do one thing
4. **Test Before Commit**: Ensure code compiles and tests pass

### Branch Management

1. **Keep Branches Short-lived**: Merge feature branches quickly
2. **Regular Updates**: Pull from develop regularly to avoid conflicts
3. **Clean History**: Use rebase when appropriate to maintain clean history
4. **Delete Merged Branches**: Clean up branches after merging

### Code Review Process

1. **Self Review**: Review your own code before creating PR
2. **Descriptive PR**: Write clear PR descriptions with context
3. **Small PRs**: Keep pull requests focused and reviewable
4. **Address Feedback**: Respond to review comments promptly

### Commit Message Best Practices

```bash
# Good examples
feat(transactions): add monthly transaction filtering
fix(budgets): resolve calculation error for negative amounts
docs(api): update transaction endpoint documentation
test(users): add integration tests for user creation
refactor(database): optimize transaction queries

# Bad examples
git commit -m "fix bug"
git commit -m "add stuff"
git commit -m "update code"
git commit -m "changes"
```

## Tools and Setup

### Git Flow CLI Tool

Install git-flow to automate branch creation:

```bash
# Ubuntu/Debian
sudo apt-get install git-flow

# macOS
brew install git-flow-avh

# Initialize git flow
git flow init
```

### Conventional Commits Tools

#### Commitizen

Install commitizen for guided commit messages:

```bash
npm install -g commitizen
npm install -g cz-conventional-changelog

# Configure
echo '{ "path": "cz-conventional-changelog" }' > ~/.czrc

# Use
git cz
```

#### Commitlint

Setup commitlint to validate commit messages:

```bash
npm install --save-dev @commitlint/config-conventional @commitlint/cli

# Create commitlint.config.js
echo "module.exports = {extends: ['@commitlint/config-conventional']}" > commitlint.config.js

# Add to package.json
{
  "husky": {
    "hooks": {
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  }
}
```

### Pre-commit Hooks

Setup pre-commit hooks for code quality:

```bash
npm install --save-dev husky

# Add to package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npm run test",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  }
}
```

## Release Process

### Preparing a Release

1. **Create Release Branch**

   ```bash
   git flow release start 1.0.0
   ```

2. **Final Testing and Bug Fixes**

   ```bash
   git commit -m "fix(release): resolve final issues for v1.0.0"
   ```

3. **Update Version and Changelog**

   ```bash
   git commit -m "chore(release): bump version to 1.0.0"
   ```

4. **Finish Release**
   ```bash
   git flow release finish 1.0.0
   ```

### Tagging Strategy

- **Format**: `v{major}.{minor}.{patch}`
- **Examples**: `v1.0.0`, `v1.1.0`, `v2.0.0`
- **Annotated Tags**: Always use annotated tags for releases

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## Emergency Procedures

### Reverting Changes

#### Revert Last Commit

```bash
git revert HEAD
git commit -m "revert: undo problematic authentication change"
```

#### Revert Multiple Commits

```bash
git revert --no-commit HEAD~3..HEAD
git commit -m "revert: undo last 3 commits due to critical issue"
```

### Rolling Back Releases

#### Hotfix for Critical Issues

```bash
git checkout main
git checkout -b hotfix/1.0.1-critical-fix
# Fix the issue
git commit -m "fix(critical): resolve security vulnerability"
# Follow hotfix process
```

## Troubleshooting

### Common Issues

1. **Merge Conflicts**

   ```bash
   git merge develop
   # Resolve conflicts
   git add .
   git commit -m "merge: resolve conflicts with develop"
   ```

2. **Accidentally Committed to Wrong Branch**

   ```bash
   git reset --soft HEAD~1
   git stash
   git checkout correct-branch
   git stash pop
   git commit -m "feat(correct): move commit to correct branch"
   ```

3. **Need to Update Commit Message**
   ```bash
   git commit --amend -m "feat(auth): corrected commit message"
   ```

## Summary

This git workflow ensures:

- ✅ Clean, traceable version history
- ✅ Organized feature development
- ✅ Consistent commit messaging
- ✅ Reliable release process
- ✅ Quick hotfix deployment
- ✅ Collaborative development support

Following these guidelines will maintain code quality, enable efficient collaboration, and provide clear project history throughout the development lifecycle.
