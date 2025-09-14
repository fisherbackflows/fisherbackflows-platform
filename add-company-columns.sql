-- Add missing columns to companies table
-- This will be executed in Supabase SQL Editor

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS slug VARCHAR(100),
ADD COLUMN IF NOT EXISTS subdomain VARCHAR(50),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS website VARCHAR(255),
ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255),
ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(50),
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS country VARCHAR(50) DEFAULT 'US',
ADD COLUMN IF NOT EXISTS business_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS license_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS certification_level VARCHAR(50),
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'starter',
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{"reports": true, "scheduling": true, "billing": false}',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255);

-- Add constraints
ALTER TABLE companies
ADD CONSTRAINT IF NOT EXISTS companies_name_check CHECK (LENGTH(name) >= 2),
ADD CONSTRAINT IF NOT EXISTS companies_slug_check CHECK (slug IS NULL OR slug ~ '^[a-z0-9-]+$'),
ADD CONSTRAINT IF NOT EXISTS companies_subdomain_check CHECK (subdomain IS NULL OR subdomain ~ '^[a-z0-9-]+$');

-- Make slug unique
CREATE UNIQUE INDEX IF NOT EXISTS companies_slug_unique ON companies(slug);
CREATE UNIQUE INDEX IF NOT EXISTS companies_subdomain_unique ON companies(subdomain);

-- Add NOT NULL to essential columns
ALTER TABLE companies
ALTER COLUMN name SET NOT NULL;

-- Update existing records to have valid slug values
UPDATE companies
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL AND name IS NOT NULL;

-- Set email as NOT NULL after adding it
-- (We'll do this in a separate step after adding data)