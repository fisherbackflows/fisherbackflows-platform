# Production Deployment Guide - Fisher Backflows

## 🚨 Critical Production Setup Required

### 1. Email Configuration (Resend)

#### Current Issue
- Code expects: `noreply@mail.fisherbackflows.com`
- ENV may still be using a development sender like `onboarding@resend.dev`
- Do NOT commit or paste API keys into this repo

#### Required Actions

1. **Update `.env.local` file:**
   ```bash
   RESEND_FROM_EMAIL=noreply@fisherbackflows.com
   ```

2. **Verify Domain in Resend Dashboard:**
   - Go to: https://resend.com/domains
   - Click "Add Domain"
   - Enter: `fisherbackflows.com` or `mail.fisherbackflows.com`
   - Add these DNS records to your domain provider:
     - They'll provide specific TXT, MX, and CNAME records
     - Wait for verification (usually 5-30 minutes)

3. **Update the email sender in code if needed:**
   - File: `/src/lib/resend.ts` (line 12)
   - Current: `from = 'Fisher Backflows <noreply@mail.fisherbackflows.com>'`
   - Change if using different domain

### 2. Environment Variables for Production

Add these to your hosting platform (Vercel, Railway, etc.). Never commit secrets to the repo:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# App Configuration (Required)
NEXT_PUBLIC_APP_URL=https://fisherbackflows.com

# Resend Email (Required)
RESEND_API_KEY=YOUR_RESEND_API_KEY
RESEND_FROM_EMAIL=noreply@fisherbackflows.com  # Update after domain verification

# Stripe (Optional - Update with real keys when ready)
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

### 3. Database Setup (Already Complete)

✅ Customer feedback table has been created with this SQL:

```sql
CREATE TABLE IF NOT EXISTS customer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  feedback_type VARCHAR(50) NOT NULL,
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  responses JSONB,
  additional_comments TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'normal',
  tags TEXT[],
  follow_up_required BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_customer_feedback_customer_id ON customer_feedback(customer_id);
CREATE INDEX idx_customer_feedback_appointment_id ON customer_feedback(appointment_id);
CREATE INDEX idx_customer_feedback_created_at ON customer_feedback(created_at DESC);
CREATE INDEX idx_customer_feedback_status ON customer_feedback(status);
```

### 4. Deployment Steps

#### For Vercel:
1. Push code to GitHub
2. Import project in Vercel
3. Add all environment variables above (Project Settings → Environment Variables)
4. In Project Settings → General, ensure Node.js runtime for Next.js Route Handlers
5. Clear build cache (Deployments → Redeploy → Clear cache & Redeploy)
6. Deploy

7. Optional: Auto production auth check
   - In GitHub → Settings → Secrets and variables → Actions → Secrets: add `ADMIN_SEED_KEY` (same as Vercel Production)
   - Optional: In GitHub → Settings → Secrets and variables → Actions → Variables: add `PROD_URL=https://fisherbackflows.com`
   - Three ways to run checks:
     - Manual: "Production Auth Check" (workflow_dispatch)
     - Auto: "Production Auth Check (Auto)" (runs on push to main and daily)
     - On Deploy: "Production Auth Check (On Deploy)" (runs automatically when a GitHub Deployment succeeds)
   - Ensure Vercel → Git Integration → “GitHub Deployments” is enabled so GitHub receives deployment_status events with environment_url.

8. Optional: Auto-merge CI automation PRs
   - Actions → General:
     - Allow all actions and reusable workflows
     - Workflow permissions: Read and write permissions
     - (Optional) Allow GitHub Actions to create and approve PRs
   - Workflows:
     - `ci-auto-pr.yml`: opens/updates PR `chore/ci-auto-updates` after CI success (if there are changes)
     - `auto-merge.yml`: auto-merges PRs labeled `automerge` after checks pass
   - To enable zero-click merges: turn on Auto-merge in repo settings and/or rely on the auto-merge workflow above.

#### For Other Platforms:
1. Build the project: `npm run build`
2. Set environment variables
3. Start production server: `npm start`

### 5. Post-Deployment Testing

Test these features after deployment:

- [ ] Customer Registration
  - Should create account
  - Should send verification email
  
- [ ] Email Verification
  - Click link in email
  - Should redirect and verify account
  
- [ ] Customer Login
  - Should authenticate successfully
  - Should redirect to dashboard

- [ ] Admin Seeded Test User (for quick E2E)
  - Endpoint: `POST /api/auth/seed-test-user`
  - Header: `x-admin-seed-key: <ADMIN_SEED_KEY>`
  - Body (optional): `{ "email": "user@example.com", "password": "TestPassword123!" }`
  - Response includes created/updated user, customer, and a session token
  
- [ ] Appointment Booking
  - Should show available dates
  - Should create appointment
  - Should send confirmation email
  
- [ ] Customer Feedback
  - Should submit feedback
  - Should store in database

### 6. Common Issues & Solutions

#### Issue: Emails not sending
- **Check**: Domain verified in Resend?
- **Check**: Correct FROM email in env vars?
- **Check**: API key is valid?

#### Issue: Database connection fails
- **Check**: Supabase keys in env vars?
- **Check**: Service role key included?

#### Issue: Login not working
- Check: Customer row exists for the auth user (`customers.auth_user_id = auth.users.id`)
- Check: Auth email is verified or admin-created with `email_confirm = true`
- Check: Service role key present for server-side lookups

#### Issue: "Invalid JSON in request body"
- Ensure client sends `Content-Type: application/json`
- Our API now also accepts `multipart/form-data` and `x-www-form-urlencoded` as fallback

#### Issue: Vercel deploying stale code or caching API routes
- Use Redeploy with “Clear cache & redeploy”
- Verify the active deployment URL matches the commit you expect
- Confirm no botched `.env.production` overrides (we ship it commented out)

### 7. Monitoring

After deployment, monitor:
- Vercel/hosting platform logs
- Supabase dashboard for database activity
- Resend dashboard for email delivery status

### 8. Security Checklist

- [x] No hardcoded secrets in code
- [x] All sensitive data in env variables
- [x] Database has RLS policies
- [x] Email verification required
- [ ] Update Stripe to live keys when ready
- [ ] Enable rate limiting in production

## Test Data from Development

### Test Customer Created
- Email: `testcustomer3_1757092392@example.com`
- Password: `TestPassword123!`
- Account: `FB1757092394218-tei9nf`
- Status: Verified and working

### Test Appointment Created
- ID: `e9c797c7-e3c3-44b1-8315-0fd53fce0a2c`
- Date: 2025-09-08
- Time: 10:00 AM
- Type: routine_testing

### Test Feedback Submitted
- ID: `fff9b15f-b55d-423a-9635-4d465f76bf86`
- Rating: 5/5
- Status: Working

---

**Last Updated**: 2025-09-05
**Tested On**: Local development (Termux/Android)
**Ready For**: Desktop deployment setup
#### Issue: Need a quick production test user
- Set `ADMIN_SEED_KEY` in your `.env.local` and Vercel Production env
- Call `POST /api/auth/seed-test-user` with header `x-admin-seed-key`
- Use returned credentials to test login
