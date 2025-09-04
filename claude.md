# Claude Development Guide - Fisher Backflows Platform

## Project Overview
Fisher Backflows - A comprehensive Next.js PWA application with Supabase backend for backflow testing, compliance management, and service scheduling. The application serves customers, field technicians, team members, and administrators.

## Repository & Deployment Information

### GitHub Repository
- **URL**: https://github.com/fisherbackflows/fisherbackflows-platform.git
- **Main Branch**: main
- **Recent Activity**: Active development with customer registration and onboarding improvements

### Recent Commits
- Fix customer registration workflow and add cleanup tools
- Fix critical production build errors and enable customer onboarding
- Cross-platform compatibility fixes
- Fix customer onboarding system - registration, login, and dashboard
- Fix login API 500 error - correct customer data mapping

### Vercel Deployment
- **Production URL**: https://fisherbackflows.com
- **Project ID**: prj_l1g9DnOpPiFlBAgvNQzgM3xMSWNs
- **Organization ID**: team_OMXDKZL3plGWNFXXenXqKSmR
- **Project Name**: fisherbackflows
- **Recent Deployments**: Multiple staging deployments on Vercel app domain

### Supabase Configuration
- **Project URL**: https://jvhbqfueutvfepsjmztx.supabase.co
- **Project Reference**: jvhbqfueutvfepsjmztx
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- **MCP Server**: Configured with read/write access
- **Access Token**: sbp_bc8d8e30325000a099ffb06310f3e53d87d37c21

## Tech Stack
- **Framework**: Next.js 15.5.0 with React 19.1.0
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS with Glassmorphism UI
- **Authentication**: Supabase Auth + Custom JWT sessions
- **Payment Processing**: Stripe (Test mode configured)
- **Email Service**: Resend (configured with onboarding@resend.dev)
- **PWA**: Web Push Notifications, Service Workers
- **Type Safety**: TypeScript (with relaxed settings)
- **Deployment**: Vercel

## Key Commands

### Development
```bash
npm run dev           # Start dev server on port 3010
npm run dev-turbo     # Start with Turbopack
npm run build         # Production build
npm run build-turbo   # Build with Turbopack
npm run start         # Start production server
```

### Code Quality & Testing
```bash
npm run lint          # Run ESLint with auto-fix
npm run type-check    # TypeScript type checking
npm run format        # Format with Prettier
npm run format:check  # Check formatting

# Testing
npm run test          # Run all tests
npm run test:unit     # Unit tests only
npm run test:integration # Integration tests
npm run test:e2e      # End-to-end tests (Playwright)
npm run test:smoke    # Smoke tests (30s timeout)
npm run test:health   # Health check
npm run test:coverage # Test with coverage
npm run test:build    # Build and test
```

### Setup & Verification
```bash
npm run setup         # Verify project setup
npm run verify        # Same as setup
npm run db:setup:test # Setup test database
```

## Environment Variables
Required in `.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://jvhbqfueutvfepsjmztx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# App URL
NEXT_PUBLIC_APP_URL=https://fisherbackflows.com  # or http://localhost:3010 for dev

# Email Service
RESEND_API_KEY=<your-resend-key>
RESEND_FROM_EMAIL=onboarding@resend.dev

# Stripe (Test Keys)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test...
```

## Database Schema

### Core Tables (24 tables with RLS enabled)
- **customers** (40 rows) - Customer accounts with auth
- **team_users** (1 row) - Internal team members (admin/tester roles)
- **devices** (31 rows) - Backflow prevention devices
- **appointments** (29 rows) - Service appointments
- **test_reports** (1 row) - Test results and certifications
- **invoices** (3 rows) - Service invoices
- **payments** (0 rows) - Payment records

### Supporting Tables
- **billing_subscriptions** - Recurring billing
- **billing_invoices** - Stripe invoice records
- **water_districts** (1 row) - Water district configurations
- **water_department_submissions** - Report submissions
- **notification_templates** (4 rows) - Push notification templates
- **push_subscriptions** - PWA notification subscriptions
- **notification_logs** - Sent notifications
- **notification_interactions** - User interaction tracking
- **audit_logs** - System audit trail
- **security_logs** (32 rows) - Authentication events
- **email_verifications** - Email verification tokens
- **leads** - Sales leads
- **technician_locations** - GPS tracking
- **technician_current_location** - Real-time location
- **time_off_requests** - Staff scheduling
- **tester_schedules** - Technician schedules
- **team_sessions** (14 rows) - Active sessions
- **invoice_line_items** (3 rows) - Invoice details

### Database Extensions Available
- uuid-ossp (installed)
- pgcrypto (installed)
- pg_graphql (installed)
- pg_stat_statements (installed)
- supabase_vault (installed)
- 70+ other extensions available including PostGIS, pg_cron, vector, etc.

