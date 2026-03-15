# MUTX Makefile
# Local development shortcuts
#
# Usage:
#   make help         Show this help
#   make dev          Start local dev stack (Docker Compose)
#   make dev-stop    Stop dev stack
#   make test-api    Run API health tests
#   make test        Run full test suite
#   make lint        Run linters

# Default target
.PHONY: help
help:
	@echo "MUTX Local Development"
	@echo "======================="
	@echo ""
	@echo "  make dev         Start local dev stack (Docker Compose)"
	@echo "  make dev-stop    Stop dev stack"
	@echo "  make test-api   Run API health/ready tests"
	@echo "  make test       Run full test suite"
	@echo "  make lint        Run linters"
	@echo ""
	@echo "Auth Flow for Local Testing"
	@echo "---------------------------"
	@echo "1. Register: curl -X POST http://localhost:8000/api/auth/register \\"
	@echo "     -H 'Content-Type: application/json' \\"
	@echo "     -d '{\"email\":\"test@example.com\",\"password\":\"testpass123\"}'"
	@echo ""
	@echo "2. Login: curl -X POST http://localhost:8000/api/auth/login \\"
	@echo "     -H 'Content-Type: application/json' \\"
	@echo "     -d '{\"email\":\"test@example.com\",\"password\":\"testpass123\"}'"
	@echo ""
	@echo "3. Use token: curl http://localhost:8000/api/auth/me \\"
	@echo "     -H 'Authorization: Bearer <YOUR_TOKEN>'"
	@echo ""
	@echo "Services:"
	@echo "  Frontend:  http://localhost:3000"
	@echo "  Backend:   http://localhost:8000"
	@echo "  API Docs:  http://localhost:8000/docs"

# Start local dev stack
.PHONY: dev
dev:
	@./scripts/dev.sh

# Stop dev stack
.PHONY: dev-stop
dev-stop:
	@cd infrastructure/docker && docker compose down || true

# Run API tests
.PHONY: test-api
test-api:
	@./scripts/test-api.sh

# Run full test suite
.PHONY: test
test:
	@./scripts/test.sh

# Run linters
.PHONY: lint
lint:
	@echo "Running frontend lint..."
	@npm run lint
	@echo ""
	@echo "Running Python lint..."
	@.venv/bin/ruff check src/api cli sdk || ruff check src/api cli sdk
