# Fisher Backflows Complete Setup Guide

## 🚀 Quick Start (15 minutes to working system)

### Step 1: Environment Setup (5 minutes)

1. **Copy environment template:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Edit `.env.local`** with your actual credentials:
   ```bash
   nano .env.local
   ```

### Step 2: Supabase Setup (5 minutes)

1. **Create Supabase Project:**
   - Go to https://supabase.com/dashboard
   - Click "New Project"
   - Choose a name: "fisher-backflows"
   - Choose a password and region

2. **Get API Keys:**
   - In your project, go to Settings → API
   - Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy "anon/public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy "service_role" key → `SUPABASE_SERVICE_ROLE_KEY`

3. **Create Database Schema:**
   - Go to SQL Editor in Supabase
   - Copy the contents of `supabase-schema.sql`
   - Paste and run the query

### Step 3: Test the System (5 minutes)

```bash
npm run dev
```

Visit http://localhost:3010 and test:
- ✅ API endpoints work
- ✅ Database connections established
- ✅ Sample data loads

## 🔧 Full Setup (Complete Automation)

### Gmail Setup (Real Email Automation)

1. **Enable 2-Step Verification:**
   - Go to Google Account settings
   - Security → 2-Step Verification

2. **Create App Password:**
   - Security → App passwords
   - Select "Mail" and generate password
   - Add to `.env.local`:
   ```env
   GMAIL_USER=fisherbackflows@gmail.com
   GMAIL_APP_PASSWORD=your-16-digit-password
   ```

### Stripe Setup (Real Payment Processing)

1. **Create Stripe Account:**
   - Go to https://stripe.com
   - Create business account

2. **Get API Keys:**
   - Dashboard → Developers → API keys
   - Copy test keys to `.env.local`:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

3. **Setup Webhook:**
   - Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/automation/payments`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy signing secret → `STRIPE_WEBHOOK_SECRET`

### Google Calendar Setup (Smart Booking)

1. **Create Google Cloud Project:**
   - Go to https://console.cloud.google.com
   - Create new project

2. **Enable Calendar API:**
   - APIs & Services → Library
   - Search "Google Calendar API" → Enable

3. **Create OAuth Credentials:**
   - APIs & Services → Credentials
   - Create OAuth 2.0 Client ID
   - Add credentials to `.env.local`

## 🧪 Testing Your Setup

### Database Test
```bash
curl http://localhost:3010/api/appointments
```
**Expected:** JSON response with appointments (even if empty array)

### Email Test
```bash
curl -X POST http://localhost:3010/api/automation/email \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "data": {"customerEmail": "test@example.com"}}'
```
**Expected:** Success response or detailed error message

### Payment Test
```bash
curl -X POST http://localhost:3010/api/automation/payments \
  -H "Content-Type: application/json" \
  -d '{"action": "create_payment_link", "invoiceId": "1", "amount": 150}'
```
**Expected:** Payment link created (mock or real Stripe)

## 📊 Sample Data Creation

Run this SQL in Supabase SQL Editor to create test data:

```sql
-- Insert sample customer
INSERT INTO customers (account_number, name, email, phone, address, next_test_date) VALUES 
('FB001', 'John Smith', 'john.smith@email.com', '(253) 555-0123', '123 Main St, Tacoma, WA 98401', '2025-12-15');

-- Get the customer ID (replace with actual ID from above insert)
-- Insert sample device
INSERT INTO devices (customer_id, location, serial_number, size, make, model, install_date, last_test_date, next_test_date) VALUES 
((SELECT id FROM customers WHERE account_number = 'FB001'), '123 Main St - Backyard', 'BF-2024-001', '3/4"', 'Watts', 'Series 909', '2023-01-15', '2024-01-15', '2025-01-15');

-- Insert sample appointment
INSERT INTO appointments (customer_id, service_type, appointment_date, appointment_time, status, device_location, technician, device_id) VALUES 
((SELECT id FROM customers WHERE account_number = 'FB001'), 'Annual Test', '2025-01-20', '10:00', 'Scheduled', '123 Main St - Backyard', 'Mike Fisher', (SELECT id FROM devices WHERE serial_number = 'BF-2024-001'));
```

## ✅ Success Checklist

- [ ] Supabase project created and configured
- [ ] Database schema created
- [ ] Sample data inserted
- [ ] API endpoints responding (test with curl)
- [ ] Gmail configured (optional but recommended)
- [ ] Stripe configured (optional but recommended)
- [ ] Field app loads appointment data
- [ ] Email automation sends test emails
- [ ] Payment links generate successfully

## 🎯 You're Done When...

1. **Field App Works:** `/field/test/[appointmentId]` loads real appointment
2. **Emails Send:** Test completion triggers real email
3. **Payments Process:** Invoice generates payment link
4. **Data Flows:** Complete automation workflow functions

**Time Investment:** 30-60 minutes for fully functional system
**Business Value:** Complete automation platform ready for production