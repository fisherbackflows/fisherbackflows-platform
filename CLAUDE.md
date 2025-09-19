# Claude Development Guide - Fisher Backflows Platform v3

## Project Overview
Fisher Backflows Platform v3 - A clean, customer-ready comprehensive Next.js PWA application with Supabase backend for backflow testing, compliance management, and service scheduling. This is a production-ready platform serving customers, field technicians, team members, and administrators.

## Tech Stack
- **Framework**: Next.js 15.5.0 with React 19.1.0
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS with Glassmorphism UI
- **Authentication**: Supabase Auth + Custom JWT sessions
- **Payment Processing**: Stripe
- **Email Service**: Resend
- **PWA**: Web Push Notifications, Service Workers
- **Type Safety**: TypeScript
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
npm run test:coverage # Test with coverage
```

### Setup & Verification
```bash
npm install           # Install dependencies
npm run setup         # Verify project setup
npm run verify        # Same as setup
```

## Environment Variables
Create `.env.local` with:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.com  # or http://localhost:3010 for dev

# Email Service
RESEND_API_KEY=your-resend-key
RESEND_FROM_EMAIL=your-email@domain.com

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-public
STRIPE_WEBHOOK_SECRET=your-webhook-secret
```

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

3. **Field App** (`/field/*`)
   - Mobile-optimized for technicians
   - Offline support
   - GPS tracking
   - Test completion

4. **Admin Panel** (`/admin/*`)
   - Analytics & reporting
   - Audit logs
   - Health monitoring
   - Data management

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

## Development Workflow
1. Run `npm install` to install dependencies
2. Configure environment variables in `.env.local`
3. Run `npm run dev` to start development on port 3010
4. Make changes with hot reload
5. Run `npm run lint` before committing
6. Run `npm run type-check` to verify types
7. Test with `npm run test:unit`
8. Build with `npm run build` to verify

## Important Notes
- Always run lint and type-check before committing
- Use existing components and patterns
- Follow established glassmorphism UI style
- Test changes locally before deployment
- Ensure RLS policies are properly configured
- Audit logs track all critical operations
- Email verification required for customer accounts

## Getting Started
1. Clone this repository
2. Run `npm install`
3. Copy `.env.local.example` to `.env.local` and configure
4. Set up your Supabase database with required tables
5. Run `npm run dev`
6. Visit http://localhost:3010

## Production Deployment
1. Configure environment variables on your hosting platform
2. Ensure database is properly set up with RLS policies
3. Configure Stripe webhooks
4. Set up email service
5. Deploy and test all functionality

This platform is ready for customer use with proper configuration and deployment.