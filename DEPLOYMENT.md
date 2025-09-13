# Fisher Backflows Platform - Deployment & Testing Guide

## Overview

This document provides comprehensive instructions for deploying and testing the Fisher Backflows Platform enterprise backend system. The platform includes multi-tenant SaaS architecture, comprehensive validation, background job processing, email automation, and real-time health monitoring.

## Architecture Summary

### Core Components
- **Next.js 15** - Full-stack framework with App Router
- **Supabase** - PostgreSQL database with Row Level Security (RLS)
- **Redis (Upstash)** - Caching and session management
- **QStash (Upstash)** - Background job queue processing
- **Resend** - Email service integration
- **Vercel** - Production deployment platform

### Key Features
- Multi-tenant organization isolation
- Role-based access control (admin, manager, inspector, technician, coordinator, viewer)
- Comprehensive data validation with Zod schemas
- Background job processing with retry logic
- Email automation with webhook handling
- PDF generation for reports
- Real-time health monitoring
- Comprehensive logging and audit trails

## Prerequisites

### Required Environment Variables

Create `.env.local` with the following variables:

```bash
# Core Application
NEXT_PUBLIC_APP_URL=https://fisherbackflows.com
NODE_ENV=production

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://jvhbqfueutvfepsjmztx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Redis Cache (Upstash)
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Background Jobs (QStash)
QSTASH_TOKEN=your_qstash_token
QSTASH_CURRENT_SIGNING_KEY=your_current_signing_key
QSTASH_NEXT_SIGNING_KEY=your_next_signing_key

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@fisherbackflows.com

# Payment Processing (Stripe)
STRIPE_SECRET_KEY=sk_live_or_test_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_or_test_key
STRIPE_WEBHOOK_SECRET=whsec_webhook_secret

# Cache Configuration
CACHE_TTL_SHORT=60
CACHE_TTL_MEDIUM=300
CACHE_TTL_LONG=3600
CACHE_TTL_DAY=86400

# Logging
LOG_LEVEL=info
```

## Deployment Steps

### 1. Pre-Deployment Verification

```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Run linting
npm run lint

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Build application
npm run build
```

### 2. Database Setup

```bash
# Apply RLS policies
npm run rls:apply

# Verify RLS status
npm run rls:status

# Setup test database (for staging)
npm run db:setup:test
```

### 3. Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... (add all required environment variables)

# Deploy to staging
vercel

# Deploy to production
vercel --prod
```

### 4. Post-Deployment Verification

```bash
# Run health checks
curl https://fisherbackflows.com/api/health
curl https://fisherbackflows.com/api/health/database
curl https://fisherbackflows.com/api/health/services

# Run smoke tests
npm run test:smoke

# Verify production authentication
npm run prod:auth:check
```

## Testing Strategy

### Test Types and Commands

```bash
# Unit Tests - Fast, isolated component testing
npm run test:unit

# Integration Tests - Full component integration testing
npm run test:integration

# End-to-End Tests - Complete user workflow testing
npm run test:e2e

# Smoke Tests - Quick production verification
npm run test:smoke

# Health Check - System status verification
npm run test:health

# Performance Tests - Cache and load testing
npm run test:cache
npm run test:cache:load

# Complete test suite
npm run test

# Test with coverage reporting
npm run test:coverage
```

### Test Environment Setup

#### Integration Tests
Integration tests require database access and mock external services:

```bash
# Set test environment variables
export NODE_ENV=test
export NEXT_PUBLIC_SUPABASE_URL=your_test_db_url
export SUPABASE_SERVICE_ROLE_KEY=your_test_service_key

# Run integration tests
npm run test:integration
```

#### End-to-End Tests
E2E tests use Playwright to test complete user workflows:

```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npx playwright test --ui

