#!/bin/bash

# Workspace Preparation Script
# Ensures all tools and services are ready for development

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🛠️  Workspace Preparation Starting...${NC}"
echo "══════════════════════════════════════"
echo ""

# 1. Clean up old processes
echo -e "${YELLOW}🧹 Cleaning up old processes...${NC}"
pkill -f "next dev" 2>/dev/null && echo "   Killed old Next.js processes" || echo "   No old processes found"
pkill -f "mcp-server" 2>/dev/null && echo "   Killed old MCP server" || echo "   No MCP server running"

# 2. Clear old logs
echo -e "${YELLOW}📝 Managing logs...${NC}"
if [ -d "logs" ]; then
    # Archive old logs if they're large
    for log in logs/*.log; do
        if [ -f "$log" ] && [ $(stat -f%z "$log" 2>/dev/null || stat -c%s "$log" 2>/dev/null) -gt 1048576 ]; then
            mv "$log" "$log.old" 2>/dev/null
            echo "   Archived large log: $(basename $log)"
        fi
    done
else
    mkdir -p logs
    echo "   Created logs directory"
fi

# 3. Clean node_modules if needed
if [ -d "node_modules" ]; then
    # Check if package-lock is newer than node_modules
    if [ "package-lock.json" -nt "node_modules" ]; then
        echo -e "${YELLOW}📦 Package lock updated, refreshing dependencies...${NC}"
        rm -rf node_modules
        npm install
    fi
fi

# 4. Clear Next.js cache
echo -e "${YELLOW}🗑️  Clearing build caches...${NC}"
rm -rf .next 2>/dev/null && echo "   Cleared .next cache" || echo "   No .next cache found"
rm -rf .turbo 2>/dev/null && echo "   Cleared .turbo cache" || echo "   No .turbo cache found"

# 5. Set up VS Code workspace settings
if [ ! -f ".vscode/settings.json" ]; then
    echo -e "${YELLOW}⚙️  Creating VS Code settings...${NC}"
    mkdir -p .vscode
    cat > .vscode/settings.json << 'EOF'
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.exclude": {
    "node_modules": true,
    ".next": true,
    ".turbo": true
  },
  "search.exclude": {
    "node_modules": true,
    ".next": true,
    "*.log": true
  }
}
EOF
    echo "   Created VS Code settings"
fi

# 6. Create helpful aliases
echo -e "${YELLOW}🚀 Creating development aliases...${NC}"
cat > .dev-aliases << 'EOF'
# Fisher Backflows Development Aliases
alias dev="npm run dev"
alias build="npm run build"
alias lint="npm run lint"
alias test="./scripts/test-api.sh"
alias logs="tail -f logs/*.log"
alias clean="rm -rf .next node_modules && npm install"
alias status="./startup.sh"
alias quick="./scripts/quick-start.sh"
EOF
echo "   Created .dev-aliases (source it with: source .dev-aliases)"

# 7. Git hooks setup
if [ -d ".git" ]; then
    echo -e "${YELLOW}🔗 Setting up Git hooks...${NC}"
    mkdir -p .git/hooks
    
    # Pre-commit hook for linting
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "Running pre-commit checks..."
npm run lint
EOF
    chmod +x .git/hooks/pre-commit
    echo "   Created pre-commit hook for linting"
fi

# 8. Database readiness check
echo -e "${YELLOW}🗄️  Checking database readiness...${NC}"
node -e "
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (url && key && !url.includes('your-')) {
    console.log('   ✅ Database configured correctly');
} else {
    console.log('   ❌ Database configuration missing or invalid');
}
" || echo "   ⚠️  Could not verify database config"

# 9. Create session restore script
cat > restore-session.sh << 'EOF'
#!/bin/bash
# Quick session restore after disconnect
echo "🔄 Restoring development session..."

# Check if dev server is running
if ! lsof -ti:3010 >/dev/null 2>&1; then
    echo "Starting dev server..."
    npm run dev &
    sleep 5
fi

echo "✅ Session restored!"
echo "Dev server: http://localhost:3010"
EOF
chmod +x restore-session.sh

echo ""
echo -e "${GREEN}✅ Workspace preparation complete!${NC}"
echo ""
echo -e "${BLUE}Quick Commands:${NC}"
echo "  ./scripts/quick-start.sh  - Start everything"
echo "  ./startup.sh              - Check status"
echo "  source .dev-aliases       - Load shortcuts"
echo "  ./restore-session.sh      - Restore after disconnect"
echo ""