#!/bin/bash
set -e

echo "Setting up mutx.dev..."

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
    echo "Creating .env from example..."
    cp .env.example .env
fi

echo "Installing Python dependencies..."
pip install -r requirements.txt
pip install -e ".[dev]" 2>/dev/null || true

echo "Installing Node.js dependencies..."
npm install

echo "Building Docker services..."
docker-compose build

echo "Starting database services..."
docker-compose up -d postgres redis

echo "Waiting for database to be ready..."
sleep 5

echo "Running migrations..."
PYTHONPATH=./src/api alembic upgrade head

echo "Setup complete!"
echo "Run ./scripts/dev.sh to start development services"
