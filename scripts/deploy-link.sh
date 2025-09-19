#!/bin/bash

# Fisher Backflows Platform v3 - Vercel Project Linking Script
# This script ensures the project is linked to the correct Vercel project

set -e

echo "🔗 Linking to correct Vercel project..."

# Remove existing .vercel directory if it exists
if [ -d ".vercel" ]; then
    echo "   Removing existing Vercel configuration..."
    rm -rf .vercel
fi

# Link to the correct project
echo "   Linking to fisherbackflows-platform-v2..."
npx vercel link --project=fisherbackflows-platform-v2 --scope=fisherbackflows-projects --yes

# Verify the link
if [ -f ".vercel/project.json" ]; then
    PROJECT_NAME=$(cat .vercel/project.json | grep -o '"projectName":"[^"]*"' | cut -d'"' -f4)
    if [ "$PROJECT_NAME" = "fisherbackflows-platform-v2" ]; then
        echo "✅ Successfully linked to fisherbackflows-platform-v2"
        echo "   Project ID: $(cat .vercel/project.json | grep -o '"projectId":"[^"]*"' | cut -d'"' -f4)"
        echo "   Ready for deployment to fisherbackflows.com"
    else
        echo "❌ Error: Linked to wrong project: $PROJECT_NAME"
        exit 1
    fi
else
    echo "❌ Error: Failed to create project link"
    exit 1
fi