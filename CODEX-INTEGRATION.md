# Codex Integration with Claude Code

## Overview
This document outlines the integration between Claude Code (builder) and GitHub Copilot Workspace (Codex) for collaborative development on the Fisher Backflows platform.

## Workflow Integration

### 1. Claude (Builder) Role
- **Primary Function**: Feature development and implementation
- **Branch Strategy**: Creates feat/* branches
- **Responsibilities**:
  - Scaffold new features and components
  - Implement business logic and API endpoints
  - Create initial test structures
  - Open PRs with clear descriptions

### 2. Codex (Checker) Role
- **Primary Function**: Code review and testing enhancement
- **Branch Strategy**: Creates chore/* branches for test improvements
- **Responsibilities**:
  - Review PRs for code quality and standards
  - Add comprehensive E2E tests with Playwright
  - Ensure CI/CD pipeline compliance
  - Verify security and performance standards

## Git Synchronization Protocol

### Manual Sync (Recommended)
```bash
# Sync before starting work
git fetch --all --prune
git switch main
git pull --ff-only

# Update feature branch
git switch feat/your-feature
git rebase origin/main  # or git merge origin/main
```

### Codex Sync Request
In the Codex window:
```
Fetch from origin with --prune, show me what changed,
and don't merge or rebase without asking.
```

## Current MCP Configuration

### MCP Server Tools Available:
- `list_project_files` - List filtered project files
- `read_project_file` - Read file contents by path
- `get_project_status` - Basic repo status summary
- `get_api_endpoints` - Discover Next.js API routes
- `get_database_schema` - Access schema and migrations

### Starting MCP Server:
```bash
./mcp-control.sh start
./mcp-control.sh status
./mcp-control.sh logs
```

## Example Workflow

### Phase 1: Claude Creates Feature
```
Create a new git branch feat/ai-insights-dashboard.
Scaffold an AI Insights Dashboard page (Next.js + Tailwind) with cards for:
- Customer health scores
- Revenue predictions
- Business opportunities
Wire data from our PredictiveAnalyticsEngine.
Run the dev server on port 3010.
Open a PR titled "feat: AI insights dashboard".
Keep the diff minimal and include basic tests.
```

### Phase 2: Codex Reviews and Tests
```
Review the "feat: AI insights dashboard" PR.
Add Playwright e2e tests for admin login → AI dashboard happy path (port 3010).
Test the customer health scoring API integration.
If fixes are needed, create branch chore/tests-ai-dashboard, push, and open a PR.
```

## Environment Configuration

### Required Environment Variables (.env.local):
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://jvhbqfueutvfepsjmztx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Development
NEXT_PUBLIC_APP_URL=http://localhost:3010
NODE_ENV=development

# Test Keys Only
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Testing Standards

### Unit Tests (Jest)
- Test business logic and utilities
- Mock external dependencies
- Achieve >80% code coverage

### E2E Tests (Playwright)
- Test complete user workflows
- Verify cross-browser compatibility
- Include mobile responsive tests

### Integration Tests
- Test API endpoints with real database
- Verify authentication flows
- Test payment processing (test mode)

## Security Considerations

### For Both Agents:
- Never commit secrets or API keys
- Use test mode for all payment processing
- Implement proper input validation
- Follow RLS policy requirements
- Log security-relevant operations

## Communication Protocol

### When Issues Arise:
1. Share the exact error message from either window
2. Include relevant log outputs
3. Specify which agent (Claude/Codex) encountered the issue
4. Provide context about current branch and changes

### Status Updates:
Use `/status` command in Codex window to load AGENTS.md guardrails

## Project-Specific Context

### Fisher Backflows Business Domain:
- **Industry**: Backflow prevention device testing
- **Compliance**: Washington State regulations
- **Users**: Property owners, technicians, water districts
- **Core Workflows**: Scheduling → Testing → Reporting → Billing

### Technical Architecture:
- **Frontend**: Next.js 15 with glassmorphism UI
- **Backend**: Supabase PostgreSQL with RLS
- **Authentication**: Custom JWT system
- **AI Integration**: Predictive analytics engine
- **Payment**: Stripe integration
- **Mobile**: PWA with offline support