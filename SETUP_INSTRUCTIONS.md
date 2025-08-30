# Fisher Backflows Platform - Complete Setup Guide

## Prerequisites

Before starting, ensure you have:
- Node.js 18+ installed
- Git installed
- A Supabase account (free tier works)
- (Optional) Stripe account for payments
- (Optional) SendGrid account for emails
- (Optional) Vercel account for deployment

## Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/fisherbackflows/fisherbackflows.git

# Navigate to project directory
cd fisherbackflows

# Install dependencies
npm install
```

## Step 2: Supabase Setup

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization if needed
4. Create a new project with:
   - Name: `fisherbackflows`
   - Database Password: (save this securely)
   - Region: Choose closest to your location

### 2.2 Get Supabase Credentials

1. Go to Settings → API in your Supabase dashboard
2. Copy these values:
   - Project URL
   - Anon/Public key
   - Service role key (keep this secret!)

### 2.3 Set Up Database Tables

1. Go to SQL Editor in Supabase dashboard
2. Create a new query
3. Copy and run the SQL from `/supabase/migrations/001_initial_schema.sql`
4. Run each migration file in order:
   ```
   001_initial_schema.sql
   002_auth_setup.sql
   003_missing_business_tables.sql
   004_complete_business_schema.sql
   ```

### 2.4 Configure Authentication

1. Go to Authentication → Providers
2. Enable Email provider
3. Configure email templates (optional)
4. Set up allowed domains if needed

## Step 3: Environment Configuration

### 3.1 Create Environment File

Create a `.env.local` file in the root directory:

```bash
# Copy the example environment file
cp .env.example .env.local
```

### 3.2 Configure Environment Variables

Edit `.env.local` with your credentials:

```env
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3010

# Email Configuration (Optional - for email notifications)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Fisher Backflows

# Payment Configuration (Optional - for Stripe payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Security (Generate random strings)
JWT_SECRET=generate_a_random_32_character_string
ENCRYPTION_KEY=generate_another_random_32_character_string
```

### 3.3 Generate Security Keys

Generate secure random strings for JWT_SECRET and ENCRYPTION_KEY:

```bash
# Generate random strings
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Stripe Setup (Optional)

### 4.1 Create Stripe Account

1. Sign up at [stripe.com](https://stripe.com)
2. Get your API keys from the Dashboard

### 4.2 Configure Webhook

1. In Stripe Dashboard, go to Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.failed`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy the webhook signing secret

## Step 5: SendGrid Setup (Optional)

### 5.1 Create SendGrid Account

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Verify your sender email address
3. Create an API key with full access

### 5.2 Configure Email Templates

1. Create dynamic templates in SendGrid
2. Update template IDs in `/src/lib/email.ts`

## Step 6: Local Development

### 6.1 Start Development Server

```bash
# Start the development server
npm run dev

# The app will be available at:
# http://localhost:3010
```

### 6.2 Test the Setup

1. Open http://localhost:3010
2. Test customer login:
   - Click "Customer Portal"
   - Use demo credentials: `demo` / `demo`
3. Test team login:
   - Go to http://localhost:3010/app
   - Use admin credentials: `admin@fisherbackflows.com` / `password`

### 6.3 Verify API Endpoints

```bash
# Run API test script
node scripts/test-api-endpoints.js
```

## Step 7: Database Seeding (Optional)

### 7.1 Add Sample Data

Create sample customers and data:

```sql
-- Run in Supabase SQL Editor
INSERT INTO customers (name, email, phone, address, account_number)
VALUES 
  ('John Doe', 'john@example.com', '555-0101', '123 Main St, Tacoma, WA', 'FB001'),
  ('Jane Smith', 'jane@example.com', '555-0102', '456 Oak Ave, Tacoma, WA', 'FB002');

-- Add sample devices
INSERT INTO devices (customer_id, serial_number, location, size, make, model)
SELECT 
  id, 
  'BF-2025-' || ROW_NUMBER() OVER(),
  'Main Building',
  '3/4"',
  'Watts',
  'Series 909'
FROM customers;
```

## Step 8: Production Deployment

### 8.1 Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel

# Follow the prompts:
# - Link to existing project or create new
# - Configure project settings
# - Set environment variables
```

3. Set production environment variables in Vercel Dashboard

### 8.2 Configure Custom Domain

1. In Vercel Dashboard, go to Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### 8.3 Production Database

For production, consider:
1. Upgrading Supabase to Pro plan
2. Setting up database backups
3. Configuring connection pooling
4. Setting up monitoring

## Step 9: Post-Deployment

### 9.1 Test Production Site

```bash
# Test production API
curl https://yourdomain.com/api/health
```

### 9.2 Set Up Monitoring

1. Configure Vercel Analytics
2. Set up error tracking (e.g., Sentry)
3. Configure uptime monitoring

### 9.3 Security Checklist

- [ ] Change default passwords
- [ ] Update JWT secrets
- [ ] Configure CORS settings
- [ ] Set up rate limiting
- [ ] Enable HTTPS only
- [ ] Configure CSP headers
- [ ] Set up backup strategy
- [ ] Configure audit logging

## Troubleshooting

### Common Issues and Solutions

#### Port 3010 already in use
```bash
# Kill the process using the port
lsof -i :3010
kill -9 <PID>
```

#### Supabase connection error
- Check your Supabase URL and keys
- Verify project is active
- Check network connectivity

#### Build errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

#### TypeScript errors
```bash
# Check types
npm run type-check

# Fix linting issues
npm run lint
```

## Development Commands

```bash
# Development
npm run dev              # Start development server
npm run dev-turbo       # Start with Turbopack (faster)

# Building
npm run build           # Build for production
npm run build-turbo     # Build with Turbopack
npm start              # Start production server

# Code Quality
npm run lint           # Run ESLint
npm run type-check     # Check TypeScript
npm run format         # Format with Prettier
npm test              # Run tests

# Database
npx supabase db push   # Push migrations
npx supabase db reset  # Reset database

# Utilities
npm run analyze        # Analyze bundle size
npm run test:api      # Test API endpoints
```

## Getting Help

### Resources

- **Documentation**: [README.md](./README.md)
- **API Docs**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **GitHub Issues**: [github.com/fisherbackflows/fisherbackflows/issues](https://github.com/fisherbackflows/fisherbackflows/issues)

### Support Channels

- **Email**: support@fisherbackflows.com
- **Phone**: (253) 278-8692
- **Business Hours**: Mon-Fri 8am-5pm PST

### Community

- Join our Discord server (coming soon)
- Follow updates on Twitter @fisherbackflows
- Subscribe to our newsletter for updates

## License

This software is proprietary. See [LICENSE](./LICENSE) for details.

---

*Setup Guide Version 1.0 - Last Updated: January 2025*