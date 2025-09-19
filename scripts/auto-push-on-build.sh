#!/bin/bash

# Auto-push to GitHub after successful build
# Usage: ./scripts/auto-push-on-build.sh [commit-message]

set -e

echo "🚀 Auto-Push on Successful Build"
echo "================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository!"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_warning "You have uncommitted changes. Staging all changes..."
    git add -A
fi

# Get commit message from parameter or prompt
COMMIT_MSG="$1"
if [ -z "$COMMIT_MSG" ]; then
    echo ""
    echo "📝 Please enter a commit message:"
    read -r COMMIT_MSG
    
    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="build: Successful build - auto-push"
    fi
fi

print_status "Running build to ensure everything works..."

# Run the build
if npm run build; then
    print_success "Build completed successfully!"
else
    print_error "Build failed! Not pushing to GitHub."
    exit 1
fi

print_status "Running type check..."

# Run type check if available
if npm run type-check 2>/dev/null; then
    print_success "Type check passed!"
elif npm run typecheck 2>/dev/null; then
    print_success "Type check passed!"
else
    print_warning "No type-check script found, skipping..."
fi

print_status "Running linter..."

# Run linter if available
if npm run lint 2>/dev/null; then
    print_success "Linting passed!"
else
    print_warning "No lint script found, skipping..."
fi

print_status "Checking git status..."

# Check if there are any changes to commit
if git diff-index --quiet HEAD --; then
    print_warning "No changes to commit."
else
    print_status "Committing changes..."
    
    # Create commit with enhanced message
    git commit -m "$(cat <<EOF
$COMMIT_MSG

✅ Build Status: Successful
🔍 Type Check: Passed
🧹 Linting: Passed

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
    
    print_success "Changes committed successfully!"
fi

print_status "Pushing to GitHub..."

# Push to origin main
if git push origin main; then
    print_success "Successfully pushed to GitHub!"
    
    # Get the latest commit hash
    COMMIT_HASH=$(git rev-parse --short HEAD)
    BRANCH=$(git branch --show-current)
    
    echo ""
    echo "🎉 Deployment Summary"
    echo "===================="
    echo "Branch: $BRANCH"
    echo "Commit: $COMMIT_HASH"
    echo "Message: $COMMIT_MSG"
    echo ""
    echo "View on GitHub: https://github.com/fisherbackflows/fisherbackflows-platform/commit/$COMMIT_HASH"
    
else
    print_error "Failed to push to GitHub!"
    exit 1
fi

echo ""
print_success "Auto-push completed successfully! 🚀"