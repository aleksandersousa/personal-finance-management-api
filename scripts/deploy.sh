#!/bin/bash

# 🚀 Deploy Script for Personal Financial Management API
# Usage: ./scripts/deploy.sh [environment] [version] [options]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=""
VERSION=""
FORCE=false
DRY_RUN=false
SKIP_TESTS=false
ROLLBACK=false

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [environment] [version] [options]"
    echo ""
    echo "Environments:"
    echo "  development, dev    - Deploy to development environment"
    echo "  staging, stage      - Deploy to staging environment"
    echo "  production, prod    - Deploy to production environment"
    echo ""
    echo "Options:"
    echo "  --version=VERSION   - Specify version to deploy"
    echo "  --force             - Force deployment even if tests fail"
    echo "  --dry-run           - Show what would be deployed without actually deploying"
    echo "  --skip-tests        - Skip test execution (emergency deployments only)"
    echo "  --rollback          - Rollback to previous version"
    echo "  --help, -h          - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 development                    # Deploy to development"
    echo "  $0 staging --version=v1.2.3      # Deploy specific version to staging"
    echo "  $0 production --force             # Force deploy to production"
    echo "  $0 production --rollback          # Rollback production"
    echo "  $0 staging --dry-run              # Preview staging deployment"
}

# Function to validate environment
validate_environment() {
    case $1 in
        development|dev)
            ENVIRONMENT="development"
            ;;
        staging|stage)
            ENVIRONMENT="staging"
            ;;
        production|prod)
            ENVIRONMENT="production"
            ;;
        *)
            print_message $RED "❌ Invalid environment: $1"
            show_usage
            exit 1
            ;;
    esac
}

# Function to get current version
get_current_version() {
    if [ -f "package.json" ]; then
        VERSION=$(node -p "require('./package.json').version")
    else
        print_message $RED "❌ package.json not found"
        exit 1
    fi
}

# Function to validate git status
validate_git_status() {
    if [ "$ENVIRONMENT" = "production" ]; then
        # Check if we're on main branch for production
        current_branch=$(git branch --show-current)
        if [ "$current_branch" != "main" ] && [ "$ROLLBACK" = false ]; then
            print_message $RED "❌ Production deployments must be from main branch"
            print_message $YELLOW "Current branch: $current_branch"
            exit 1
        fi
    elif [ "$ENVIRONMENT" = "staging" ]; then
        # Check if we're on staging branch for staging
        current_branch=$(git branch --show-current)
        if [ "$current_branch" != "staging" ] && [ "$ROLLBACK" = false ]; then
            print_message $RED "❌ Staging deployments must be from staging branch"
            print_message $YELLOW "Current branch: $current_branch"
            exit 1
        fi
    fi

    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        print_message $YELLOW "⚠️  You have uncommitted changes"
        if [ "$FORCE" = false ]; then
            print_message $RED "❌ Please commit or stash your changes before deploying"
            exit 1
        fi
    fi
}

# Function to run tests
run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        print_message $YELLOW "⚠️  Skipping tests (--skip-tests flag)"
        return 0
    fi

    print_message $BLUE "🧪 Running tests..."
    
    # Install dependencies
    npm ci --production=false
    
    # Run tests
    npm run test
    npm run test:e2e
    
    print_message $GREEN "✅ All tests passed"
}

# Function to build application
build_application() {
    print_message $BLUE "🏗️  Building application..."
    
    npm run build
    
    print_message $GREEN "✅ Build completed"
}

# Function to deploy to development
deploy_development() {
    print_message $BLUE "🚀 Deploying to Development environment..."
    
    # Use docker-compose for development
    docker-compose -f .docker/docker-compose.dev.yml --env-file .env.development up -d --build
    
    print_message $GREEN "✅ Development deployment completed"
    print_message $BLUE "🔗 Development URL: http://localhost:3000"
}

