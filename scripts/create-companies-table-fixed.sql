-- FIXED: Create companies table for testing company registration
-- This table is required for the company registration flow to work

CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  website VARCHAR(255),

  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),

  -- Business details
  business_type VARCHAR(50) DEFAULT 'testing_service',
  license_number VARCHAR(100),
  certification_level VARCHAR(50),

  -- Plan and billing
  plan_type VARCHAR(20) DEFAULT 'professional',
  max_users INTEGER DEFAULT 15,
  status VARCHAR(20) DEFAULT 'trial',
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  subscription_id VARCHAR(255),

  -- Features JSON
  features JSONB DEFAULT '{}',

  -- Company settings
  settings JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies table
CREATE POLICY "Company users can view their own company"
ON companies FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT company_id FROM team_users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Company admins can update their company"
ON companies FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT company_id FROM team_users
    WHERE auth_user_id = auth.uid()
    AND (role = 'company_admin' OR role = 'admin')
  )
)
WITH CHECK (
  id IN (
    SELECT company_id FROM team_users
    WHERE auth_user_id = auth.uid()
    AND (role = 'company_admin' OR role = 'admin')
  )
);

-- Service role can manage all companies
CREATE POLICY "Service role can manage all companies"
ON companies FOR ALL
TO service_role
USING (true);

-- Add company_id to team_users if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_users' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE team_users ADD COLUMN company_id UUID REFERENCES companies(id);
  END IF;
END $$;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at_trigger
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_companies_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(email);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_team_users_company_id ON team_users(company_id);

-- Insert sample company data for testing ONLY if table is empty
DO $$
BEGIN
  -- Check if companies table is empty
  IF NOT EXISTS (SELECT 1 FROM companies LIMIT 1) THEN
    INSERT INTO companies (
      name, slug, email, phone, plan_type, status, max_users
    ) VALUES (
      'Fisher Backflows LLC',
      'fisher-backflows',
      'admin@fisherbackflows.com',
      '(253) 278-8692',
      'enterprise',
      'active',
      100
    );
    RAISE NOTICE 'Inserted sample Fisher Backflows company data';
  ELSE
    RAISE NOTICE 'Companies table already has data, skipping sample insert';
  END IF;
END $$;