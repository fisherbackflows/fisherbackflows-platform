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