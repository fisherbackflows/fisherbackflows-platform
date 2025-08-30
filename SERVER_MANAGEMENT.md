# 🖥️ Fisher Backflows Platform - Server Management Guide

**For**: Cross-platform server management (Mobile/Desktop/Any Unix system)  
**Status**: ✅ Server currently running and healthy  
**Last Updated**: August 30, 2025

---

## 🚀 **CURRENT SERVER STATUS**

✅ **Development server is RUNNING**  
✅ **URL**: http://localhost:3010  
✅ **Process**: Background npm run dev  
✅ **Health**: All systems operational

---

## ⚡ **QUICK COMMANDS**

### Start Server (Any Platform):
```bash
# One command to rule them all
./scripts/quick-start.sh
```

### Manual Start:
```bash
npm run dev
```

### Stop Server:
```bash
# Kill by process name
pkill -f "next dev"

# Or kill by port
lsof -ti:3010 | xargs kill -9
```

### Check Status:
```bash
# Check if running
lsof -i :3010

# Test health
curl http://localhost:3010/api/health
```

---

## 🔄 **SERVER LIFECYCLE MANAGEMENT**

### Daily Startup Routine:
```bash
# Navigate to project (adjust path for your platform)
cd fisherbackflows-platform

# Quick start (handles everything automatically)
./scripts/quick-start.sh
```

### Graceful Shutdown:
```bash
# Stop server cleanly
pkill -f "next dev"

# Verify it's stopped
lsof -i :3010
```

### Restart Server:
```bash
# Stop existing server
pkill -f "next dev"

# Wait a moment
sleep 2

# Start fresh
npm run dev
```

---

## 📱 **PLATFORM-SPECIFIC MANAGEMENT**

### On Termux (Android):
```bash
# Start server in background
npm run dev &

# Check background jobs
jobs

# Bring to foreground if needed
fg %1

# Server survives app switching on Android
```

### On Ubuntu Desktop:
```bash
# Start in new terminal window
gnome-terminal -- npm run dev

# Or start in background
nohup npm run dev > server.log 2>&1 &

# Monitor logs
tail -f server.log
```

### On WSL (Windows):
```bash
# Start server
npm run dev

# Access from Windows browser: http://localhost:3010
# Works across WSL/Windows boundary
```

---

## 🔧 **TROUBLESHOOTING**

### Server Won't Start:

**Issue**: "Port 3010 already in use"
```bash
# Find and kill process using port
lsof -ti:3010 | xargs kill -9
npm run dev
```

**Issue**: "next: command not found"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Issue**: "Cannot find module"
```bash
# Clean install
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run dev
```

### Server Runs But Pages Don't Load:

**Issue**: Connection refused
```bash
# Check if server is actually running
curl -I http://localhost:3010

# Check server logs for errors
# Look at terminal where npm run dev is running
```

**Issue**: 500 Internal Server Error
```bash
# Check database connection
node test-with-auth.js

# Verify .env.local has real credentials
grep SUPABASE_URL .env.local
```

### Performance Issues:

**Issue**: Slow compilation
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

**Issue**: High memory usage
```bash
# Restart server to clear memory
pkill -f "next dev"
npm run dev
```

---

## 📊 **MONITORING**

### Health Checks:
```bash
# API health endpoint
curl -s http://localhost:3010/api/health | jq .

# Database connection test
node test-with-auth.js

# Full system test
./scripts/test-api.sh
```

### Performance Monitoring:
```bash
# Check memory usage
ps aux | grep "next dev"

# Check port usage
ss -tulnp | grep :3010

# Monitor requests (watch server terminal)
```

### Log Files:
```bash
# Error logs (if configured)
tail -f logs/errors.log

# Server output (in terminal where started)
# Watch the terminal where you ran npm run dev
```

---

## 🚨 **EMERGENCY PROCEDURES**

### Complete Reset:
```bash
# Nuclear option - reset everything
pkill -f "next dev"
rm -rf node_modules package-lock.json .next
npm install
npm run dev
```

### Database Connection Issues:
```bash
# Test database connection
node test-with-auth.js

# If fails, check .env.local credentials
cat .env.local | grep SUPABASE

# Verify Supabase project is active at:
# https://app.supabase.com
```

### Port Conflicts:
```bash
# Use different port if 3010 is blocked
npm run dev -- -p 3011

# Or kill whatever is using 3010
lsof -ti:3010 | xargs kill -9
```

---

## 📅 **MAINTENANCE SCHEDULE**

### Daily:
- ✅ Server auto-starts with quick-start.sh
- ✅ Health check via API endpoint
- ✅ Monitor for any errors

### Weekly:
- Update dependencies: `npm update`
- Clear cache: `rm -rf .next`
- Test full system: `./scripts/test-api.sh`

### Monthly:
- Check for Next.js updates: `npm outdated`
- Review and clean log files
- Performance review

---

## 🎯 **FOR CLAUDE CODE SESSIONS**

### Server Status Info:
```markdown
Server Status: ✅ RUNNING on port 3010
Quick Start: ./scripts/quick-start.sh
Health Check: curl http://localhost:3010/api/health
Stop Command: pkill -f "next dev"
```

### Common Operations:
- **Start**: `./scripts/quick-start.sh` (handles everything)
- **Stop**: `pkill -f "next dev"`
- **Test**: `./scripts/test-api.sh`
- **Health**: `curl http://localhost:3010/api/health`

---

## 📦 **DEPLOYMENT PREPARATION**

### Before Production:
```bash
# Test production build locally
npm run build
npm start

# Run full test suite
./scripts/test-api.sh

# Verify all systems
node test-with-auth.js
```

### Production Considerations:
- Server runs on port 3010 by default
- Uses .env.local for development
- Database already configured for production (Supabase)
- Ready for Vercel deployment

---

## ✅ **SUMMARY**

**Your server management is simplified:**

- 🚀 **One Command Start**: `./scripts/quick-start.sh`
- 🔄 **Cross-Platform**: Works on mobile, desktop, any Unix
- 🎯 **Smart Detection**: Handles dependencies, port conflicts, etc.
- 📊 **Health Monitoring**: Built-in status checks
- 🚨 **Error Recovery**: Automatic troubleshooting

**Current Status**: Server running smoothly, ready for development! 🎉