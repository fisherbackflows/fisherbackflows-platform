-- Backflow Buddy Multi-Tenant Setup
-- Transform into a SaaS platform for multiple backflow testing companies

-- 1. Create companies table for multi-tenancy
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'trialing',
  subscription_plan TEXT DEFAULT 'starter',
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
  settings JSONB DEFAULT '{}',
  features JSONB DEFAULT '{"max_users": 5, "max_customers": 100, "max_devices": 500}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add company_id to existing tables
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE team_users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE test_reports ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- 3. Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  features JSONB,
  limits JSONB,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Insert default subscription plans for Backflow Buddy
INSERT INTO subscription_plans (id, name, description, price_monthly, price_yearly, features, limits) VALUES
('starter', 'Starter', 'Perfect for small backflow testing companies', 99, 990, 
  '{"users": 5, "customers": 100, "devices": 500, "reports": "unlimited", "support": "email"}',
  '{"max_users": 5, "max_customers": 100, "max_devices": 500}'),
('professional', 'Professional', 'For growing backflow testing businesses', 299, 2990,
  '{"users": 20, "customers": 1000, "devices": 5000, "reports": "unlimited", "support": "priority", "api_access": true}',
  '{"max_users": 20, "max_customers": 1000, "max_devices": 5000}'),
('enterprise', 'Enterprise', 'For large-scale operations', 799, 7990,
  '{"users": "unlimited", "customers": "unlimited", "devices": "unlimited", "reports": "unlimited", "support": "dedicated", "api_access": true, "white_label": true}',
  '{"max_users": 999999, "max_customers": 999999, "max_devices": 999999}')
ON CONFLICT (id) DO NOTHING;

-- 5. Create company invitations table
CREATE TABLE IF NOT EXISTS company_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'technician',
  token VARCHAR(255) UNIQUE NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create usage tracking table
CREATE TABLE IF NOT EXISTS company_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  users_count INTEGER DEFAULT 0,
  customers_count INTEGER DEFAULT 0,
  devices_count INTEGER DEFAULT 0,
  tests_completed INTEGER DEFAULT 0,
  invoices_sent INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, month)
);

-- 7. RLS Policies for new tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_usage ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "companies_owner_all" ON companies
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR id IN (
    SELECT company_id FROM team_users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "companies_public_read" ON companies
  FOR SELECT TO authenticated
  USING (true);

-- Subscription plans - public read
CREATE POLICY "plans_public_read" ON subscription_plans
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Company invitations
CREATE POLICY "invitations_company_manage" ON company_invitations
  FOR ALL TO authenticated
  USING (company_id IN (
    SELECT company_id FROM team_users 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  ));

-- Usage tracking
CREATE POLICY "usage_company_read" ON company_usage
  FOR SELECT TO authenticated
  USING (company_id IN (
    SELECT company_id FROM team_users WHERE auth_user_id = auth.uid()
  ));

-- 8. Create Fisher Backflows as the first company
INSERT INTO companies (name, slug, subscription_status, subscription_plan) 
VALUES ('Fisher Backflows', 'fisher-backflows', 'active', 'professional')
ON CONFLICT (slug) DO NOTHING;

-- 9. Update existing data to belong to Fisher Backflows
UPDATE customers SET company_id = (SELECT id FROM companies WHERE slug = 'fisher-backflows') WHERE company_id IS NULL;
UPDATE team_users SET company_id = (SELECT id FROM companies WHERE slug = 'fisher-backflows') WHERE company_id IS NULL;
UPDATE devices SET company_id = (SELECT id FROM companies WHERE slug = 'fisher-backflows') WHERE company_id IS NULL;
UPDATE appointments SET company_id = (SELECT id FROM companies WHERE slug = 'fisher-backflows') WHERE company_id IS NULL;
UPDATE test_reports SET company_id = (SELECT id FROM companies WHERE slug = 'fisher-backflows') WHERE company_id IS NULL;
UPDATE invoices SET company_id = (SELECT id FROM companies WHERE slug = 'fisher-backflows') WHERE company_id IS NULL;