# Generate test report
npx playwright show-report
```

## Health Monitoring

### Health Check Endpoints

The platform includes comprehensive health monitoring:

- **Main Health Check**: `/api/health`
  - Overall system status
  - All service checks
  - Performance metrics
  - Memory usage

- **Database Health**: `/api/health/database`
  - Database connectivity
  - Table accessibility
  - Query performance
  - RLS policy status

- **Services Health**: `/api/health/services`
  - Redis connectivity
  - QStash API status
  - Resend API status
  - Stripe API status

### Health Check Response Format

```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "uptime": 3600000,
  "checks": [
    {
      "service": "database",
      "status": "healthy",
      "responseTime": 45,
      "details": {
        "connected": true,
        "queryExecuted": true
      }
    }
  ],
  "summary": {
    "total": 5,
    "healthy": 4,
    "degraded": 1,
    "unhealthy": 0
  }
}
```

### Monitoring Setup

1. **Uptime Monitoring**: Configure external monitoring service to check `/api/health`
2. **Alerting**: Set up alerts for HTTP 503 responses from health checks
3. **Logging**: Monitor application logs for health check failures
4. **Performance**: Track health check response times

## Security Checklist

### Database Security
- [ ] Row Level Security (RLS) policies enabled
- [ ] Service role key properly secured
- [ ] Database backups configured
- [ ] SSL connections enforced

### API Security
- [ ] Authentication required for all protected endpoints
- [ ] Rate limiting configured
- [ ] Input validation with Zod schemas
- [ ] Audit logging enabled

### Infrastructure Security
- [ ] Environment variables secured in Vercel
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Webhook signature verification enabled

## Troubleshooting

### Common Issues

#### Database Connection Failures
```bash
# Check database health
curl https://fisherbackflows.com/api/health/database

# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Test RLS policies
npm run rls:check
```

#### Redis/Cache Issues
```bash
# Check Redis health
curl https://fisherbackflows.com/api/health/services

# Test cache performance
npm run test:cache

# Clear cache if needed
# (Use Redis CLI or dashboard)
```

#### Email Delivery Issues
```bash
# Check Resend status
curl https://fisherbackflows.com/api/health/services

# Verify webhook endpoints
curl -X POST https://fisherbackflows.com/api/webhooks/resend \
  -H "Content-Type: application/json" \
  -d '{"type": "email.delivered"}'
```

#### Background Job Processing
```bash
# Check QStash status
curl https://fisherbackflows.com/api/health/services

# Monitor job queue
# (Use QStash dashboard)

# Test job processing
curl -X POST https://fisherbackflows.com/api/jobs/test-job \
  -H "Content-Type: application/json" \
  -d '{"type": "test"}'
```

### Performance Optimization

#### Database Optimization
- Monitor slow queries in Supabase dashboard
- Optimize indexes for frequently queried columns
- Use connection pooling for high traffic

#### Cache Optimization
- Monitor Redis memory usage
- Implement cache warming for critical data
- Use appropriate TTL values for different data types

#### Application Optimization
- Monitor memory usage with health checks
- Use Next.js performance features (Image optimization, etc.)
- Implement proper error boundaries

## Maintenance

### Regular Tasks
- [ ] Monitor health check status daily
- [ ] Review application logs weekly
- [ ] Update dependencies monthly
- [ ] Backup database regularly
- [ ] Rotate API keys quarterly

### Performance Review
- [ ] Analyze health check response times
- [ ] Review cache hit rates
- [ ] Monitor database query performance
- [ ] Check memory usage trends

### Security Review
- [ ] Review audit logs
- [ ] Check for security advisories
- [ ] Update security patches
- [ ] Review access controls

## Support

### Documentation
- API Documentation: `/docs/api`
- Component Documentation: `/docs/components`
- Database Schema: See Supabase dashboard

### Monitoring
- Application Logs: Vercel dashboard
- Database Monitoring: Supabase dashboard
- Cache Monitoring: Upstash dashboard
- Job Queue: QStash dashboard
- Email Analytics: Resend dashboard

### Contact
- Technical Issues: Create GitHub issue
- Security Issues: security@fisherbackflows.com
- General Support: support@fisherbackflows.com

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Platform**: Next.js 15 + Supabase + Upstash + Resend + Vercel