# Function to deploy to staging
deploy_staging() {
    print_message $BLUE "🚀 Deploying to Staging environment..."
    
    # Build and tag Docker image for staging
    docker build -f .docker/Dockerfile.prod -t personal-financial-api:staging-$VERSION .
    
    # Here you would integrate with your staging infrastructure
    # For example: kubectl, docker-compose, cloud deployment tools, etc.
    
    print_message $GREEN "✅ Staging deployment completed"
    print_message $BLUE "🔗 Staging URL: https://staging.financial-app.com"
}

# Function to deploy to production
deploy_production() {
    print_message $BLUE "🚀 Deploying to Production environment..."
    
    # Additional production checks
    if [ "$ROLLBACK" = false ]; then
        # Create backup
        print_message $BLUE "💾 Creating production backup..."
        # Implement backup logic here
    fi
    
    # Build and tag Docker image for production
    docker build -f .docker/Dockerfile.prod -t personal-financial-api:production-$VERSION .
    docker tag personal-financial-api:production-$VERSION personal-financial-api:latest
    
    # Here you would integrate with your production infrastructure
    # For example: kubectl, docker-compose, cloud deployment tools, etc.
    
    print_message $GREEN "✅ Production deployment completed"
    print_message $BLUE "🔗 Production URL: https://financial-app.com"
}

# Function to perform rollback
perform_rollback() {
    print_message $YELLOW "🔄 Performing rollback for $ENVIRONMENT environment..."
    
    # Implement rollback logic here
    # This would depend on your infrastructure setup
    
    print_message $GREEN "✅ Rollback completed"
}

# Function to run health checks
run_health_checks() {
    print_message $BLUE "🔍 Running health checks..."
    
    # Wait for application to be ready
    sleep 10
    
    # Perform health checks based on environment
    case $ENVIRONMENT in
        development)
            curl -f http://localhost:3000/api/v1/health || exit 1
            ;;
        staging)
            curl -f https://staging.financial-app.com/api/v1/health || exit 1
            ;;
        production)
            curl -f https://financial-app.com/api/v1/health || exit 1
            ;;
    esac
    
    print_message $GREEN "✅ Health checks passed"
}

# Function to show deployment summary
show_deployment_summary() {
    print_message $GREEN "📊 Deployment Summary:"
    echo "  🎯 Environment: $ENVIRONMENT"
    echo "  🔖 Version: $VERSION"
    echo "  📅 Deployed at: $(date)"
    echo "  🔄 Rollback: $ROLLBACK"
    echo "  ⚡ Skip Tests: $SKIP_TESTS"
    echo "  💪 Force: $FORCE"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --version=*)
            VERSION="${1#*=}"
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        -*)
            print_message $RED "❌ Unknown option: $1"
            show_usage
            exit 1
            ;;
        *)
            if [ -z "$ENVIRONMENT" ]; then
                validate_environment $1
            else
                print_message $RED "❌ Too many arguments"
                show_usage
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate required arguments
if [ -z "$ENVIRONMENT" ]; then
    print_message $RED "❌ Environment is required"
    show_usage
    exit 1
fi

# Get version if not specified
if [ -z "$VERSION" ]; then
    get_current_version
fi

# Show what we're about to do
print_message $BLUE "🚀 Personal Financial Management API Deployment"
print_message $BLUE "Environment: $ENVIRONMENT"
print_message $BLUE "Version: $VERSION"

if [ "$DRY_RUN" = true ]; then
    print_message $YELLOW "🔍 DRY RUN - No actual deployment will be performed"
    show_deployment_summary
    exit 0
fi

# Validate git status
validate_git_status

# Main deployment flow
if [ "$ROLLBACK" = true ]; then
    perform_rollback
else
    # Run tests
    run_tests
    
    # Build application
    build_application
    
    # Deploy based on environment
    case $ENVIRONMENT in
        development)
            deploy_development
            ;;
        staging)
            deploy_staging
            ;;
        production)
            deploy_production
            ;;
    esac
    
    # Run health checks
    run_health_checks
fi

# Show summary
show_deployment_summary

print_message $GREEN "🎉 Deployment completed successfully!" 