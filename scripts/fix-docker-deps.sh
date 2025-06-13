#!/bin/bash

echo "🔧 Fixing Docker dependencies..."

# Stop containers
echo "📋 Stopping containers..."
docker-compose -f .docker/docker-compose.dev.yml --env-file .env.development down -v

# Remove any orphaned containers
echo "🧹 Cleaning up..."
docker-compose -f .docker/docker-compose.dev.yml --env-file .env.development down --remove-orphans

# Build without cache
echo "🏗️ Building containers without cache..."
docker-compose -f .docker/docker-compose.dev.yml --env-file .env.development build --no-cache

# Start containers
echo "🚀 Starting containers..."
docker-compose -f .docker/docker-compose.dev.yml --env-file .env.development up -d

# Wait for API to be ready
echo "⏳ Waiting for API to be ready..."
sleep 10

# Check if prom-client is available
echo "🔍 Checking if prom-client is available..."
docker-compose -f .docker/docker-compose.dev.yml --env-file .env.development exec api node -e "console.log('prom-client version:', require('prom-client/package.json').version)"

echo "✅ Done! Check the logs to see if the issue is resolved."
echo "📋 To see logs: docker-compose -f .docker/docker-compose.dev.yml --env-file .env.development logs -f api" 