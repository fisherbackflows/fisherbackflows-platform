#!/bin/bash

# Fisher Backflows Platform - Development Environment Startup
# This script prepares everything needed for immediate development

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
ENV_FILE="$SCRIPT_DIR/.env.local"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}     Fisher Backflows Platform - Dev Environment      ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Function to check if command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1 failed${NC}"
        return 1
    fi
}

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# 1. Git Status Check
echo -e "${YELLOW}📊 Git Repository Status:${NC}"
cd "$SCRIPT_DIR"
BRANCH=$(git branch --show-current 2>/dev/null || echo "Not a git repo")
if [ "$BRANCH" != "Not a git repo" ]; then
    echo -e "   Branch: ${GREEN}$BRANCH${NC}"
    
    # Check for uncommitted changes
    CHANGES=$(git status --porcelain | wc -l)
    if [ $CHANGES -gt 0 ]; then
        echo -e "   ${YELLOW}⚠️  You have $CHANGES uncommitted changes${NC}"
        git status --short
    else
        echo -e "   ${GREEN}✅ Working directory clean${NC}"
    fi
    
    # Check if up to date with remote
    git fetch origin >/dev/null 2>&1
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "no-remote")
    if [ "$REMOTE" != "no-remote" ]; then
        if [ "$LOCAL" = "$REMOTE" ]; then
            echo -e "   ${GREEN}✅ Up to date with origin/$BRANCH${NC}"
        else
            echo -e "   ${YELLOW}⚠️  Branch differs from origin/$BRANCH${NC}"
        fi
    fi
else
    echo -e "   ${RED}Not a git repository${NC}"
fi
echo ""

# 2. Environment Variables Check
echo -e "${YELLOW}🔐 Environment Configuration:${NC}"
if [ -f "$ENV_FILE" ]; then
    # Check for required variables
    REQUIRED_VARS=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    
    MISSING_VARS=()
    for var in "${REQUIRED_VARS[@]}"; do
        if ! grep -q "^$var=" "$ENV_FILE"; then
            MISSING_VARS+=($var)
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -eq 0 ]; then
        echo -e "   ${GREEN}✅ All required environment variables present${NC}"
    else
        echo -e "   ${RED}❌ Missing variables: ${MISSING_VARS[*]}${NC}"
    fi
else
    echo -e "   ${RED}❌ .env.local file not found!${NC}"
fi
echo ""

# 3. Node & Dependencies Check
echo -e "${YELLOW}📦 Dependencies Status:${NC}"
NODE_VERSION=$(node --version 2>/dev/null || echo "Not installed")
NPM_VERSION=$(npm --version 2>/dev/null || echo "Not installed")
echo -e "   Node: ${GREEN}$NODE_VERSION${NC}"
echo -e "   NPM: ${GREEN}$NPM_VERSION${NC}"

# Check if node_modules exists
if [ -d "$SCRIPT_DIR/node_modules" ]; then
    # Check if package.json is newer than node_modules
    if [ "$SCRIPT_DIR/package.json" -nt "$SCRIPT_DIR/node_modules" ]; then
        echo -e "   ${YELLOW}⚠️  package.json updated - run 'npm install'${NC}"
    else
        echo -e "   ${GREEN}✅ Dependencies installed${NC}"
    fi
else
    echo -e "   ${RED}❌ node_modules not found - run 'npm install'${NC}"
fi
echo ""

# 4. Database Connection Test
echo -e "${YELLOW}🗄️  Database Connection:${NC}"
if [ -f "$ENV_FILE" ]; then
    # Quick test using node to check Supabase connection
    node -e "
    require('dotenv').config({ path: '.env.local' });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (url) {
        console.log('   ✅ Supabase URL configured: ' + url.substring(0, 30) + '...');
    } else {
        console.log('   ❌ Supabase URL not configured');
    }
    " 2>/dev/null || echo -e "   ${YELLOW}⚠️  Unable to verify database config${NC}"
else
    echo -e "   ${RED}❌ Environment not configured${NC}"
fi
echo ""

# 5. Port Availability Check
echo -e "${YELLOW}🌐 Port Status:${NC}"
DEV_PORT=3010
if check_port $DEV_PORT; then
    PID=$(lsof -ti:$DEV_PORT)
    echo -e "   ${GREEN}✅ Dev server running on port $DEV_PORT (PID: $PID)${NC}"
