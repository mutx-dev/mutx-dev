#!/bin/bash

# MUTX API Test Script
# Tests all API endpoints with optional auth for local development
#
# Usage:
#   ./test-api.sh              # Run basic health checks
#   ./test-api.sh --with-auth  # Run full test suite including authenticated endpoints
#   ./test-api.sh --register   # Register a new test user
#   ./test-api.sh --login      # Login and get token
#   ./test-api.sh --agents     # Test agents endpoint (requires auth)
#   ./test-api.sh --deployments # Test deployments endpoint (requires auth)
#   ./test-api.sh --api-keys   # Test API keys endpoint (requires auth)
#
# Environment variables:
#   API_URL       - API base URL (default: http://localhost:8000)
#   TEST_EMAIL    - Test user email (default: test@local.dev)
#   TEST_PASSWORD - Test user password (default: TestPass123!)
#   ACCESS_TOKEN  - Existing access token to use

set -e

API_URL="${API_URL:-http://localhost:8000}"
V1_URL="${API_URL%/}"
case "$V1_URL" in
    */v1) ;;
    *) V1_URL="$V1_URL/v1" ;;
esac
TEST_EMAIL="${TEST_EMAIL:-test@local.dev}"
TEST_PASSWORD="${TEST_PASSWORD:-TestPass123!}"
ACCESS_TOKEN="${ACCESS_TOKEN:-}"

# Colors
GREEN=$(printf '[0;32m')
RED=$(printf '[0;31m')
YELLOW=$(printf '[1;33m')
BLUE=$(printf '[0;34m')
NC=$(printf '[0m')

print_header() {
    echo ""
    echo -e "${BLUE}$(printf '═%.0s' {1..60})${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}$(printf '═%.0s' {1..60})${NC}"
    echo ""
}

test_endpoint() {
    local name="$1"
    local url="$2"
    local method="${3:-GET}"
    local data="$4"
    local token="$5"

    echo -n "$name... "

    local curl_args=("-sf")

    if [ -n "$token" ]; then
        curl_args+=("-H" "Authorization: Bearer $token")
    fi

    if [ -n "$data" ]; then
        curl_args+=("-H" "Content-Type: application/json" "-d" "$data")
    fi

    if [ "$method" != "GET" ]; then
        curl_args+=("-X" "$method")
    fi

    local response
    if response=$(curl "${curl_args[@]}" "$url" 2>&1); then
        if echo "$response" | grep -q 'error' && echo "$response" | grep -q 'detail'; then
            echo -e "${RED}X FAIL${NC}"
            echo "  Response: $response" | head -5
            return 1
        else
            echo -e "${GREEN}OK PASS${NC}"
            return 0
        fi
    else
        echo -e "${RED}X FAIL${NC}"
        echo "  Error: $response" | head -3
        return 1
    fi
}

do_register() {
    print_header "Register Test User"

    local payload
    payload=$(printf '{"email":"%s","name":"%s","password":"%s"}' "$TEST_EMAIL" "Test User" "$TEST_PASSWORD")

    local response
    response=$(curl -sf -X POST "$V1_URL/auth/register"         -H "Content-Type: application/json"         -d "$payload" 2>&1) || true

    if echo "$response" | grep -q "Email already registered"; then
        echo -e "${YELLOW}User already exists, trying login...${NC}"
        do_login
    elif echo "$response" | grep -q "access_token"; then
        echo -e "${GREEN}OK User registered successfully${NC}"
        ACCESS_TOKEN=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null || echo "")
        echo "Access token: ${ACCESS_TOKEN:0:20}..."
        export ACCESS_TOKEN
    else
        echo -e "${RED}X Registration failed: $response${NC}"
        exit 1
    fi
}

do_login() {
    print_header "Login"

    local payload
    payload=$(printf '{"email":"%s","password":"%s"}' "$TEST_EMAIL" "$TEST_PASSWORD")

    local response
    response=$(curl -sf -X POST "$V1_URL/auth/login"         -H "Content-Type: application/json"         -d "$payload" 2>&1) || true

    if echo "$response" | grep -q "access_token"; then
        ACCESS_TOKEN=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null || echo "")
        echo -e "${GREEN}OK Login successful${NC}"
        echo "Access token: ${ACCESS_TOKEN:0:20}..."
        export ACCESS_TOKEN
    else
        echo -e "${RED}X Login failed: $response${NC}"
        exit 1
    fi
}

