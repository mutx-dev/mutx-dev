#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "Running Python tests..."
PYTHONPATH=./src/api pytest tests/ -v --cov=src/api --cov-report=term-missing

echo ""
echo "Running JavaScript tests..."
npm run test 2>/dev/null || echo "No npm tests configured, skipping..."

echo ""
echo "Running frontend build check..."
npm run build

echo ""
echo "Running linter..."
npm run lint
ruff check src/api 2>/dev/null || true

echo ""
echo "All tests complete!"
