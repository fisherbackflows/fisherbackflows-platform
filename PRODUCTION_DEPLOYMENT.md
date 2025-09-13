# Production Deployment Guide

## 🚀 Production Readiness Checklist

### Environment Configuration
- [ ] **Environment Variables**: All required environment variables configured in production
- [ ] **Secrets Management**: Sensitive keys stored securely (not in code)
- [ ] **Database URLs**: Production Supabase URLs configured
- [ ] **Service Keys**: All third-party service keys (Upstash, Resend) configured
- [ ] **CORS Settings**: Production domains properly configured

### Database Preparation
- [ ] **Schema Migration**: Run all SQL migrations in production Supabase
- [ ] **RLS Policies**: All Row Level Security policies applied
- [ ] **Indexes**: Performance indexes created for large tables
- [ ] **Backup Strategy**: Automated database backups configured
- [ ] **Connection Pooling**: Supabase connection pooling enabled

### Security Configuration
- [ ] **JWT Secrets**: Secure JWT signing keys configured
- [ ] **HTTPS Only**: All production traffic over HTTPS
- [ ] **Rate Limiting**: API rate limiting configured
- [ ] **Input Validation**: All user inputs properly validated
- [ ] **SQL Injection Protection**: Parameterized queries used throughout

### Performance Optimization
- [ ] **Redis Caching**: Upstash Redis configured and tested
- [ ] **CDN Setup**: Static assets served via CDN
- [ ] **Image Optimization**: Next.js Image optimization configured
- [ ] **Bundle Analysis**: JavaScript bundle size optimized
- [ ] **Database Queries**: N+1 query problems resolved

### Monitoring & Observability
- [ ] **Error Tracking**: Sentry or similar error tracking configured
- [ ] **Performance Monitoring**: APM solution configured
- [ ] **Health Checks**: Application health endpoints tested
- [ ] **Log Management**: Structured logging with proper levels
- [ ] **Alerting**: Critical error alerts configured

### Email & Communication
- [ ] **Email Service**: Resend production configuration tested
- [ ] **Email Templates**: All email templates properly formatted
- [ ] **Webhook Verification**: Email webhook signatures verified
- [ ] **Bounce Handling**: Email bounce and complaint handling tested
- [ ] **Transactional Emails**: Welcome, notification emails working

### Background Jobs
- [ ] **QStash Configuration**: Upstash QStash properly configured
- [ ] **Job Queues**: All job types properly configured
- [ ] **Retry Logic**: Failed job retry mechanisms tested
- [ ] **Dead Letter Queue**: Failed job handling configured
- [ ] **Job Monitoring**: Job execution monitoring in place

### Testing
- [ ] **Unit Tests**: All unit tests passing
- [ ] **Integration Tests**: API integration tests passing
- [ ] **E2E Tests**: End-to-end user flows tested
- [ ] **Load Testing**: Application performance under load tested
- [ ] **Security Testing**: Security vulnerabilities scanned

### Deployment Pipeline
- [ ] **CI/CD Pipeline**: Automated deployment pipeline configured
- [ ] **Environment Promotion**: Staging → Production deployment process
- [ ] **Rollback Strategy**: Quick rollback mechanism in place
- [ ] **Zero-Downtime Deployment**: Deployment without service interruption
- [ ] **Database Migration Strategy**: Safe database update process

---

## 📋 Deployment Steps

### 1. Pre-Deployment Preparation

#### Environment Setup
```bash
# 1. Configure production environment variables
cp .env.example .env.production
# Edit .env.production with production values

# 2. Verify all services are configured
npm run verify

# 3. Run all tests
npm run test:all
```

#### Database Migration
```sql
-- Run in Supabase SQL Editor (Production)
-- 1. Execute schema migration
\i supabase/migrations/001_initial_schema.sql

-- 2. Apply RLS policies  
\i supabase/migrations/002_rls_policies.sql

-- 3. Verify all tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### 2. Service Configuration

#### Upstash Redis Setup
1. Create production Redis database in Upstash console
2. Configure Redis URL and token in environment variables
3. Test Redis connection:
```bash
curl -X POST https://your-redis-url/get/test-key \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Upstash QStash Setup
1. Create QStash project in Upstash console
2. Configure webhook endpoints for background jobs
3. Set up dead letter queue for failed jobs
4. Test job publishing:
```bash
curl -X POST "https://qstash.upstash.io/v1/publish/https://your-app.com/api/jobs/test" \
  -H "Authorization: Bearer YOUR_QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

#### Resend Email Setup
1. Verify domain in Resend console
2. Configure SPF and DKIM records
3. Test email sending:
```bash
curl -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer YOUR_RESEND_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@yourdomain.com",
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<p>Test email content</p>"
  }'
```

### 3. Vercel Deployment

#### Initial Deploy
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Link project
vercel link

# 4. Configure environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# ... (add all environment variables)

# 5. Deploy to production
vercel --prod
```

#### Deployment Configuration
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options", 
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### 4. Post-Deployment Verification

#### Health Checks
```bash
# 1. Application health
curl https://your-app.com/api/health

# 2. Database connectivity
curl https://your-app.com/api/health/db

# 3. Redis connectivity  
curl https://your-app.com/api/health/redis

# 4. Email service
curl https://your-app.com/api/health/email
```

