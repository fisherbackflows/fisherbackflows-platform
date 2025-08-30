# Fisher Backflows - Production Deployment Guide

## Overview

This guide covers deploying the Fisher Backflows platform to production using Vercel, with Supabase as the backend.

## Pre-Deployment Checklist

### Required Services
- [ ] Vercel account (for hosting)
- [ ] Supabase project (production tier recommended)
- [ ] Custom domain (e.g., fisherbackflows.com)
- [ ] Stripe account (for payments)
- [ ] SendGrid account (for emails)
- [ ] SSL certificate (handled by Vercel)

### Security Checklist
- [ ] Generate new JWT secrets for production
- [ ] Update all API keys for production
- [ ] Configure CORS for your domain only
- [ ] Enable rate limiting
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy

## Step 1: Prepare Production Database

### 1.1 Create Production Supabase Project

```bash
# Create a new Supabase project for production
# Use a different project than development
# Choose a region close to your users
```

### 1.2 Run Database Migrations

```sql
-- Run all migrations in order
-- /supabase/migrations/001_initial_schema.sql
-- /supabase/migrations/002_auth_setup.sql
-- /supabase/migrations/003_missing_business_tables.sql
-- /supabase/migrations/004_complete_business_schema.sql
```

### 1.3 Configure Row Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create appropriate policies for each table
-- Example for customers table
CREATE POLICY "Customers can view own data" ON customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Team members can view all customers" ON customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.is_active = true
    )
  );
```

## Step 2: Configure Production Environment

### 2.1 Create Production Environment File

Create `.env.production.local`:

```env
# Production Supabase
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=prod_service_role_key

# Production App URL
NEXT_PUBLIC_APP_URL=https://fisherbackflows.com

# Production Stripe
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_live_xxx

# Production SendGrid
SENDGRID_API_KEY=SG.prod_key
SENDGRID_FROM_EMAIL=noreply@fisherbackflows.com
SENDGRID_FROM_NAME=Fisher Backflows

# Production Security Keys (generate new ones!)
JWT_SECRET=generate_new_production_secret
ENCRYPTION_KEY=generate_new_production_key

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_HOTJAR_ID=XXXXXXX
```

### 2.2 Generate Production Secrets

```bash
# Generate secure secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

## Step 3: Deploy to Vercel

### 3.1 Install Vercel CLI

```bash
npm i -g vercel
```

### 3.2 Initial Deployment

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts:
# - Select team/account
# - Link to existing project or create new
# - Configure project settings
```

### 3.3 Configure Environment Variables

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add all production environment variables
5. Ensure they're scoped to "Production" only

### 3.4 Configure Custom Domain

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain (e.g., fisherbackflows.com)
3. Configure DNS records:

```dns
# A Records (if using apex domain)
A     @     76.76.21.21
A     @     76.76.21.93

# CNAME Record (if using subdomain)
CNAME www   cname.vercel-dns.com

# For email
MX    @     10  mx.sendgrid.net
```

## Step 4: Configure Production Services

### 4.1 Stripe Production Setup

1. Switch to Live mode in Stripe Dashboard
2. Configure webhook endpoint:
   ```
   Endpoint URL: https://fisherbackflows.com/api/stripe/webhook
   Events: payment_intent.succeeded, invoice.paid, etc.
   ```
3. Update webhook secret in Vercel environment variables

### 4.2 SendGrid Production Setup

1. Verify your domain in SendGrid
2. Configure SPF/DKIM records
3. Create production email templates
4. Update sender authentication

### 4.3 Configure Monitoring

1. **Vercel Analytics**
   ```javascript
   // Already included in Next.js
   ```

2. **Error Tracking (Sentry)**
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard -i nextjs
   ```

3. **Uptime Monitoring**
   - Use Vercel's built-in monitoring
   - Or configure external service (UptimeRobot, Pingdom)

## Step 5: Performance Optimization

### 5.1 Enable Caching

```javascript
// next.config.js
module.exports = {
  // Enable ISR for dynamic pages
  experimental: {
    isrMemoryCacheSize: 0 // Disable in-memory caching for ISR
  },
  // Configure image optimization
  images: {
    domains: ['storage.supabase.co'],
    formats: ['image/avif', 'image/webp']
  }
}
```

### 5.2 Configure CDN

Vercel automatically provides CDN, but ensure:
- Static assets are properly cached
- API responses have appropriate cache headers
- Images are optimized

### 5.3 Database Optimization

