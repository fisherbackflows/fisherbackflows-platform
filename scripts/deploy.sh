#!/bin/bash

# Fisher Backflows Platform v3 - Deployment Script
# This script ensures clean deployment to fisherbackflows.com via Vercel

set -e

echo "🚀 Starting Fisher Backflows Platform v3 deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "vercel.json" ]; then
    echo "❌ Error: Must be run from the project root directory"
    exit 1
fi

# Check if project is linked to correct Vercel project
if [ ! -f ".vercel/project.json" ]; then
    echo "❌ Error: Project not linked to Vercel. Run 'npm run deploy:link' first."
    exit 1
fi

# Verify correct project link
PROJECT_NAME=$(cat .vercel/project.json | grep -o '"projectName":"[^"]*"' | cut -d'"' -f4)
if [ "$PROJECT_NAME" != "fisherbackflows-platform-v2" ]; then
    echo "❌ Error: Project linked to wrong Vercel project: $PROJECT_NAME"
    echo "   Expected: fisherbackflows-platform-v2"
    echo "   Run 'npm run deploy:link' to fix this."
    exit 1
fi

echo "✅ Project correctly linked to fisherbackflows-platform-v2"

# Run pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Type checking
echo "   Checking TypeScript types..."
npm run type-check || {
    echo "❌ TypeScript type check failed"
    exit 1
}

# Linting
echo "   Running linting..."
npm run lint || {
    echo "❌ Linting failed"
    exit 1
}

# Build test (without deployment)
echo "   Testing production build..."
npm run build || {
    echo "❌ Production build failed"
    exit 1
}

echo "✅ All pre-deployment checks passed"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."

if [ "$1" = "--production" ] || [ "$1" = "-p" ]; then
    echo "   Deploying to PRODUCTION (fisherbackflows.com)..."
    npx vercel --prod
    echo "✅ Deployed to production: https://fisherbackflows.com"
else
    echo "   Deploying to PREVIEW..."
    npx vercel
    echo "✅ Deployed to preview environment"
    echo "   Use 'npm run deploy:production' for production deployment"
fi

echo "🎉 Deployment completed successfully!"