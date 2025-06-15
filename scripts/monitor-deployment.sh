#!/bin/bash

# 📊 Deployment Monitoring Script
# Usage: ./scripts/monitor-deployment.sh [environment] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=""
DURATION=300  # 5 minutes default
INTERVAL=30   # 30 seconds default
VERBOSE=false
CONTINUOUS=false

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [environment] [options]"
    echo ""
    echo "Environments:"
    echo "  development, dev    - Monitor development environment"
    echo "  staging, stage      - Monitor staging environment"
    echo "  production, prod    - Monitor production environment"
    echo "  all                 - Monitor all environments"
    echo ""
    echo "Options:"
    echo "  --duration=SECONDS  - Monitor for specified duration (default: 300)"
    echo "  --interval=SECONDS  - Check interval in seconds (default: 30)"
    echo "  --verbose           - Show detailed information"
    echo "  --continuous        - Run continuously until stopped"
    echo "  --help, -h          - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 production                     # Monitor production for 5 minutes"
    echo "  $0 staging --duration=600         # Monitor staging for 10 minutes"
    echo "  $0 all --continuous               # Monitor all environments continuously"
    echo "  $0 development --verbose          # Monitor development with details"
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
        all)
            ENVIRONMENT="all"
            ;;
        *)
            print_message $RED "❌ Invalid environment: $1"
            show_usage
            exit 1
            ;;
    esac
}

# Function to get environment URL
get_environment_url() {
    case $1 in
        development)
            echo "http://localhost:3000"
            ;;
        staging)
            echo "https://staging.financial-app.com"
            ;;
        production)
            echo "https://financial-app.com"
            ;;
    esac
}

# Function to check health endpoint
check_health() {
    local env=$1
    local url=$(get_environment_url $env)
    local health_url="${url}/api/v1/health"
    
    if [ "$VERBOSE" = true ]; then
        print_message $BLUE "🔍 Checking health: $health_url"
    fi
    
    local response_code
    local response_time
    local response_body
    
    # Get response time and status code
    response_code=$(curl -o /dev/null -s -w "%{http_code}" -m 10 "$health_url" 2>/dev/null || echo "000")
    response_time=$(curl -o /dev/null -s -w "%{time_total}" -m 10 "$health_url" 2>/dev/null || echo "0")
    
    if [ "$response_code" = "200" ]; then
        response_body=$(curl -s -m 10 "$health_url" 2>/dev/null || echo "{}")
        
        if [ "$VERBOSE" = true ]; then
            print_message $GREEN "✅ $env: Healthy (${response_time}s)"
            echo "   Response: $response_body"
        else
            printf "%-12s ✅ Healthy (%.3fs)\n" "$env:" "$response_time"
        fi
        return 0
    else
        if [ "$VERBOSE" = true ]; then
            print_message $RED "❌ $env: Unhealthy (HTTP $response_code, ${response_time}s)"
        else
            printf "%-12s ❌ Unhealthy (HTTP %s, %.3fs)\n" "$env:" "$response_code" "$response_time"
        fi
        return 1
    fi
}

# Function to check metrics endpoint
check_metrics() {
    local env=$1
    local url=$(get_environment_url $env)
    local metrics_url="${url}/api/v1/metrics"
    
    local response_code
    response_code=$(curl -o /dev/null -s -w "%{http_code}" -m 10 "$metrics_url" 2>/dev/null || echo "000")
    
    if [ "$response_code" = "200" ]; then
        if [ "$VERBOSE" = true ]; then
            print_message $GREEN "📊 $env: Metrics available"
        fi
        return 0
    else
        if [ "$VERBOSE" = true ]; then
            print_message $YELLOW "⚠️  $env: Metrics unavailable (HTTP $response_code)"
        fi
        return 1
    fi
}

