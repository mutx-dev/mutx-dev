# MUTX Makefile
# Local development shortcuts
#
# Usage:
#   make help         Show this help
#   make dev          Start local dev stack and follow logs
#   make dev-up       Start local dev stack in detached mode
#   make dev-logs     Follow local dev logs
#   make dev-stop     Stop dev stack
#   make test-api     Run API health tests
#   make test-api-auth Run API tests with auth bootstrap
#   make test-auth    Register test user, login, and show token (one-command)
#   make test         Run full test suite
#   make lint         Run linters

# Default target
.PHONY: help
help:
	@echo "MUTX Local Development"
	@echo "======================="
	@echo ""
	@echo "  make dev         Start local dev stack and follow logs"
	@echo "  make dev-up      Start local dev stack in detached mode"
	@echo "  make dev-logs    Follow local dev logs"
	@echo "  make dev-stop    Stop dev stack"
	@echo "  make test-api   Run API health/ready tests"
	@echo "  make test-api-auth Run API checks with auth bootstrap"
	@echo "  make test-auth  Register test user, login, get token (one-command)"
	@echo "  make test       Run full test suite"
	@echo "  make lint        Run linters"
	@echo ""
	@echo "Quick Auth (one-command):"
	@echo "  make test-auth   # Registers test user, logs in, shows token + examples"
	@echo ""
	@echo "Services:"
	@echo "  Frontend:  http://localhost:3000"
	@echo "  Backend:   http://localhost:8000"
	@echo "  API Docs:  http://localhost:8000/docs"

# Start local dev stack
.PHONY: dev
dev:
	@./scripts/dev.sh start

# Start local dev stack in detached mode
.PHONY: dev-up
dev-up:
	@./scripts/dev.sh up

# Follow local dev logs
.PHONY: dev-logs
dev-logs:
	@./scripts/dev.sh logs

# Stop dev stack
.PHONY: dev-stop
dev-stop:
	@./scripts/dev.sh stop

# Run API tests
.PHONY: test-api
test-api:
	@./scripts/test-api.sh

# Run API tests with auth bootstrap
.PHONY: test-api-auth
test-api-auth:
	@./scripts/test-api.sh --register
	@./scripts/test-api.sh --with-auth

# Test auth flow - one-command setup for local testing
.PHONY: test-auth
test-auth:
	@echo "🧪 MUTX Auth Flow - One-Command Setup"
	@echo "======================================"
	@echo ""
	@API_URL="$${API_URL:-http://localhost:8000}" && \
	V1_URL="$${API_URL%/}" && \
	case "$$V1_URL" in */v1) ;; *) V1_URL="$$V1_URL/v1" ;; esac && \
	TEST_EMAIL="test@local.dev" && \
	TEST_PASS="TestPass123!" && \
	echo "Registering test user..." && \
	RESPONSE=$$(curl -sf -X POST "$$V1_URL/auth/register" \
		-H "Content-Type: application/json" \
		-d "{\"email\":\"$$TEST_EMAIL\",\"name\":\"Test User\",\"password\":\"$$TEST_PASS\"}" 2>/dev/null || echo "{}") && \
	echo "✓ User registered (or already exists)" && \
	echo "" && \
	echo "Logging in..." && \
	LOGIN_RESP=$$(curl -sf -X POST "$$V1_URL/auth/login" \
		-H "Content-Type: application/json" \
		-d "{\"email\":\"$$TEST_EMAIL\",\"password\":\"$$TEST_PASS\"}" 2>/dev/null) && \
	TOKEN=$$(echo "$$LOGIN_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token',''))" 2>/dev/null || echo "") && \
	if [ -n "$$TOKEN" ]; then \
		echo "✓ Login successful!"; \
		echo ""; \
		echo "======================================"; \
		echo "🔑 Your Access Token:"; \
		echo "======================================"; \
		echo "$$TOKEN"; \
		echo ""; \
		echo "======================================"; \
		echo "📝 Example Authenticated Requests:"; \
		echo "======================================"; \
		echo ""; \
		echo "curl $$V1_URL/auth/me -H \"Authorization: Bearer $$TOKEN\""; \
		echo ""; \
		echo "curl \"$$V1_URL/agents?limit=5\" -H \"Authorization: Bearer $$TOKEN\""; \
		echo ""; \
		echo "mutx --api-url $$API_URL login --email $$TEST_EMAIL --password $$TEST_PASS"; \
		echo ""; \
		ME_RESP=$$(curl -sf "$$V1_URL/auth/me" -H "Authorization: Bearer $$TOKEN" 2>/dev/null); \
		if [ -n "$$ME_RESP" ]; then \
			echo ""; \
			echo "✅ Test Request (auth/me):"; \
			echo "======================================"; \
			echo "$$ME_RESP" | python3 -m json.tool 2>/dev/null || echo "$$ME_RESP"; \
		fi; \
	else \
		echo "✗ Login failed. Check if API is running: $$API_URL"; \
		exit 1; \
	fi

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

# Seed data targets
.PHONY: seed
seed: test-auth
	@./scripts/seed.sh

.PHONY: seed-only
seed-only:
	@./scripts/seed.sh

# Run mutation testing
.PHONY: mutation-test
mutation-test:
	@echo "Running mutation testing..."
	@python -m mutmut run
	@echo ""
	@echo "Mutation testing results:"
	@python -m mutmut show
