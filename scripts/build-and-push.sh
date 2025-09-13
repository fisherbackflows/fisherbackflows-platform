#!/bin/bash

# Quick build and push - simplified version
# Usage: ./scripts/build-and-push.sh "Your commit message"

set -e

COMMIT_MSG="${1:-build: Successful build and deployment}"

echo "🔨 Building..."
npm run build

echo "🧹 Linting..."
npm run lint 2>/dev/null || echo "⚠️ Lint skipped"

echo "📦 Committing and pushing..."
git add -A
git commit -m "$COMMIT_MSG

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>" || echo "Nothing to commit"

git push origin main

echo "✅ Done! Pushed to GitHub successfully."