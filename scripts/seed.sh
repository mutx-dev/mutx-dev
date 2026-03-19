#!/bin/bash
# MUTX seed data script - creates test agents and deployments for local dev.
set -euo pipefail

API_URL="${API_URL:-http://localhost:8000}"
V1_URL="${API_URL%/}"
case "$V1_URL" in
    */v1) ;;
    *) V1_URL="$V1_URL/v1" ;;
esac
TEST_EMAIL="${TEST_EMAIL:-test@local.dev}"
TEST_PASSWORD="${TEST_PASSWORD:-TestPass123!}"
ACCESS_TOKEN="${ACCESS_TOKEN:-}"

GREEN=$(printf '\033[0;32m')
RED=$(printf '\033[0;31m')
YELLOW=$(printf '\033[1;33m')
BLUE=$(printf '\033[0;34m')
NC=$(printf '\033[0m')

print_header() {
    echo ""
    echo -e "${BLUE}=== $1 ===${NC}"
}

extract_json_field() {
    local field="$1"
    python3 - "$field" <<'PY'
import json
import sys

field = sys.argv[1]
payload = json.load(sys.stdin)
value = payload.get(field)
if value is None:
    print("")
else:
    print(value)
PY
}

find_agent_id_by_name() {
    local target_name="$1"
    python3 - "$target_name" <<'PY'
import json
import sys

target_name = sys.argv[1]
agents = json.load(sys.stdin)
for agent in agents:
    if agent.get("name") == target_name:
        print(agent.get("id", ""))
        break
else:
    print("")
PY
}

has_deployment_for_agent() {
    local target_agent_id="$1"
    python3 - "$target_agent_id" <<'PY'
import json
import sys

target_agent_id = sys.argv[1]
deployments = json.load(sys.stdin)
for deployment in deployments:
    if deployment.get("agent_id") == target_agent_id and deployment.get("status") != "killed":
        print("yes")
        break
else:
    print("no")
PY
}

get_token() {
    if [ -n "$ACCESS_TOKEN" ]; then
        return 0
    fi

    print_header "Logging in"
    local response
    response=$(curl -sf -X POST "$V1_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" 2>&1) || true

    if echo "$response" | grep -q "access_token"; then
        ACCESS_TOKEN=$(printf '%s' "$response" | extract_json_field "access_token")
        echo -e "${GREEN}OK Login successful${NC}"
    else
        echo -e "${RED}X Login failed: $response${NC}"
        exit 1
    fi
}

list_agents() {
    curl -sf "$V1_URL/agents?limit=100" \
        -H "Authorization: Bearer $ACCESS_TOKEN"
}

list_deployments() {
    curl -sf "$V1_URL/deployments?limit=100" \
        -H "Authorization: Bearer $ACCESS_TOKEN"
}

ensure_agent() {
    local name="$1"
    local type="$2"
    local description="$3"
    local config_json="$4"

    local existing_agents existing_id response new_id
    existing_agents=$(list_agents)
    existing_id=$(printf '%s' "$existing_agents" | find_agent_id_by_name "$name")
    if [ -n "$existing_id" ]; then
        echo -e "${YELLOW}EXISTS${NC} $name ($existing_id)" >&2
        printf '%s\n' "$existing_id"
        return 0
    fi

    response=$(curl -sf -X POST "$V1_URL/agents" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"$name\",\"type\":\"$type\",\"description\":\"$description\",\"config\":$config_json}" 2>&1) || true

    if echo "$response" | grep -q '"id"'; then
        new_id=$(printf '%s' "$response" | extract_json_field "id")
        echo -e "${GREEN}OK${NC} $name ($new_id)" >&2
        printf '%s\n' "$new_id"
        return 0
    fi

    echo -e "${RED}FAIL${NC} agent $name: $response" >&2
    exit 1
}

ensure_deployment() {
    local agent_id="$1"
    local replicas="$2"
    local deployments has_existing response deployment_id

    deployments=$(list_deployments)
    has_existing=$(printf '%s' "$deployments" | has_deployment_for_agent "$agent_id")
    if [ "$has_existing" = "yes" ]; then
        echo -e "${YELLOW}EXISTS${NC} deployment for agent $agent_id" >&2
        return 0
    fi

    response=$(curl -sf -X POST "$V1_URL/deployments" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"agent_id\":\"$agent_id\",\"replicas\":$replicas}" 2>&1) || true

    if echo "$response" | grep -q '"id"'; then
        deployment_id=$(printf '%s' "$response" | extract_json_field "id")
        echo -e "${GREEN}OK${NC} deployment $deployment_id for agent $agent_id" >&2
        return 0
    fi

    echo -e "${RED}FAIL${NC} deployment for $agent_id: $response" >&2
    exit 1
}

create_agents() {
    print_header "Creating test agents"
    get_token

    AGENT_IDS=()
    AGENT_IDS+=("$(ensure_agent "test-openai-agent" "openai" "Test OpenAI agent" '{"model":"gpt-4o"}')")
    AGENT_IDS+=("$(ensure_agent "test-anthropic-agent" "anthropic" "Test Anthropic agent" '{"model":"claude-3-5-sonnet-20240620"}')")
    AGENT_IDS+=("$(ensure_agent "test-langchain-agent" "langchain" "Test LangChain agent" '{"chain_id":"local-dev-chain","parameters":{"mode":"seed"}}')")
    AGENT_IDS+=("$(ensure_agent "test-custom-agent" "custom" "Test custom agent" '{"image":"ghcr.io/mutx/custom-agent:local","command":["python","-m","agent"],"env":{"ENVIRONMENT":"development"}}')")
}

create_deployments() {
    print_header "Creating test deployments"
    get_token

    if [ "${#AGENT_IDS[@]}" -eq 0 ]; then
        create_agents >/dev/null
    fi

    ensure_deployment "${AGENT_IDS[0]}" 1
    ensure_deployment "${AGENT_IDS[1]}" 2
    ensure_deployment "${AGENT_IDS[2]}" 1
}

declare -a AGENT_IDS=()

case "${1:-}" in
    --agents)
        create_agents
        ;;
    --deployments)
        create_agents >/dev/null
        create_deployments
        ;;
    *)
        create_agents
        create_deployments
        ;;
esac
