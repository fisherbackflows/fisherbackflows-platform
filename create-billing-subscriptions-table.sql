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