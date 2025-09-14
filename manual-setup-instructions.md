# Manual Database Setup Required

The companies table exists but is missing required columns for the multi-tenant system. Please execute the following SQL in your Supabase SQL Editor:

## Step 1: Go to Supabase SQL Editor

1. Open: https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx/sql
2. Copy and paste the SQL below
3. Click "Run" to execute

## Step 2: Add Missing Columns

```sql
-- Add missing columns to companies table
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
DROP CONSTRAINT IF EXISTS companies_name_check,
DROP CONSTRAINT IF EXISTS companies_slug_check,
DROP CONSTRAINT IF EXISTS companies_subdomain_check;

ALTER TABLE companies
ADD CONSTRAINT companies_name_check CHECK (LENGTH(name) >= 2),
ADD CONSTRAINT companies_slug_check CHECK (slug IS NULL OR slug ~ '^[a-z0-9-]+$'),
ADD CONSTRAINT companies_subdomain_check CHECK (subdomain IS NULL OR subdomain ~ '^[a-z0-9-]+$');

-- Make slug unique
CREATE UNIQUE INDEX IF NOT EXISTS companies_slug_unique ON companies(slug);
CREATE UNIQUE INDEX IF NOT EXISTS companies_subdomain_unique ON companies(subdomain);

-- Update existing records to have valid slug values
UPDATE companies
SET slug = LOWER(REGEXP_REPLACE(TRIM(name), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE (slug IS NULL OR slug = '') AND name IS NOT NULL AND TRIM(name) != '';

-- Clean up any double dashes in slugs
UPDATE companies
SET slug = REGEXP_REPLACE(slug, '-+', '-', 'g')
WHERE slug IS NOT NULL;

-- Remove leading/trailing dashes
UPDATE companies
SET slug = TRIM(BOTH '-' FROM slug)
WHERE slug IS NOT NULL;
```

## Step 3: Verify Setup

After running the SQL, execute this verification script:

```bash
node check-company-columns.js
```

If successful, the multi-tenant system will be ready for testing!

## Next Steps

Once the SQL is executed successfully:
1. The company registration API will work
2. Employee management system will be functional
3. Role-based navigation will be active

## Troubleshooting

If you encounter any errors:
1. Check that you have the necessary permissions
2. Ensure the SQL is copied exactly as shown
3. Run each section separately if needed
4. Contact support if issues persist