# Function to check database connectivity (through health endpoint)
check_database() {
    local env=$1
    local url=$(get_environment_url $env)
    local health_url="${url}/api/v1/health"
    
    local response_body
    response_body=$(curl -s -m 10 "$health_url" 2>/dev/null || echo "{}")
    
    # Check if response contains database status
    if echo "$response_body" | grep -q '"database"'; then
        local db_status
        db_status=$(echo "$response_body" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
        
        if [ "$db_status" = "healthy" ] || [ "$db_status" = "ok" ]; then
            if [ "$VERBOSE" = true ]; then
                print_message $GREEN "🗃️  $env: Database healthy"
            fi
            return 0
        else
            if [ "$VERBOSE" = true ]; then
                print_message $RED "❌ $env: Database unhealthy ($db_status)"
            fi
            return 1
        fi
    else
        if [ "$VERBOSE" = true ]; then
            print_message $YELLOW "⚠️  $env: Database status unknown"
        fi
        return 1
    fi
}

# Function to monitor single environment
monitor_environment() {
    local env=$1
    local start_time=$(date +%s)
    local end_time=$((start_time + DURATION))
    local check_count=0
    local success_count=0
    
    print_message $BLUE "📊 Monitoring $env environment..."
    
    while [ "$CONTINUOUS" = true ] || [ $(date +%s) -lt $end_time ]; do
        echo ""
        print_message $PURPLE "$(date '+%Y-%m-%d %H:%M:%S') - Check #$((check_count + 1))"
        
        # Health check
        if check_health $env; then
            success_count=$((success_count + 1))
        fi
        
        # Additional checks if verbose
        if [ "$VERBOSE" = true ]; then
            check_metrics $env
            check_database $env
        fi
        
        check_count=$((check_count + 1))
        
        # Break if not continuous and duration exceeded
        if [ "$CONTINUOUS" = false ] && [ $(date +%s) -ge $end_time ]; then
            break
        fi
        
        # Wait for next check
        if [ "$CONTINUOUS" = true ] || [ $(date +%s) -lt $((end_time - INTERVAL)) ]; then
            sleep $INTERVAL
        fi
    done
    
    # Show summary
    echo ""
    print_message $BLUE "📊 Monitoring Summary for $env:"
    print_message $BLUE "   Total checks: $check_count"
    print_message $BLUE "   Successful: $success_count"
    print_message $BLUE "   Failed: $((check_count - success_count))"
    
    if [ $check_count -gt 0 ]; then
        local success_rate=$((success_count * 100 / check_count))
        if [ $success_rate -ge 95 ]; then
            print_message $GREEN "   Success rate: ${success_rate}% ✅"
        elif [ $success_rate -ge 80 ]; then
            print_message $YELLOW "   Success rate: ${success_rate}% ⚠️"
        else
            print_message $RED "   Success rate: ${success_rate}% ❌"
        fi
    fi
}

# Function to monitor all environments
monitor_all_environments() {
    local environments=("development" "staging" "production")
    local start_time=$(date +%s)
    local end_time=$((start_time + DURATION))
    
    print_message $BLUE "📊 Monitoring all environments..."
    
    while [ "$CONTINUOUS" = true ] || [ $(date +%s) -lt $end_time ]; do
        echo ""
        print_message $PURPLE "$(date '+%Y-%m-%d %H:%M:%S') - Multi-Environment Check"
        echo "============================================================"
        
        for env in "${environments[@]}"; do
            check_health $env
        done
        
        echo "============================================================"
        
        # Break if not continuous and duration exceeded
        if [ "$CONTINUOUS" = false ] && [ $(date +%s) -ge $end_time ]; then
            break
        fi
        
        # Wait for next check
        if [ "$CONTINUOUS" = true ] || [ $(date +%s) -lt $((end_time - INTERVAL)) ]; then
            sleep $INTERVAL
        fi
    done
}

# Function to setup monitoring dashboard
setup_monitoring() {
    print_message $BLUE "🚀 Setting up monitoring dashboard..."
    
    # Create monitoring log directory
    mkdir -p logs/monitoring
    
    # Start monitoring in background with logging
    local log_file="logs/monitoring/monitor-$(date +%Y%m%d-%H%M%S).log"
    
    if [ "$ENVIRONMENT" = "all" ]; then
        monitor_all_environments 2>&1 | tee "$log_file"
    else
        monitor_environment "$ENVIRONMENT" 2>&1 | tee "$log_file"
    fi
    
    print_message $GREEN "✅ Monitoring completed. Log saved to: $log_file"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --duration=*)
            DURATION="${1#*=}"
            shift
            ;;
        --interval=*)
            INTERVAL="${1#*=}"
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --continuous)
            CONTINUOUS=true
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

# Show monitoring configuration
print_message $BLUE "🔍 Deployment Monitoring Configuration"
print_message $BLUE "Environment: $ENVIRONMENT"
if [ "$CONTINUOUS" = true ]; then
    print_message $BLUE "Duration: Continuous (until stopped)"
else
    print_message $BLUE "Duration: ${DURATION} seconds"
fi
print_message $BLUE "Interval: ${INTERVAL} seconds"
print_message $BLUE "Verbose: $VERBOSE"
echo ""

# Handle interrupt signal for graceful shutdown
trap 'print_message $YELLOW "\n⚠️  Monitoring interrupted by user"; exit 0' INT

# Start monitoring
setup_monitoring 