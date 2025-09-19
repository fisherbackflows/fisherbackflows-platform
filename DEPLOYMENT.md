# Fisher Backflows Platform v3 - Deployment Guide

## Overview
This document outlines the clean deployment setup for Fisher Backflows Platform v3 from `/fisherbackflows3` to the production domain `fisherbackflows.com`.

## Deployment Configuration

### Vercel Project Setup
- **Project Name**: `fisherbackflows-platform-v2`
- **Organization**: `fisherbackflows-projects`
- **Production Domain**: `fisherbackflows.com`
- **WWW Domain**: `www.fisherbackflows.com`

### Configuration Files
- `vercel.json` - Vercel deployment configuration
- `.vercel/project.json` - Project linking (auto-generated, not committed)
- `package.json` - Updated with deployment scripts

## Available Commands

### Quick Commands
```bash
# Check deployment status and configuration
npm run deploy:status

# Deploy to preview environment (for testing)
npm run deploy:preview

# Deploy to production (fisherbackflows.com)
npm run deploy:production

# Re-link to correct Vercel project (if needed)
npm run deploy:link
```

### Manual Commands
```bash
# Link to correct project manually
npx vercel link --project=fisherbackflows-platform-v2 --scope=fisherbackflows-projects --yes

# Deploy to preview
npx vercel

# Deploy to production
npx vercel --prod

# Check deployments
npx vercel ls

# Check domain status
npx vercel domains ls
```

## Deployment Process

### For Preview Deployments (Testing)
1. Run `npm run deploy:status` to verify configuration
2. Run `npm run deploy:preview`
3. The script will:
   - Verify project linking
   - Run TypeScript type checking
   - Run linting
   - Test production build
   - Deploy to Vercel preview environment

### For Production Deployments
1. Run `npm run deploy:status` to verify configuration
2. Run `npm run deploy:production`
3. The script will:
   - Verify project linking to `fisherbackflows-platform-v2`
   - Run all pre-deployment checks
   - Deploy to production (`fisherbackflows.com`)

## Pre-deployment Checks

All deployments automatically run these checks:
- TypeScript type checking (`npm run type-check`)
- ESLint linting (`npm run lint`)
- Production build test (`npm run build`)

If any check fails, deployment is aborted.

## Domain Configuration

The domain `fisherbackflows.com` is configured to:
- Point to the `fisherbackflows-platform-v2` Vercel project
- Serve both `fisherbackflows.com` and `www.fisherbackflows.com`
- Use Vercel's edge network for optimal performance

**Note**: DNS is currently managed by Porkbun. For full Vercel DNS management, nameservers should be updated to:
- `ns1.vercel-dns.com`
- `ns2.vercel-dns.com`

## Environment Variables

Ensure these are configured in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL=https://fisherbackflows.com`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Troubleshooting

### Project Not Linked
If you see "Project not linked" error:
```bash
npm run deploy:link
```

### Wrong Project Linked
If linked to wrong project:
```bash
npm run deploy:link
```

### Build Failures
Check the specific error and ensure:
- All dependencies are installed (`npm install`)
- Environment variables are configured
- TypeScript types are correct
- No linting errors

### Domain Issues
Verify domain configuration:
```bash
npx vercel domains inspect fisherbackflows.com
```

## Project Structure

```
/fisherbackflows3/
├── vercel.json                 # Vercel configuration
├── .vercel/                    # Auto-generated project link (gitignored)
├── scripts/
│   ├── deploy.sh              # Main deployment script
│   ├── deploy-link.sh         # Project linking script
│   └── deploy-status.sh       # Status checking script
└── package.json               # Updated with deployment commands
```

## Security Notes

- The `.vercel` directory is gitignored as it contains sensitive project IDs
- Environment variables contain sensitive API keys and should never be committed
- Production deployments require proper authentication with Vercel

## Success Indicators

A successful setup shows:
- ✅ Project correctly linked to `fisherbackflows-platform-v2`
- ✅ Domain `fisherbackflows.com` configured correctly
- ✅ All configuration files present
- ✅ Deployment scripts functional

Run `npm run deploy:status` to verify all indicators are green.