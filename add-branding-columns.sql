-- Add branding columns to company_settings table
-- Safe to run multiple times with IF NOT EXISTS

ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#0ea5e9',
ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7) DEFAULT '#1e293b',
ADD COLUMN IF NOT EXISTS company_tagline TEXT,
ADD COLUMN IF NOT EXISTS show_branding BOOLEAN DEFAULT true;