#### Functional Testing
```bash
# Run smoke tests against production
npm run test:smoke -- --baseUrl=https://your-app.com

# Test user registration flow
curl -X POST https://your-app.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "secure-password",
    "full_name": "Test User",
    "org_id": "test-org-id"
  }'

# Test authentication
curl -X POST https://your-app.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com", 
    "password": "secure-password"
  }'
```

---

## 🔧 Configuration Templates

### Production Environment Variables
```bash
# Core Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication
JWT_SECRET=your-very-secure-jwt-secret-256-bits-minimum
SESSION_SECRET=your-secure-session-secret-256-bits

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Upstash QStash  
QSTASH_URL=https://qstash.upstash.io/v1
QSTASH_TOKEN=your-qstash-token
QSTASH_CURRENT_SIGNING_KEY=your-current-key
QSTASH_NEXT_SIGNING_KEY=your-next-key

# Resend Email
RESEND_API_KEY=re_your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_WEBHOOK_SECRET=whsec_your-webhook-secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=true

# Security
BCRYPT_ROUNDS=12
IDEMPOTENCY_TTL_SECONDS=3600
```

### Supabase RLS Policy Examples
```sql
-- Example: Organization-scoped customer access
CREATE POLICY "Users can access customers from their organization" 
ON customers FOR ALL 
TO authenticated 
USING (
  org_id IN (
    SELECT org_id FROM user_org_memberships 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- Example: Role-based work order access
CREATE POLICY "Work order access by role" 
ON work_orders FOR ALL 
TO authenticated 
USING (
  CASE 
    WHEN user_role() IN ('admin', 'manager') THEN 
      org_id = user_org_id()
    WHEN user_role() = 'inspector' THEN 
      (assigned_to = auth.uid() OR created_by = auth.uid())
      AND org_id = user_org_id()
    ELSE false
  END
);
```

### Health Check Endpoints
```typescript
// src/app/api/health/route.ts
export async function GET() {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(), 
    checkEmail(),
    checkQStash()
  ]);

  const results = checks.map((check, index) => ({
    service: ['database', 'redis', 'email', 'qstash'][index],
    status: check.status === 'fulfilled' ? 'healthy' : 'unhealthy',
    ...(check.status === 'rejected' && { error: check.reason })
  }));

  const isHealthy = results.every(r => r.status === 'healthy');

  return Response.json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: results
  }, { 
    status: isHealthy ? 200 : 503 
  });
}
```

---

## 📊 Monitoring & Alerting

### Key Metrics to Monitor
- **Response Times**: API endpoint response times
- **Error Rates**: 4xx and 5xx error percentages
- **Database Performance**: Query execution times
- **Redis Hit Rate**: Cache effectiveness
- **Job Queue Length**: Background job backlog
- **Email Delivery Rate**: Email success percentage
- **User Registration Rate**: New user signup trends
- **Active Sessions**: Current user session count

### Alert Thresholds
- Response time > 5 seconds (Warning)
- Response time > 10 seconds (Critical)  
- Error rate > 5% (Warning)
- Error rate > 10% (Critical)
- Database connection failures (Critical)
- Redis connection failures (Warning)
- Job queue length > 100 (Warning)
- Email delivery rate < 95% (Warning)

### Sample Alert Configuration
```yaml
# Example Datadog/New Relic alert
alerts:
  - name: "High Error Rate"
    condition: "error_rate > 0.05"
    evaluation_period: "5m"
    notification:
      - email: "alerts@yourdomain.com"
      - slack: "#alerts"
      
  - name: "Database Connection Failure" 
    condition: "database.connection.failures > 0"
    evaluation_period: "1m"
    severity: "critical"
    notification:
      - pagerduty: "database-team"
```

---

## 🔄 Backup & Disaster Recovery

### Database Backup Strategy
- **Automated Backups**: Daily Supabase automatic backups
- **Point-in-Time Recovery**: 7-day recovery window
- **Manual Snapshots**: Before major deployments
- **Cross-Region Replication**: For disaster recovery

### Application Backup
- **Code Repository**: Git with multiple remotes
- **Environment Configuration**: Secured backup of env vars
- **Media Files**: If storing files, backup to separate storage
- **SSL Certificates**: Backup of custom certificates

### Recovery Procedures
1. **Database Recovery**: Restore from Supabase backup
2. **Application Recovery**: Deploy from last known good commit
3. **Configuration Recovery**: Restore environment variables
4. **Verification**: Run health checks and smoke tests

---

## 🔒 Security Hardening

### Application Security
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (content security policy)
- [ ] CSRF protection (SameSite cookies)
- [ ] Rate limiting on authentication endpoints
- [ ] Session management with secure cookies
- [ ] Password hashing with bcrypt (12+ rounds)
- [ ] JWT token expiration and refresh

### Infrastructure Security  
- [ ] HTTPS only (HSTS headers)
- [ ] Security headers (X-Frame-Options, etc.)
- [ ] Regular dependency updates
- [ ] Vulnerability scanning in CI/CD
- [ ] Secrets management (not in environment)
- [ ] Network security (VPC if applicable)
- [ ] Access logging and monitoring
- [ ] Regular security audits

---

This production deployment guide provides a comprehensive checklist and step-by-step instructions for deploying the Fisher Backflows enterprise backend to production with proper security, monitoring, and reliability measures in place.