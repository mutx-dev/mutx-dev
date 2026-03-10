#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "Building production Docker images..."

docker-compose -f docker-compose.production.yml build

echo "Deploying to production..."

docker-compose -f docker-compose.production.yml up -d

echo "Deployment complete!"
