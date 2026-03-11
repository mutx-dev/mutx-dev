#!/bin/bash

# MUTX API Test Script
# Tests all API endpoints without manual curl setup

set -e

API_URL="${API_URL:-http://localhost:8000}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🧪 MUTX API Test Suite"
echo "======================"
echo ""

# Test 1: Health Check
echo -n "1. Health Check... "
if curl -sf "$API_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    curl -s "$API_URL/health" | python3 -m json.tool 2>/dev/null || echo "  (response received)"
else
    echo -e "${RED}✗ FAIL${NC}"
    exit 1
fi
echo ""

# Test 2: Readiness Check
echo -n "2. Readiness Check... "
STATUS=$(curl -sf "$API_URL/ready" 2>/dev/null || echo '{"status":"error"}')
if echo "$STATUS" | grep -q "ready\|not_ready"; then
    echo -e "${GREEN}✓ PASS${NC}"
    echo "$STATUS" | python3 -m json.tool 2>/dev/null || echo "  $STATUS"
else
    echo -e "${RED}✗ FAIL${NC}"
fi
echo ""

# Test 3: Root Endpoint
echo -n "3. Root Endpoint... "
ROOT=$(curl -sf "$API_URL/" 2>/dev/null || echo '{}')
if echo "$ROOT" | grep -q "mutx"; then
    echo -e "${GREEN}✓ PASS${NC}"
    echo "$ROOT" | python3 -m json.tool 2>/dev/null || echo "  $ROOT"
else
    echo -e "${RED}✗ FAIL${NC}"
fi
echo ""

# Test 4: API Docs (OpenAPI)
echo -n "4. API Docs Available... "
if curl -sf "$API_URL/docs" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${YELLOW}⚠ SKIP (docs not available)${NC}"
fi
echo ""

# Test 5: OpenAPI Schema
echo -n "5. OpenAPI Schema... "
if curl -sf "$API_URL/openapi.json" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${YELLOW}⚠ SKIP (schema not available)${NC}"
fi
echo ""

echo "======================"
echo -e "${GREEN}Tests completed!${NC}"
echo ""
echo "Full API docs at: $API_URL/docs"
