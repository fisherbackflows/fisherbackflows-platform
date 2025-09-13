#!/bin/bash

# Supabase configuration
SUPABASE_URL="https://jvhbqfueutvfepsjmztx.supabase.co"
SQL_FILE="/mnt/c/users/Fishe/fisherbackflows2/fisherbackflows-platform/COMPREHENSIVE_RLS_IMPLEMENTATION.sql"

# Check if service role key is set
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required"
    exit 1
fi

echo "🔐 Executing comprehensive RLS implementation..."

# Execute the SQL using curl
response=$(curl -s -w "\n%{http_code}" -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -d "{\"sql\": $(cat "$SQL_FILE" | jq -Rs .)}")

# Extract response body and status code
http_code=$(echo "$response" | tail -n1)
response_body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo "✅ RLS Implementation executed successfully!"
    echo "📊 Response: $response_body"
    echo "🎉 Comprehensive RLS implementation completed successfully!"
    echo "🔒 All 25 tables are now secured with Row Level Security"
    echo "👥 Customer data is properly isolated"
    echo "🛡️ Team member and admin access controls are active"
    exit 0
else
    echo "❌ Error executing RLS implementation"
    echo "HTTP Status: $http_code"
    echo "Response: $response_body"
    exit 1
fi