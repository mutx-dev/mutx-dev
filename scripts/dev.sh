#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "Starting development services..."

docker-compose up

echo "Development services stopped."
