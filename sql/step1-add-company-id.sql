-- Step 1: Add company_id to team_users
-- Execute this first in Supabase SQL Editor

-- Add company_id column to team_users
ALTER TABLE team_users
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Add invitation tracking columns
ALTER TABLE team_users
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES team_users(id),
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- Update role constraints to include more roles
ALTER TABLE team_users
DROP CONSTRAINT IF EXISTS team_users_role_check;

ALTER TABLE team_users
ADD CONSTRAINT team_users_role_check
CHECK (role IN ('company_admin', 'manager', 'tester', 'scheduler', 'billing_admin', 'admin'));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_team_users_company_id ON team_users(company_id);