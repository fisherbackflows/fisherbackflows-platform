#!/bin/bash

# API Testing Script for Fisher Backflows
# Tests all endpoints to ensure they're working

BASE_URL="http://localhost:3010/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Fisher Backflows API Testing Suite"
echo "====================================="
echo ""

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -n "Testing $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo -e "${GREEN}✓ OK${NC} ($response)"
    elif [ "$response" = "401" ] || [ "$response" = "403" ]; then
        echo -e "${YELLOW}⚠ Auth Required${NC} ($response)"
    else
        echo -e "${RED}✗ Failed${NC} ($response)"
    fi
}

echo "📡 Testing Public Endpoints:"
echo "----------------------------"
test_endpoint "GET" "/health" "" "Health Check"
test_endpoint "GET" "/test" "" "Test Endpoint"

echo ""
echo "🔐 Testing Auth Endpoints:"
echo "-------------------------"
test_endpoint "POST" "/auth/login" '{"identifier":"demo","type":"demo"}' "Demo Login"
test_endpoint "POST" "/team/auth/login" '{"email":"admin@fisherbackflows.com","password":"admin"}' "Team Login"

echo ""
echo "📊 Testing Business Endpoints:"
echo "-----------------------------"
test_endpoint "GET" "/customers" "" "Customer List"
test_endpoint "GET" "/appointments" "" "Appointments"
test_endpoint "GET" "/invoices" "" "Invoices"
test_endpoint "GET" "/calendar/available-dates" "" "Available Dates"

echo ""
echo "✅ Testing Complete!"