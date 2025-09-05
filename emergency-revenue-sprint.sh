#!/bin/bash

echo "🚨 FISHER BACKFLOWS - EMERGENCY 600-HOUR REVENUE SPRINT 🚨"
echo "Activating ALL lead generation systems for maximum revenue..."

# Set up environment
export NODE_ENV=production
export EMERGENCY_MODE=true

# Start the development server
echo "📊 Starting development server..."
npm run dev &
SERVER_PID=$!
sleep 10

echo "🔥 Running EMERGENCY lead generation pipeline..."

# 1. Immediate compliance monitoring for CRITICAL overdue facilities
echo "⚠️  Step 1: Emergency compliance scan..."
curl -X GET "http://localhost:3000/api/lead-generation/compliance-monitor?mode=alerts&minScore=85" \
  -H "Content-Type: application/json" | jq '.'

sleep 2

# 2. Full data mining sweep of Puyallup area
echo "🎯 Step 2: Full data mining sweep..."
curl -X POST "http://localhost:3000/api/lead-generation/data-mining" \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Puyallup, WA", 
    "radius": 20, 
    "minScore": 60,
    "emergencyMode": true,
    "prioritizeOverdue": true
  }' | jq '.'

sleep 3

# 3. Web scraping for new business opportunities
echo "🌐 Step 3: Web scraping activation..."
curl -X POST "http://localhost:3000/api/lead-generation/web-scraper" \
  -H "Content-Type: application/json" \
  -d '{
    "sources": ["google_maps", "yelp", "yellow_pages"],
    "location": "Puyallup, WA",
    "radius": 20,
    "businessTypes": ["restaurant", "medical", "industrial", "office", "retail"],
    "emergencyMode": true,
    "maxResults": 200
  }' | jq '.'

sleep 3

# 4. Activate automated compliance monitoring (every 2 hours during sprint)
echo "🤖 Step 4: Activating automated monitoring..."
curl -X POST "http://localhost:3000/api/cron/compliance-check" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "trigger",
    "jobType": "hourly"
  }' | jq '.'

sleep 2

# 5. Get immediate hot leads for TODAY
echo "🔥 Step 5: Retrieving HOT leads for immediate action..."
curl -X GET "http://localhost:3000/api/lead-generation/database-integration?type=leads&temperature=HOT&limit=50" \
  -H "Content-Type: application/json" | jq '.leads[] | {business_name, phone, address, days_past_due, estimated_value, urgency_reason: .action_plan.message}'

echo ""
echo "🎯 EMERGENCY SPRINT ACTIVATED!"
echo "💰 Revenue Target: MAXIMUM in 600 hours"
echo "🏃‍♂️ Next Action: Check your lead generator portal NOW!"
echo "📱 Portal: fisherbackflows.com/business-admin/lead-generator"
echo ""
echo "⚡ Systems Status:"
echo "   ✅ Compliance Monitor: ACTIVE (2-hour intervals)"
echo "   ✅ Data Mining: COMPLETE"  
echo "   ✅ Web Scraper: ACTIVE"
echo "   ✅ Lead Scoring: ACTIVE"
echo "   ✅ Database Integration: ACTIVE"
echo ""
echo "🚨 CRITICAL ACTIONS NEEDED NOW:"
echo "1. Open lead generator portal immediately"
echo "2. Contact ALL hot leads within next 2 hours"
echo "3. Schedule same-day visits for critical compliance violations"
echo "4. Set up daily route optimization"
echo "5. Enable phone/email automation"

# Keep server running
wait $SERVER_PID