```sql
-- Create indexes for common queries
CREATE INDEX idx_appointments_date ON appointments(scheduled_date);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_test_reports_customer ON test_reports(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM appointments WHERE scheduled_date = '2025-01-20';
```

## Step 6: Security Hardening

### 6.1 Configure Security Headers

Already configured in `vercel.json`:
- Strict-Transport-Security
- X-Frame-Options
- X-Content-Type-Options
- Content-Security-Policy

### 6.2 Enable Rate Limiting

```javascript
// /src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})
```

### 6.3 API Security

```javascript
// Implement in all API routes
export async function POST(req: NextRequest) {
  // Rate limiting
  const identifier = req.ip ?? 'anonymous'
  const { success } = await rateLimiter.limit(identifier)
  if (!success) {
    return new Response('Too Many Requests', { status: 429 })
  }
  
  // Input validation
  const body = await req.json()
  const validated = schema.safeParse(body)
  if (!validated.success) {
    return new Response('Invalid Input', { status: 400 })
  }
  
  // Process request...
}
```

## Step 7: Automated Deployment

### 7.1 Configure GitHub Integration

1. Connect GitHub repo to Vercel
2. Enable automatic deployments
3. Configure branch deployments:
   - `main` → Production
   - `develop` → Preview
   - Pull Requests → Preview

### 7.2 CI/CD Pipeline

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Type check
        run: npm run type-check
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Step 8: Post-Deployment

### 8.1 Verify Deployment

```bash
# Check site status
curl -I https://fisherbackflows.com

# Test API health
curl https://fisherbackflows.com/api/health

# Run smoke tests
npm run test:smoke
```

### 8.2 Configure Monitoring Alerts

1. Set up alerts for:
   - Error rate > 1%
   - Response time > 3s
   - Failed deployments
   - Database connection issues

2. Configure notification channels:
   - Email
   - SMS (for critical issues)
   - Slack/Discord

### 8.3 Create Runbook

Document procedures for:
- Rollback process
- Database backup/restore
- Incident response
- Scaling procedures

## Step 9: Maintenance Mode

### 9.1 Enable Maintenance Mode

```javascript
// /src/middleware.ts
export function middleware(request: NextRequest) {
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true'
  
  if (isMaintenanceMode && !request.url.includes('/maintenance')) {
    return NextResponse.redirect(new URL('/maintenance', request.url))
  }
}
```

### 9.2 Scheduled Maintenance

```bash
# Enable maintenance mode
vercel env pull
echo "MAINTENANCE_MODE=true" >> .env.production
vercel env add MAINTENANCE_MODE production

# Perform maintenance...

# Disable maintenance mode
vercel env rm MAINTENANCE_MODE production
```

## Step 10: Backup & Disaster Recovery

### 10.1 Database Backups

```bash
# Automatic backups (Supabase Pro)
# Daily backups retained for 30 days

# Manual backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### 10.2 Application Backup

```bash
# Backup application code
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0
```

### 10.3 Disaster Recovery Plan

1. **Database failure**: Restore from Supabase backup
2. **Application failure**: Rollback to previous deployment
3. **Service outage**: Failover to status page
4. **Data corruption**: Restore from point-in-time backup

## Monitoring Dashboard

### Key Metrics to Track

1. **Performance**
   - Page load time
   - API response time
   - Error rate
   - Uptime percentage

2. **Business**
   - Active users
   - Completed tests
   - Revenue processed
   - Customer satisfaction

3. **Infrastructure**
   - CPU usage
   - Memory usage
   - Database connections
   - Storage usage

## Scaling Considerations

### When to Scale

- Response time > 3 seconds consistently
- Error rate > 1%
- Database connections > 80% of limit
- Storage > 80% of limit

### How to Scale

1. **Vertical Scaling**
   - Upgrade Supabase plan
   - Increase Vercel limits

2. **Horizontal Scaling**
   - Enable Vercel Edge Functions
   - Implement database read replicas
   - Use connection pooling

## Support & Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   - Check Supabase status
   - Verify environment variables
   - Review function logs

2. **Slow Performance**
   - Check database indexes
   - Review API response times
   - Analyze bundle size

3. **Payment Issues**
   - Verify Stripe webhook
   - Check webhook secrets
   - Review Stripe logs

### Getting Help

- Vercel Support: support@vercel.com
- Supabase Support: support@supabase.com
- Fisher Backflows: support@fisherbackflows.com

---

*Deployment Guide v1.0 - Production Ready*