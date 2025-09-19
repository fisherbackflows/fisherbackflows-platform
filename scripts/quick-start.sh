#!/bin/bash

# Fisher Backflows Platform - Cross-Platform Quick Start
# Works on: Ubuntu, Termux (Android), WSL, macOS, any Unix-like system

echo "🚀 Fisher Backflows Platform - Quick Start"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo "Please run this script from the fisherbackflows-platform directory"
    exit 1
fi

echo -e "${BLUE}📁 Current directory: $(pwd)${NC}"
echo ""

# Check if .env.local exists with real credentials
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ Error: .env.local not found${NC}"
    echo "Your Supabase credentials are missing!"
    exit 1
fi

# Check if credentials are configured
if grep -q "your-supabase-url-here" .env.local; then
    echo -e "${RED}❌ Error: .env.local has placeholder values${NC}"
    echo "Please configure your real Supabase credentials first"
    exit 1
fi

echo -e "${GREEN}✅ Environment configuration found${NC}"

# Check if Node.js is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Error: npm not found${NC}"
    echo ""
    echo "Install Node.js:"
    echo "  Ubuntu/Debian: sudo apt install nodejs npm"
    echo "  Termux:        pkg install nodejs npm"
    echo "  macOS:         brew install node npm"
    exit 1
fi

echo -e "${GREEN}✅ Node.js/npm found: $(npm --version)${NC}"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Check if server is already running
if lsof -Pi :3010 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Server already running on port 3010${NC}"
    echo "Killing existing server..."
    pkill -f "next dev" 2>/dev/null || true
    sleep 2
fi

echo ""
echo -e "${BLUE}🚀 Starting Fisher Backflows Platform...${NC}"
echo ""

# Start the development server
npm run dev &
SERVER_PID=$!

# Wait for server to start
echo -e "${YELLOW}⏳ Waiting for server to start...${NC}"
sleep 10

# Test if server is responding
if curl -s -o /dev/null -w "" http://localhost:3010 --connect-timeout 5; then
    echo ""
    echo -e "${GREEN}🎉 SUCCESS! Server is running!${NC}"
    echo ""
    echo -e "${BLUE}📱 Access Your Platform:${NC}"
    echo "  🌐 Main Website:    http://localhost:3010"
    echo "  👥 Customer Portal: http://localhost:3010/portal"
    echo "  🔧 Team Portal:     http://localhost:3010/team-portal"
    echo "  ⚙️  Admin Dashboard: http://localhost:3010/admin"
    echo ""
    echo -e "${BLUE}🔐 Login Credentials:${NC}"
    echo "  Email:    admin@fisherbackflows.com"
    echo "  Password: admin"
    echo ""
    echo -e "${BLUE}🧪 Quick Tests:${NC}"
    echo "  API Health: curl http://localhost:3010/api/health"
    echo "  Full Test:  ./scripts/test-api.sh"
    echo ""
    echo -e "${YELLOW}⚡ Platform is ready for development!${NC}"
    echo ""
    echo -e "${BLUE}💡 Tips:${NC}"
    echo "  - Server runs in background"
    echo "  - Use 'pkill -f \"next dev\"' to stop"
    echo "  - Check logs: 'tail -f logs/errors.log'"
    echo "  - Hot reload enabled - edit files and see changes instantly"
    
    # Attempt to open in browser (platform dependent)
    if command -v termux-open-url &> /dev/null; then
        echo ""
        echo "🔗 Opening in browser..."
        termux-open-url http://localhost:3010
    elif command -v xdg-open &> /dev/null; then
        echo ""
        echo "🔗 Opening in browser..."
        xdg-open http://localhost:3010
    elif command -v open &> /dev/null; then
        echo ""
        echo "🔗 Opening in browser..."
        open http://localhost:3010
    fi
    
else
    echo ""
    echo -e "${RED}❌ Server failed to start or is not responding${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check if port 3010 is available: lsof -i :3010"
    echo "2. Check server logs above for errors"
    echo "3. Try: rm -rf node_modules && npm install"
    echo "4. Manual start: npm run dev"
    
    # Kill the background process if it's still running
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi