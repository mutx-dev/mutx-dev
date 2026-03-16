#!/bin/bash
# MUTX Seed Data Script - Creates test agents/deployments for local dev
set -euo pipefail
API_URL="${API_URL:-http://localhost:8000}"
TEST_EMAIL="${TEST_EMAIL:-test@local.dev}"
TEST_PASSWORD="${TEST_PASSWORD:-TestPass123!}"
ACCESS_TOKEN="${ACCESS_TOKEN:-}"
GREEN="[0;32m" RED="[0;31m" YELLOW="[1;33m" BLUE="[0;34m" NC="[0m"
print_header() { echo ""; echo -e "${BLUE}=== $1 ===${NC}"; }
get_token() {
    if [ -n "$ACCESS_TOKEN" ]; then return 0; fi
    print_header "Logging in..."
    response=$(curl -sf -X POST "$API_URL/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" 2>&1) || true
    if echo "$response" | grep -q "access_token"; then
        ACCESS_TOKEN=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get(\"access_token\",\"\"))" 2>/dev/null)
        echo -e "${GREEN}OK Login successful${NC}"
    else echo -e "${RED}X Login failed: $response${NC}"; exit 1; fi
}
create_agents() {
    print_header "Creating Test Agents"
    get_token
    for name in "test-gpt4-agent" "test-claude-agent" "test-langchain-agent" "test-custom-agent"; do
        echo -n "Creating $name... "
        type=$(echo $name | sed "s/test-\(.*\)-agent//")
        response=$(curl -sf -X POST "$API_URL/v1/agents" -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" -d "{\"name\":\"$name\",\"type\":\"$type\",\"description\":\"Test $type agent\"}" 2>&1) || true
        if echo "$response" | grep -q "id"; then echo -e "${GREEN}OK${NC}"; elif echo "$response" | grep -q "exists"; then echo -e "${YELLOW}EXISTS${NC}"; else echo -e "${RED}FAIL: $response${NC}"; fi
    done
}
create_deployments() {
    print_header "Creating Test Deployments"
    get_token
    for name in "test-staging" "test-prod" "test-eu"; do
        echo -n "Creating deployment $name... "
        env=$(echo $name | grep -q "prod" && echo "production" || echo "staging")
        response=$(curl -sf -X POST "$API_URL/v1/deployments" -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" -d "{\"name\":\"$name\",\"environment\":\"$env\"}" 2>&1) || true
        if echo "$response" | grep -q "id"; then echo -e "${GREEN}OK${NC}"; elif echo "$response" | grep -q "exists"; then echo -e "${YELLOW}EXISTS${NC}"; else echo -e "${RED}FAIL: $response${NC}"; fi
    done
}
case "${1:-}" in --agents) create_agents;; --deployments) create_deployments;; *) create_agents; create_deployments;; esac
