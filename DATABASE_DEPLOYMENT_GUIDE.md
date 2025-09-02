# Database Deployment Guide - Fisher Backflows Platform

## 🚨 CRITICAL: Execute These Scripts in Supabase SQL Editor

The following database tables are **required** for the new business systems to function:

### ⚡ **IMMEDIATE PRIORITY: Water Districts System**

**Purpose**: Legal compliance - automated submission of test reports to water districts

**Script**: `create-water-districts-table.sql`

**Copy and paste this into Supabase SQL Editor:**

```sql
-- Create water_districts table for managing water district submissions
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS water_districts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    address TEXT,
    submission_requirements TEXT DEFAULT 'Annual backflow test reports required',
    submission_format VARCHAR(20) DEFAULT 'pdf' CHECK (submission_format IN ('pdf', 'excel', 'csv', 'api')),
    submission_method VARCHAR(20) DEFAULT 'email' CHECK (submission_method IN ('email', 'api', 'portal', 'fax')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index on name for active districts
CREATE UNIQUE INDEX IF NOT EXISTS idx_water_districts_name_active 
ON water_districts (name) WHERE is_active = true;

-- Create index on contact_email
CREATE INDEX IF NOT EXISTS idx_water_districts_email 
ON water_districts (contact_email);

-- Insert some common California water districts as examples
INSERT INTO water_districts (name, contact_email, contact_phone, address, submission_requirements) VALUES
('Los Angeles Department of Water and Power', 'backflow@ladwp.com', '(213) 367-4211', 'Los Angeles, CA', 'Annual backflow prevention device testing required. Submit form and test results within 30 days of testing.'),
('San Diego County Water Authority', 'backflow@sdcwa.org', '(858) 522-6600', 'San Diego, CA', 'Annual testing required for all backflow prevention devices. Reports due by December 31st each year.'),
('Orange County Water District', 'compliance@ocwd.com', '(714) 378-3200', 'Orange County, CA', 'Backflow device testing and reporting as per local ordinance requirements.'),
('Riverside Public Utilities', 'backflow@riversideca.gov', '(951) 826-5485', 'Riverside, CA', 'Annual backflow prevention device testing and submission of test results required.'),
('Sacramento County Water Agency', 'backflow@sacramento.gov', '(916) 874-6851', 'Sacramento, CA', 'Submit backflow test reports within 10 days of testing completion.')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE water_districts ENABLE ROW LEVEL SECURITY;

-- Create policy for team users to view water districts
CREATE POLICY "Team users can view water districts" ON water_districts
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM team_users 
            WHERE team_users.id = auth.uid() 
            AND team_users.is_active = true
        )
    );

-- Create policy for admins to manage water districts
CREATE POLICY "Admins can manage water districts" ON water_districts
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM team_users 
            WHERE team_users.id = auth.uid() 
            AND team_users.role = 'admin' 
            AND team_users.is_active = true
        )
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_water_districts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_water_districts_updated_at
    BEFORE UPDATE ON water_districts
    FOR EACH ROW
    EXECUTE FUNCTION update_water_districts_updated_at();
```

### 💰 **HIGH PRIORITY: Billing Subscriptions System**

**Purpose**: Revenue automation - Stripe recurring billing for annual services

**Script**: `create-billing-subscriptions-table.sql`

**Copy and paste this into Supabase SQL Editor:**

