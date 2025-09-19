#!/bin/bash

# Fisher Backflows Platform v3 - Deployment Status Script
# This script shows the current deployment status and configuration

set -e

echo "📊 Fisher Backflows Platform v3 - Deployment Status"
echo "=================================================="

# Check project linking
if [ -f ".vercel/project.json" ]; then
    PROJECT_NAME=$(cat .vercel/project.json | grep -o '"projectName":"[^"]*"' | cut -d'"' -f4)
    PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId":"[^"]*"' | cut -d'"' -f4)
    ORG_ID=$(cat .vercel/project.json | grep -o '"orgId":"[^"]*"' | cut -d'"' -f4)

    echo "🔗 Vercel Project Linking:"
    echo "   Project Name: $PROJECT_NAME"
    echo "   Project ID: $PROJECT_ID"
    echo "   Organization: $ORG_ID"

    if [ "$PROJECT_NAME" = "fisherbackflows-platform-v2" ]; then
        echo "   ✅ Correctly linked to fisherbackflows-platform-v2"
    else
        echo "   ❌ Linked to wrong project! Expected: fisherbackflows-platform-v2"
        echo "   🔧 Run 'npm run deploy:link' to fix this"
    fi
else
    echo "🔗 Vercel Project Linking:"
    echo "   ❌ Not linked to any Vercel project"
    echo "   🔧 Run 'npm run deploy:link' to link to the correct project"
fi

echo ""

# Check domain status
echo "🌐 Domain Configuration:"
echo "   Production Domain: fisherbackflows.com"
echo "   Expected Project: fisherbackflows-platform-v2"

# Show recent deployments
echo ""
echo "📋 Recent Deployments:"
npx vercel ls || echo "   No deployments found or not authenticated"

echo ""

# Check configuration files
echo "📄 Configuration Files:"
[ -f "vercel.json" ] && echo "   ✅ vercel.json exists" || echo "   ❌ vercel.json missing"
[ -f "package.json" ] && echo "   ✅ package.json exists" || echo "   ❌ package.json missing"
[ -f "next.config.mjs" ] && echo "   ✅ next.config.mjs exists" || echo "   ❌ next.config.mjs missing"
[ -f ".env.local" ] && echo "   ✅ .env.local exists" || echo "   ⚠️  .env.local missing (copy from .env.local.example)"

echo ""
echo "📝 Available Commands:"
echo "   npm run deploy:link       - Link to correct Vercel project"
echo "   npm run deploy:preview    - Deploy to preview environment"
echo "   npm run deploy:production - Deploy to production (fisherbackflows.com)"
echo "   npm run deploy:status     - Show this status information"