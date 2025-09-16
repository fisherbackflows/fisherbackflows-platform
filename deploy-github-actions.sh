#!/bin/bash

# Deploy Fisher Backflows using GitHub Actions High-Memory Build
# This script pushes changes to trigger the GitHub Actions workflow

set -e

echo "🚀 Deploying Fisher Backflows via GitHub Actions..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo "📝 Uncommitted changes detected. Committing them first..."
    git add -A
    git commit -m "deploy: Update for GitHub Actions high-memory build

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
fi

# Push to trigger GitHub Actions
echo "📤 Pushing to GitHub to trigger high-memory build..."
git push origin main

echo "✅ Push complete! GitHub Actions will now:"
echo "   1. Build with 7GB memory allocation (NODE_OPTIONS='--max-old-space-size=7168')"
echo "   2. Deploy to Vercel production"
echo "   3. Provide build artifacts if needed"
echo ""
echo "🔗 Check progress at: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
echo ""
echo "⏰ Build typically takes 3-5 minutes with high memory allocation"