```sql
-- Create billing_subscriptions table for Stripe recurring billing
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS billing_subscriptions (
    id VARCHAR(255) PRIMARY KEY, -- Stripe subscription ID
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255) NOT NULL,
    service_type VARCHAR(50) DEFAULT 'annual_testing' CHECK (
        service_type IN ('annual_testing', 'quarterly_testing', 'repair_maintenance', 'custom')
    ),
    billing_cycle VARCHAR(20) DEFAULT 'yearly' CHECK (
        billing_cycle IN ('monthly', 'quarterly', 'yearly')
    ),
    device_ids UUID[] DEFAULT '{}', -- Array of device IDs covered by subscription
    status VARCHAR(30) DEFAULT 'active' CHECK (
        status IN ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'paused', 'trialing', 'unpaid', 'cancel_at_period_end')
    ),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    amount_per_period INTEGER NOT NULL, -- Amount in cents
    currency VARCHAR(3) DEFAULT 'usd',
    is_active BOOLEAN DEFAULT true,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMPTZ,
    next_billing_date TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_customer_id 
ON billing_subscriptions (customer_id);

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_stripe_subscription_id 
ON billing_subscriptions (stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_status 
ON billing_subscriptions (status);

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_active 
ON billing_subscriptions (is_active);

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_next_billing 
ON billing_subscriptions (next_billing_date) WHERE is_active = true;

-- Create billing_invoices table for invoice tracking
CREATE TABLE IF NOT EXISTS billing_invoices (
    id VARCHAR(255) PRIMARY KEY, -- Stripe invoice ID
    subscription_id VARCHAR(255) REFERENCES billing_subscriptions(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    stripe_invoice_id VARCHAR(255) UNIQUE NOT NULL,
    amount_paid INTEGER DEFAULT 0, -- Amount in cents
    amount_due INTEGER DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(30) DEFAULT 'draft' CHECK (
        status IN ('draft', 'open', 'paid', 'void', 'uncollectible')
    ),
    invoice_pdf VARCHAR(500), -- URL to Stripe invoice PDF
    hosted_invoice_url VARCHAR(500), -- URL to Stripe hosted invoice page
    payment_intent_id VARCHAR(255),
    billing_period_start TIMESTAMPTZ,
    billing_period_end TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for billing_invoices
CREATE INDEX IF NOT EXISTS idx_billing_invoices_subscription_id 
ON billing_invoices (subscription_id);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_customer_id 
ON billing_invoices (customer_id);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_status 
ON billing_invoices (status);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_due_date 
ON billing_invoices (due_date) WHERE status IN ('open', 'draft');

-- Enable RLS (Row Level Security)
ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for team users to view/manage billing
CREATE POLICY "Team users can view billing subscriptions" ON billing_subscriptions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM team_users 
            WHERE team_users.id = auth.uid() 
            AND team_users.is_active = true
        )
    );

CREATE POLICY "Admins can manage billing subscriptions" ON billing_subscriptions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM team_users 
            WHERE team_users.id = auth.uid() 
            AND team_users.role = 'admin' 
            AND team_users.is_active = true
        )
    );

CREATE POLICY "Team users can view billing invoices" ON billing_invoices
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM team_users 
            WHERE team_users.id = auth.uid() 
            AND team_users.is_active = true
        )
    );

CREATE POLICY "Admins can manage billing invoices" ON billing_invoices
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM team_users 
            WHERE team_users.id = auth.uid() 
            AND team_users.role = 'admin' 
            AND team_users.is_active = true
        )
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_billing_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_billing_subscriptions_updated_at
    BEFORE UPDATE ON billing_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_billing_subscriptions_updated_at();

CREATE OR REPLACE FUNCTION update_billing_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_billing_invoices_updated_at
    BEFORE UPDATE ON billing_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_billing_invoices_updated_at();

-- Add stripe_customer_id to customers table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'stripe_customer_id'
    ) THEN
        ALTER TABLE customers ADD COLUMN stripe_customer_id VARCHAR(255);
        CREATE INDEX idx_customers_stripe_customer_id ON customers (stripe_customer_id);
    END IF;
END $$;
```

## 📊 **VERIFICATION QUERIES**

After running both scripts, verify installation with:

```sql
-- Check water_districts table
SELECT COUNT(*) as water_districts_count FROM water_districts;

-- Check billing_subscriptions table
SELECT COUNT(*) as billing_subscriptions_count FROM billing_subscriptions;

-- Check billing_invoices table
SELECT COUNT(*) as billing_invoices_count FROM billing_invoices;

-- Verify sample water districts were inserted
SELECT name, contact_email FROM water_districts ORDER BY name;
```

## 🚀 **API ENDPOINTS THAT WILL WORK AFTER DEPLOYMENT**

### Water Districts System:
- `GET /api/water-districts` - List all water districts
- `POST /api/water-districts` - Create new district (admin only)
- `GET /api/test-reports/submit-district?testReportId=xxx` - Check submission status
- `POST /api/test-reports/submit-district` - Submit test report to district

### Billing System:
- `GET /api/billing/subscriptions` - List subscriptions
- `POST /api/billing/subscriptions` - Create subscription (admin only)
- `GET /api/billing/subscriptions/[id]` - Get subscription details
- `PUT /api/billing/subscriptions/[id]` - Update subscription (pause/resume/modify)
- `DELETE /api/billing/subscriptions/[id]` - Cancel subscription

### Data Management:
- `GET /api/data/export?type=customers&format=csv` - Export customer data
- `POST /api/data/import` - Import customer/device/appointment data

## 🎯 **BUSINESS IMPACT AFTER DEPLOYMENT**

1. **Legal Compliance**: Automated district submissions ensure regulatory compliance
2. **Revenue Automation**: Recurring billing generates $85-$250 per device annually
3. **Operational Efficiency**: Bulk data operations eliminate manual entry
4. **Service Quality**: Automatic technician assignment prevents missed appointments

---

**Status**: Database schemas ready for deployment. Execute scripts above to complete implementation.