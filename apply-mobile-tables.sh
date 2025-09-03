#!/bin/bash

# Apply Mobile SQL Tables to Supabase
# This script applies all the SQL tables from yesterday's mobile work

echo "📱 Applying Mobile SQL Tables to Supabase..."
echo "============================================"

# Supabase connection details
SUPABASE_URL="https://jvhbqfueutvfepsjmztx.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY"

# Function to execute SQL file via Supabase API
execute_sql() {
    local sql_file=$1
    local description=$2
    
    echo ""
    echo "🔄 $description..."
    echo "   File: $sql_file"
    
    if [ ! -f "$sql_file" ]; then
        echo "❌ File not found: $sql_file"
        return 1
    fi
    
    # Read SQL content
    SQL_CONTENT=$(cat "$sql_file")
    
    # Execute via Supabase REST API
    RESPONSE=$(curl -s -X POST \
        "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"query\": $(echo "$SQL_CONTENT" | jq -Rs .)}")
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully applied: $description"
        return 0
    else
        echo "❌ Failed to apply: $description"
        echo "   Response: $RESPONSE"
        return 1
    fi
}

# Track success
TOTAL_SUCCESS=0
TOTAL_FAILED=0

# Apply each SQL file
echo ""
echo "📊 Starting database updates..."

# 1. Mobile Location Tracking
if execute_sql "MOBILE_LOCATION_TRACKING_SCHEMA.sql" "Mobile Location Tracking Tables"; then
    ((TOTAL_SUCCESS++))
else
    ((TOTAL_FAILED++))
fi

# 2. PWA Push Notifications
if execute_sql "PWA_DATABASE_TABLES.sql" "PWA Push Notification Tables"; then
    ((TOTAL_SUCCESS++))
else
    ((TOTAL_FAILED++))
fi

# 3. Database Performance Optimizations
if execute_sql "DATABASE_PERFORMANCE_COMPLETE.sql" "Database Performance Optimizations"; then
    ((TOTAL_SUCCESS++))
else
    ((TOTAL_FAILED++))
fi

# 4. Critical Performance Optimizations
if execute_sql "PERFORMANCE_OPTIMIZATION_CRITICAL.sql" "Critical Performance Optimizations"; then
    ((TOTAL_SUCCESS++))
else
    ((TOTAL_FAILED++))
fi

# 5. Security Policies
if execute_sql "EXECUTE_SECURITY_POLICIES.sql" "Security Policies"; then
    ((TOTAL_SUCCESS++))
else
    ((TOTAL_FAILED++))
fi

# Summary
echo ""
echo "============================================"
echo "📊 SUMMARY:"
echo "   ✅ Successfully Applied: $TOTAL_SUCCESS"
echo "   ❌ Failed: $TOTAL_FAILED"
echo ""

if [ $TOTAL_FAILED -eq 0 ]; then
    echo "🎉 All mobile SQL tables have been successfully applied!"
    echo ""
    echo "📱 New Features Enabled:"
    echo "   • Real-time technician GPS tracking"
    echo "   • Customer appointment tracking"
    echo "   • Push notifications for PWA"
    echo "   • Mobile-first optimizations"
    echo "   • Offline sync capabilities"
else
    echo "⚠️ Some tables failed to apply. Please check the Supabase SQL editor manually."
    echo ""
    echo "Manual Instructions:"
    echo "1. Go to: https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx/sql"
    echo "2. Copy and paste each SQL file content"
    echo "3. Execute them one by one"
fi

echo ""
echo "🔗 Supabase Dashboard: https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx"
echo ""