else
    echo -e "   ${YELLOW}⚠️  Port $DEV_PORT is available${NC}"
    echo -e "   Run '${GREEN}npm run dev${NC}' to start the development server"
fi

# Check other common ports
PORTS=(3000 5432 8080)
for port in "${PORTS[@]}"; do
    if check_port $port; then
        echo -e "   ${YELLOW}ℹ️  Port $port is in use${NC}"
    fi
done
echo ""

# 6. Log Directory Setup
echo -e "${YELLOW}📝 Logging Setup:${NC}"
if [ ! -d "$LOG_DIR" ]; then
    mkdir -p "$LOG_DIR"
    echo -e "   ${GREEN}✅ Created logs directory${NC}"
else
    # Count log files
    LOG_COUNT=$(ls -1 "$LOG_DIR"/*.log 2>/dev/null | wc -l)
    if [ $LOG_COUNT -gt 0 ]; then
        echo -e "   ${GREEN}✅ Logs directory exists ($LOG_COUNT log files)${NC}"
        
        # Check for recent errors
        if [ -f "$LOG_DIR/error.log" ]; then
            RECENT_ERRORS=$(tail -n 10 "$LOG_DIR/error.log" | grep -c "ERROR" || echo 0)
            if [ $RECENT_ERRORS -gt 0 ]; then
                echo -e "   ${YELLOW}⚠️  Found $RECENT_ERRORS recent errors in logs${NC}"
            fi
        fi
    else
        echo -e "   ${GREEN}✅ Logs directory ready${NC}"
    fi
fi
echo ""

# 7. Quick Actions Menu
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}🚀 Quick Actions:${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

# Determine what actions to suggest based on status
ACTIONS=()

if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    ACTIONS+=("npm install         - Install dependencies")
fi

if ! check_port $DEV_PORT; then
    ACTIONS+=("npm run dev         - Start development server")
else
    ACTIONS+=("npm run build       - Build for production")
fi

ACTIONS+=("npm run lint        - Run linter")
ACTIONS+=("npm run type-check  - Check TypeScript")
ACTIONS+=("./scripts/test-api.sh - Test API endpoints")

if [ $CHANGES -gt 0 ] 2>/dev/null; then
    ACTIONS+=("git status          - Review changes")
    ACTIONS+=("git add . && git commit -m 'message' - Commit changes")
fi

# Display actions
for action in "${ACTIONS[@]}"; do
    echo -e "  ${GREEN}►${NC} $action"
done

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

# 8. Auto-start dev server if not running
if ! check_port $DEV_PORT && [ -d "$SCRIPT_DIR/node_modules" ]; then
    echo ""
    echo -e "${YELLOW}🤖 Auto-starting development server...${NC}"
    
    # Start dev server in background
    nohup npm run dev > "$LOG_DIR/dev-server.log" 2>&1 &
    DEV_PID=$!
    
    # Wait for server to actually start (Next.js takes time)
    echo -e "   Starting server (this may take 10-15 seconds)..."
    for i in {1..20}; do
        if check_port $DEV_PORT; then
            echo -e "${GREEN}✅ Dev server started successfully (PID: $DEV_PID)${NC}"
            echo -e "   Access at: ${BLUE}http://localhost:$DEV_PORT${NC}"
            echo -e "   Logs at: $LOG_DIR/dev-server.log"
            break
        fi
        sleep 1
    done
    
    if ! check_port $DEV_PORT; then
        echo -e "${YELLOW}⚠️  Server still starting - check in a few seconds${NC}"
        echo -e "   Logs at: $LOG_DIR/dev-server.log"
    fi
fi

# 9. Display CLAUDE.md reminders if it exists
if [ -f "$SCRIPT_DIR/CLAUDE.md" ]; then
    echo ""
    echo -e "${YELLOW}📋 Project Notes:${NC}"
    # Extract key commands section
    grep -A 5 "Key Commands" "$SCRIPT_DIR/CLAUDE.md" 2>/dev/null | head -7 || true
fi

echo ""
echo -e "${GREEN}✨ Environment ready! Happy coding!${NC}"
echo ""

# Save startup status to file for other scripts
cat > "$SCRIPT_DIR/.startup-status" << EOF
BRANCH=$BRANCH
CHANGES=$CHANGES
DEV_SERVER_PORT=$DEV_PORT
DEV_SERVER_RUNNING=$(check_port $DEV_PORT && echo "true" || echo "false")
TIMESTAMP=$(date +%s)
EOF