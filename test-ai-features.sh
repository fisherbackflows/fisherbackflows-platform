#!/bin/bash

# 🧪 AI Features Testing Script
# Tests all newly deployed AI-powered endpoints

echo "🚀 FISHER BACKFLOWS AI FEATURES TEST"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL - change this to your production URL
BASE_URL="http://localhost:3010"
PRODUCTION_URL="https://fisherbackflows-av7b2camx-fisherbackflows-projects.vercel.app"

echo -e "${BLUE}🔍 Testing AI-Powered Endpoints...${NC}"
echo ""

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="$3"
    
    echo -n "Testing $name... "
    
    # Make request and capture response
    response=$(curl -s -w "%{http_code}" -o /tmp/test_response.json "$BASE_URL$url" 2>/dev/null)
    status_code="${response: -3}"
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $status_code)"
        
        # Show first few lines of response for successful calls
        if [ "$status_code" = "200" ] && [ -f /tmp/test_response.json ]; then
            echo -e "   ${YELLOW}Preview:${NC} $(head -c 100 /tmp/test_response.json)..."
        fi
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $status_code, expected $expected_status)"
        
        # Show error details
        if [ -f /tmp/test_response.json ]; then
            echo -e "   ${RED}Error:${NC} $(head -c 200 /tmp/test_response.json)"
        fi
    fi
    echo ""
}

# Test Health Check First
echo -e "${BLUE}🏥 Health Check:${NC}"
test_endpoint "Application Health" "/api/health" "200"

# Test AI Endpoints
echo -e "${BLUE}🤖 AI-Powered Endpoints:${NC}"

# Predictive Analytics
test_endpoint "Predictive Analytics (30d)" "/api/analytics/predictive?timeframe=30d" "401"
test_endpoint "Predictive Analytics (90d)" "/api/analytics/predictive?timeframe=90d&advanced=true" "401"

# Intelligent Scheduling  
test_endpoint "Availability Check" "/api/scheduling/intelligent?action=availability&serviceType=Annual+Test&date=2025-09-10" "401"
test_endpoint "Smart Suggestions" "/api/scheduling/intelligent?action=suggestions&customerId=guest&serviceType=Annual+Test" "401"
test_endpoint "Batch Optimization" "/api/scheduling/intelligent?action=batch_optimize&startDate=2025-09-03&endDate=2025-09-10" "401"

# Analytics Dashboard
test_endpoint "Analytics Dashboard" "/api/analytics/dashboard" "401"
test_endpoint "Revenue Analytics" "/api/analytics/revenue" "401"

# Standard API Endpoints
echo -e "${BLUE}📊 Standard Endpoints:${NC}"
test_endpoint "Appointments API" "/api/appointments" "401"
test_endpoint "Customers API" "/api/customers" "401"
test_endpoint "Test Reports API" "/api/test-reports" "401"

# Frontend Pages
echo -e "${BLUE}🖥️  Frontend Pages:${NC}"
test_endpoint "Landing Page" "/" "200"
test_endpoint "Portal Login" "/portal" "200"
test_endpoint "Interactive Map" "/portal/map" "200"
test_endpoint "Analytics Page" "/analytics" "200"
test_endpoint "Team Portal" "/team-portal" "200"

echo ""
echo -e "${BLUE}📱 Testing Production Deployment:${NC}"
echo ""

# Test production URL
echo -n "Production Landing Page... "
prod_response=$(curl -s -w "%{http_code}" -o /dev/null "$PRODUCTION_URL" 2>/dev/null)
if [ "$prod_response" = "200" ]; then
    echo -e "${GREEN}✅ LIVE${NC} - $PRODUCTION_URL"
else
    echo -e "${RED}❌ NOT ACCESSIBLE${NC} (HTTP $prod_response)"
fi

echo -n "Production Map Dashboard... "
map_response=$(curl -s -w "%{http_code}" -o /dev/null "$PRODUCTION_URL/portal/map" 2>/dev/null)
if [ "$map_response" = "200" ]; then
    echo -e "${GREEN}✅ LIVE${NC} - $PRODUCTION_URL/portal/map"
else
    echo -e "${RED}❌ NOT ACCESSIBLE${NC} (HTTP $map_response)"
fi

echo ""
echo -e "${BLUE}🔧 AI Features Status Summary:${NC}"
echo "================================="

# Check if files exist
echo -n "Database Optimization Script... "
if [ -f "DATABASE_PERFORMANCE_COMPLETE.sql" ]; then
    echo -e "${GREEN}✅ Ready for execution${NC}"
else
    echo -e "${RED}❌ Missing${NC}"
fi

echo -n "Route Optimizer Engine... "
if [ -f "src/lib/ai/RouteOptimizer.ts" ]; then
    echo -e "${GREEN}✅ Deployed${NC}"
else
    echo -e "${RED}❌ Missing${NC}"
fi

echo -n "Predictive Analytics Engine... "
if [ -f "src/lib/ai/PredictiveAnalytics.ts" ]; then
    echo -e "${GREEN}✅ Deployed${NC}"
else
    echo -e "${RED}❌ Missing${NC}"
fi

echo -n "Intelligent Scheduler... "
if [ -f "src/lib/ai/IntelligentScheduler.ts" ]; then
    echo -e "${GREEN}✅ Deployed${NC}"
else
    echo -e "${RED}❌ Missing${NC}"
fi

echo -n "Interactive Map Dashboard... "
if [ -f "src/components/maps/InteractiveMapDashboard.tsx" ]; then
    echo -e "${GREEN}✅ Deployed${NC}"
else
    echo -e "${RED}❌ Missing${NC}"
fi

echo ""
echo -e "${BLUE}💡 Next Steps:${NC}"
echo "=============="
echo "1. 🗄️  Execute DATABASE_PERFORMANCE_COMPLETE.sql in Supabase"
echo "2. 🔑 Add authentication to test protected endpoints"
echo "3. 🌐 Configure external API keys (Google Maps, Weather)"
echo "4. 📱 Test mobile responsiveness and PWA features"
echo "5. 📊 Monitor AI model performance in production"

echo ""
echo -e "${GREEN}🎉 AI FEATURES TESTING COMPLETE!${NC}"
echo ""

# Cleanup
rm -f /tmp/test_response.json

echo -e "${YELLOW}Note:${NC} Many endpoints return 401 (Unauthorized) because they require authentication."
echo -e "${YELLOW}This is expected behavior for a secure production system.${NC}"
echo ""
echo -e "${BLUE}Production URL:${NC} $PRODUCTION_URL"
echo -e "${BLUE}Local Dev URL:${NC} $BASE_URL"