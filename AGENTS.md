# Project Guardrails for Agents

## Stack Configuration
- **Framework**: Next.js 15.5.0 + React 19.1.0 + TypeScript 5.x
- **Styling**: Tailwind CSS 3.4.17 with Glassmorphism UI components
- **Database**: Supabase PostgreSQL (jvhbqfueutvfepsjmztx.supabase.co)
- **Authentication**: Custom JWT + Database sessions (no Supabase Auth)
- **Payment**: Stripe test mode integration
- **Dev Server**: Use port 3010 (`npm run dev`)

## Branch Strategy
- **Features**: feat/* branches (e.g., feat/owner-dashboard-shell)
- **Tests/Infrastructure**: chore/* branches (e.g., chore/tests-owner-dashboard)
- **Main Branch**: main (production deployments)
- **Hotfixes**: hotfix/* branches

## CI/CD Requirements
CI must pass for all PRs:
- ✅ TypeScript type checking (`npm run type-check`)
- ✅ ESLint linting (`npm run lint`)
- ✅ Unit tests (`npm run test:unit`)
- ✅ End-to-end tests (`npm run test:e2e`)
- ✅ Build verification (`npm run build`)

## Security Requirements
- **Never commit secrets**: Use .env.local for development
- **Environment Template**: Ship .env.example with placeholders
- **API Keys**: Test keys only in development
- **Database**: Row Level Security (RLS) policies required
- **Audit Logging**: All sensitive operations must be logged

## PR Checklist
- [ ] Tests added/updated for new functionality
- [ ] Documentation updated (README, API docs)
- [ ] No unrelated refactors in the same PR
- [ ] Environment variables documented in .env.example
- [ ] TypeScript types properly defined
- [ ] Error handling implemented
- [ ] Security considerations addressed

## Fisher Backflows Specific
- **Business Context**: Backflow testing compliance management
- **User Types**: Customers, Technicians, Team Members, Admins
- **Core Features**: Scheduling, Testing, Compliance, Billing, GPS Tracking
- **Regulatory**: Washington State backflow testing requirements
- **Production URL**: https://fisherbackflows.com
- **Project Structure**: Multi-portal architecture (customer, team, field, admin)

## Code Standards
- **Components**: Use existing glassmorphism UI patterns
- **API Routes**: Follow Next.js 15 App Router conventions
- **Database**: Supabase client with proper error handling
- **Styling**: Tailwind utility classes, responsive design
- **Testing**: Jest for unit tests, Playwright for e2e
- **TypeScript**: Strict typing, proper interfaces

## Development Workflow
1. Create feature branch from main
2. Implement changes with tests
3. Run full CI suite locally
4. Open PR with clear description
5. Code review and testing
6. Merge to main triggers production deployment

## MCP Integration
- **MCP Server**: mcp-server-simple.js (read-only project access)
- **Control Script**: ./mcp-control.sh for server management
- **Tools Available**: file reading, API endpoint discovery, database schema access