## Security Advisories
Current security notices from Supabase:
1. **RLS Policies Missing**: Tables with RLS enabled but no policies:
   - billing_invoices
   - security_logs
   - technician_current_location
   - technician_locations
   [Remediation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)

2. **Function Search Path**: Function `update_updated_at_column` needs search_path parameter
   [Remediation](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)

3. **Leaked Password Protection**: Currently disabled - should enable HaveIBeenPwned checking
   [Remediation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

## Application Structure

### Main Portals
1. **Customer Portal** (`/portal/*`)
   - Dashboard, billing, devices, reports
   - Self-service scheduling
   - Payment processing
   - Email verification

2. **Team Portal** (`/team-portal/*`)
   - Customer management
   - Scheduling & routing
   - Invoicing & billing
   - Test report management
   - District submissions
   - Data import/export
   - Backup management

3. **Field App** (`/field/*`)
   - Mobile-optimized for technicians
   - Offline support
   - GPS tracking
   - Test completion
   - Login system

4. **Admin Panel** (`/admin/*`)
   - Analytics & reporting
   - Audit logs
   - Health monitoring
   - Data management
   - Account unlocking
   - Route optimization
   - Site navigation

## PWA Configuration
The app is a full Progressive Web App with:
- **App Name**: Fisher Backflows - Business Management & Customer Portal
- **Theme Color**: #0ea5e9 (Sky blue)
- **Background**: #0f172a (Dark slate)
- **Display**: Standalone
- **Orientation**: Portrait primary
- **Service Worker**: Configured at `/sw.js`
- **Icons**: Full set from 72x72 to 512x512
- **Shortcuts**: Quick access to Portal, Schedule, Pay, and Business App
- **Screenshots**: Mobile and desktop previews configured

## API Routes
Located in `src/app/api/`:
- Auth endpoints (login, register, verify)
- Customer management
- Device & appointment CRUD
- Test report processing
- Billing & payments
- Push notifications
- Health checks

## Key Features
- **PWA Support**: Installable, offline-capable, push notifications
- **Real-time Updates**: Live appointment tracking
- **Multi-tenant**: Supports multiple water districts
- **Compliance**: Automated district report submissions
- **Mobile-First**: Responsive design for field use
- **Security**: RLS policies, audit logging, rate limiting
- **GPS Tracking**: Real-time technician location
- **Email Verification**: Secure account activation
- **Session Management**: JWT and session-based auth

## TypeScript Configuration
- Target: ES2017
- Module: ESNext
- JSX: Preserve
- Strict mode: Disabled
- Path aliases: `@/*` for `./src/*`
- Skip lib check: true
- No implicit any/returns: false

## Build Configuration
- TypeScript errors ignored in build
- ESLint errors ignored in build
- Optimized for production deployment
- Next.js configuration in `next.config.mjs`

## ESLint Configuration
- Extends: next/core-web-vitals, @typescript-eslint/recommended
- Parser: @typescript-eslint/parser
- Key rules:
  - No unused vars (error)
  - No explicit any (warn)
  - Prefer const (error)
  - No console (warn)
  - No debugger (error)

## Development Workflow
1. Run `npm run dev` to start development on port 3010
2. Make changes with hot reload
3. Run `npm run lint` before committing
4. Run `npm run type-check` to verify types
5. Test with `npm run test:unit`
6. Build with `npm run build` to verify

## Scripts Directory
Contains 50+ utility scripts for:
- Database setup and verification
- Test data generation and cleanup
- API testing and validation
- PWA icon generation
- Performance auditing
- Migration helpers
- Email template updates
- Analytics testing
- Direct database operations
- Mock session creation
- Stripe webhook testing

## MCP Integration
Supabase MCP server configured for:
- Direct database access
- Schema management
- Log viewing
- Migration execution
- SQL query execution
- TypeScript type generation
- Advisory checks (security/performance)

## Dependencies Highlights

### Production
- @supabase/supabase-js (2.56.0)
- @supabase/auth-helpers-nextjs
- @heroicons/react
- @radix-ui components
- @sendgrid/mail
- stripe (18.5.0)
- jspdf & jspdf-autotable (PDF generation)
- recharts (data visualization)
- resend (6.0.2)
- web-push (3.6.7)
- bcryptjs, jsonwebtoken
- date-fns, uuid
- zod (validation)

### Development
- @playwright/test
- jest & babel-jest
- eslint & prettier
- typescript (5.x)
- vercel CLI (41.0.2)

## Important Notes
- Always run lint and type-check before committing
- Use existing components and patterns
- Follow established glassmorphism UI style
- Test changes locally before deployment
- RLS policies active on most tables (some missing - see security advisories)
- Audit logs track all critical operations
- Session-based auth for team portal
- JWT auth for customer portal
- Production domain: fisherbackflows.com
- Staging deployments on *.vercel.app
- Email verification required for customer accounts
- Stripe in test mode for development