do_auth_tests() {
    if [ -z "$ACCESS_TOKEN" ]; then
        echo -e "${YELLOW}No access token, attempting login...${NC}"
        do_login
    fi

    print_header "Authenticated API Tests"

    test_endpoint "Get Current User" "$V1_URL/auth/me" "GET" "" "$ACCESS_TOKEN"
    test_endpoint "List Agents" "$V1_URL/agents?limit=5" "GET" "" "$ACCESS_TOKEN"
    test_endpoint "List Deployments" "$V1_URL/deployments?limit=5" "GET" "" "$ACCESS_TOKEN"
    test_endpoint "List API Keys" "$V1_URL/api-keys" "GET" "" "$ACCESS_TOKEN"
    test_endpoint "List Runs" "$V1_URL/runs?limit=5" "GET" "" "$ACCESS_TOKEN"
}

do_agents() {
    if [ -z "$ACCESS_TOKEN" ]; then
        do_login
    fi
    echo -e "${BLUE}Fetching agents...${NC}"
    curl -sf "$V1_URL/agents?limit=10" -H "Authorization: Bearer $ACCESS_TOKEN" | python3 -m json.tool 2>/dev/null || echo "Failed to fetch agents"
}

do_deployments() {
    if [ -z "$ACCESS_TOKEN" ]; then
        do_login
    fi
    echo -e "${BLUE}Fetching deployments...${NC}"
    curl -sf "$V1_URL/deployments?limit=10" -H "Authorization: Bearer $ACCESS_TOKEN" | python3 -m json.tool 2>/dev/null || echo "Failed to fetch deployments"
}

do_api_keys() {
    if [ -z "$ACCESS_TOKEN" ]; then
        do_login
    fi
    echo -e "${BLUE}Fetching API keys...${NC}"
    curl -sf "$V1_URL/api-keys" -H "Authorization: Bearer $ACCESS_TOKEN" | python3 -m json.tool 2>/dev/null || echo "Failed to fetch API keys"
}

do_health_checks() {
    print_header "MUTX API Test Suite"
    echo "API URL: $API_URL"
    echo "Test Email: $TEST_EMAIL"
    echo ""

    test_endpoint "Health Check" "$API_URL/health"
    test_endpoint "Ready Check" "$API_URL/ready"
    test_endpoint "Root Endpoint" "$API_URL/"
    test_endpoint "API Docs" "$API_URL/docs"
    test_endpoint "OpenAPI Schema" "$API_URL/openapi.json"
}

usage() {
    echo "MUTX API Test Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  (no args)          Run basic health checks"
    echo "  --with-auth        Run full test suite with authentication"
    echo "  --register         Register a new test user"
    echo "  --login            Login and get access token"
    echo "  --agents           Test agents endpoint (auto-login)"
    echo "  --deployments      Test deployments endpoint (auto-login)"
    echo "  --api-keys         Test API keys endpoint (auto-login)"
    echo "  -h, --help         Show this help"
    echo ""
    echo "Environment variables:"
    echo "  API_URL            API base URL (default: http://localhost:8000)"
    echo "  TEST_EMAIL         Test user email (default: test@local.dev)"
    echo "  TEST_PASSWORD      Test user password (default: TestPass123!)"
    echo "  ACCESS_TOKEN       Existing access token"
    echo ""
    echo "Examples:"
    echo "  $0                           # Health checks only"
    echo "  $0 --with-auth               # Full test suite"
    echo "  TEST_EMAIL=dev@local.dev $0 --login  # Custom user"
    echo "  ACCESS_TOKEN=xxx $0 --agents # Use existing token"
}

case "${1:-}" in
    --with-auth)
        do_health_checks
        do_auth_tests
        print_header "All Tests Complete"
        ;;
    --register)
        do_register
        ;;
    --login)
        do_login
        ;;
    --agents)
        do_agents
        ;;
    --deployments)
        do_deployments
        ;;
    --api-keys)
        do_api_keys
        ;;
    -h|--help)
        usage
        ;;
    *)
        do_health_checks
        print_header "Quick Start"
        echo "Run with --with-auth to test authenticated endpoints"
        echo "Or use specific commands:"
        echo "  $0 --login        # Login and get token"
        echo "  $0 --agents       # List agents"
        echo "  $0 --deployments # List deployments"
        ;;
esac
