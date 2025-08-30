# Claude Development Notes

## Developer Environment
**Important:** Developer frequently switches between:
- **Mobile**: Claude Code via Termux on Android
- **Desktop**: Claude Code on Ubuntu

### Cross-Platform Considerations
- File paths should use forward slashes (/)
- Line endings should be LF (Unix-style)
- Avoid platform-specific commands when possible
- Test commands work in both bash/zsh environments
- Be mindful of case sensitivity (Linux is case-sensitive)

## Current Development Status
- **Database**: Tables migration completed (verify with verify-tables.sql)
- **Dev Server**: Running on port 3010 (background process)
- **Authentication**: Working with `admin@fisherbackflows.com` / `admin`
- **Error Monitoring**: Logs set up in ./logs/ directory
- **API Testing**: Script available at scripts/test-api.sh

## Project Context
- Repository: Fisher Backflows Platform
- Tech Stack: Next.js 15, React 19, TypeScript, Supabase
- Development Port: 3010
- Total Pages: 84
- API Endpoints: 47

## Key Commands
```bash
# Development
npm run dev              # Start dev server on port 3010
npm run build           # Build for production
npm run lint            # Run ESLint
npm run type-check      # TypeScript checking

# Testing
./scripts/test-api.sh    # Test all API endpoints
node scripts/verify-database.js  # Verify database setup

# Git
git fetch origin        # Fetch latest changes
git pull --no-rebase origin main  # Pull with merge strategy
git stash push -m "message"       # Stash changes before pull

# Database
# Run verify-tables.sql in Supabase SQL Editor to check tables
```

## File Structure
```
logs/               # Error logs (auto-created)
scripts/           # Testing and utility scripts
  - test-api.sh    # API endpoint tester
  - error-monitor.js  # Error log setup
  - verify-database.js  # Database verification
```

## Notes
- Platform has 84 pages, all functional
- Authentication system is working
- Core infrastructure is solid
- Database tables ready for verification
- File permissions set to 755 for scripts/src/public

## Session Recovery
- **NEVER RECREATE SETUP** - Everything is saved and working
- **Quick Start**: Just run `./scripts/quick-start.sh`
- **Credentials**: Real Supabase keys already in .env.local
- **Database**: Live connection, all tables exist
- **Server**: Background process management automated

## Cross-Platform Compatibility
- Works on Termux (Android), Ubuntu (Desktop), WSL, macOS
- Same credentials work everywhere
- Universal commands in documentation
- Platform-specific troubleshooting included