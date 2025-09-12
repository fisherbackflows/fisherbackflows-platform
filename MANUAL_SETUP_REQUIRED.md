# Manual Setup Required - Backflow Buddy API

## ⚠️ CRITICAL: Two Manual Actions Required for API to Work

### 1. DATABASE MIGRATION - MUST BE DONE FIRST
**Status:** ❌ NOT EXECUTED - API authentication will not work until this is done

**Steps to Execute:**
1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx/sql/new
   - Login with your Supabase account

2. **Copy Migration SQL**
   - Open file: `/supabase/migrations/20250111_api_system_setup_modified.sql`
   - Select ALL content (Ctrl+A) and copy (Ctrl+C)

3. **Execute in SQL Editor**
   - Paste the entire SQL into the editor
   - Click "Run" button (or press F5)
   - Wait for execution to complete (should take ~5-10 seconds)

4. **Verify Success**
   Run this verification query:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name IN ('companies', 'api_keys', 'api_usage_logs', 'webhook_endpoints');
   ```
   
   **Expected Result:** Should return 4 rows with table names

5. **Test Functions**
   ```sql
   SELECT generate_api_key() as test_key;
   ```
   
   **Expected Result:** Should return a key starting with 'bbapi_'

**What This Creates:**
- `companies` table - For multi-tenant support
- `api_keys` table - For API authentication
- `api_usage_logs` table - For tracking API usage
- `webhook_endpoints` table - For webhook configuration
- `webhook_deliveries` table - For webhook delivery tracking
- `api_rate_limits` table - For rate limiting
- All necessary functions and RLS policies

---

### 2. STRIPE WEBHOOK CONFIGURATION
**Status:** ❌ NOT CONFIGURED - Billing events won't be received

**Steps to Configure:**

1. **Go to Stripe Dashboard**
   - URL: https://dashboard.stripe.com/webhooks
   - Login with your Stripe account

2. **Add New Endpoint**
   - Click "Add endpoint" button
   - Choose "Add endpoint" (not "Test in local environment")

3. **Configure Endpoint**
   - **Endpoint URL:** `https://fisherbackflows.com/api/backflowbuddy/webhooks/stripe`
   - **Description:** Backflow Buddy API webhook endpoint
   - **Events to listen for:** Click "Select events" and choose:
     - `customer.subscription.trial_will_end`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
     - `invoice.payment_succeeded`
     - `customer.subscription.updated`
   - Click "Add endpoint"

4. **Copy Webhook Signing Secret**
   - After creation, click on the webhook endpoint
   - Find "Signing secret" section
   - Click "Reveal" and copy the secret (starts with `whsec_`)

5. **Add to Environment Variables**
   - Open `.env.local` file
   - Add/update: `STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE`
   - Save the file

6. **Restart Development Server** (if running locally)
   ```bash
   npm run dev
   ```

**What This Enables:**
- Automatic trial ending notifications
- Payment failure alerts
- Subscription status updates
- Invoice payment tracking
- Customer churn handling

---

## ✅ What IS Working Now

1. **Email System** ✅ COMPLETE
   - Endpoint: `/api/email/send`
   - Templates: customer_welcome, payment_failed, trial_ending, backflowbuddy_welcome
   - Supports: Resend integration, attachments, template variables

2. **PDF Generation** ✅ COMPLETE
   - Endpoint: `/api/reports/generate-pdf`
   - Creates professional test report PDFs
   - Includes all test data, customer info, device details

3. **API Endpoints** ✅ COMPLETE
   - `/api/v1/customers` - Customer management
   - `/api/v1/appointments` - Appointment scheduling
   - `/api/v1/devices` - Device tracking
   - `/api/v1/reports` - Test report management
   - `/api/v1/invoices` - Invoice generation

4. **Webhook System** ✅ CODE COMPLETE (needs Stripe config)
   - Endpoint built at `/api/backflowbuddy/webhooks/stripe`
   - Handles all subscription lifecycle events
   - Signature verification implemented

---

## 🔍 How to Test After Setup

### Test Database Migration:
```bash
# Run this curl command (replace YOUR_API_KEY with actual key)
curl -X GET "https://fisherbackflows.com/api/v1/customers" \
  -H "x-api-key: YOUR_API_KEY"
```
**Expected:** Should return customer list or empty array (not authentication error)

### Test Stripe Webhooks:
1. In Stripe Dashboard, go to your webhook endpoint
2. Click "Send test webhook"
3. Select any event type
4. Click "Send test webhook"
5. Check webhook logs in Stripe Dashboard

---

## 📝 Environment Variables Checklist

Ensure ALL of these are set in `.env.local`:

```bash
# Supabase (✅ Should already be set)
NEXT_PUBLIC_SUPABASE_URL=https://jvhbqfueutvfepsjmztx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (⚠️ Add webhook secret after configuration)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... # ADD THIS AFTER WEBHOOK SETUP

# Email (✅ Should already be set)
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=onboarding@resend.dev

# App URL (✅ Should already be set)
NEXT_PUBLIC_APP_URL=https://fisherbackflows.com
```

---

## 🚨 Common Issues & Solutions

### "Invalid API key" error
- **Cause:** Database migration not executed
- **Solution:** Complete step 1 above

### Webhooks not receiving events
- **Cause:** Webhook not configured in Stripe
- **Solution:** Complete step 2 above

### Email sending fails
- **Cause:** Missing RESEND_API_KEY
- **Solution:** Check environment variables

### PDF generation fails
- **Cause:** Report ID doesn't exist in database
- **Solution:** Ensure valid report ID is passed

---

## 📞 Need Help?

If you encounter issues:
1. Check Supabase logs: Dashboard → Logs → API
2. Check Stripe webhook logs: Dashboard → Webhooks → Click endpoint → Webhook attempts
3. Check Vercel logs: Dashboard → Functions → View logs

**Last Updated:** January 11, 2025
**Status:** 2 manual actions required, all code complete