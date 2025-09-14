-- Step-by-step Multi-tenant Schema Updates
-- Execute these one section at a time in Supabase Dashboard > SQL Editor

-- ================================
-- 1. ADD COMPANY_ID TO TEAM_USERS
-- ================================

-- Add company_id column to team_users
ALTER TABLE team_users
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Add invitation tracking columns
ALTER TABLE team_users
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES team_users(id),
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- Update role constraints
ALTER TABLE team_users
DROP CONSTRAINT IF EXISTS team_users_role_check;

ALTER TABLE team_users
ADD CONSTRAINT team_users_role_check
CHECK (role IN ('company_admin', 'manager', 'tester', 'scheduler', 'billing_admin', 'admin'));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_team_users_company_id ON team_users(company_id);

-- ================================
-- 2. CREATE USER_INVITATIONS TABLE
-- ================================

CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Invitation details
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'tester',
    permissions JSONB DEFAULT '{}',

    -- Invitation tracking
    invited_by UUID NOT NULL REFERENCES team_users(id),
    invitation_token VARCHAR(255) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),

    -- User details for when they accept
    first_name VARCHAR(100),
    last_name VARCHAR(100),

    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending',
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES team_users(id),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    UNIQUE(company_id, email),
    CONSTRAINT user_invitations_role_check
    CHECK (role IN ('company_admin', 'manager', 'tester', 'scheduler', 'billing_admin')),
    CONSTRAINT user_invitations_status_check
    CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'))
);

-- Indexes for user_invitations
CREATE INDEX IF NOT EXISTS idx_user_invitations_company_id ON user_invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);

-- ================================
-- 3. CREATE COMPANY_SETTINGS TABLE
-- ================================

CREATE TABLE IF NOT EXISTS company_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,

    -- Business settings
    default_test_price DECIMAL(10,2) DEFAULT 150.00,
    default_retest_price DECIMAL(10,2) DEFAULT 75.00,
    default_emergency_price DECIMAL(10,2) DEFAULT 250.00,

    -- Scheduling settings
    business_hours JSONB DEFAULT '{
        "monday": {"start": "08:00", "end": "17:00", "enabled": true},
        "tuesday": {"start": "08:00", "end": "17:00", "enabled": true},
        "wednesday": {"start": "08:00", "end": "17:00", "enabled": true},
        "thursday": {"start": "08:00", "end": "17:00", "enabled": true},
        "friday": {"start": "08:00", "end": "17:00", "enabled": true},
        "saturday": {"start": "08:00", "end": "12:00", "enabled": false},
        "sunday": {"start": "08:00", "end": "17:00", "enabled": false}
    }',
    timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',

    -- Notification settings
    email_notifications JSONB DEFAULT '{
        "appointment_reminders": true,
        "test_report_completed": true,
        "payment_received": true,
        "low_inventory": false
    }',

    -- Branding
    logo_url VARCHAR(500),
    primary_color VARCHAR(7) DEFAULT '#0ea5e9',
    company_tagline TEXT,

    -- Integration settings
    google_calendar_enabled BOOLEAN DEFAULT false,
    stripe_connected BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 4. ADD COMPANY_ID TO CORE TABLES
-- ================================

-- Add company_id to core business tables
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE test_reports ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_devices_company_id ON devices(company_id);
CREATE INDEX IF NOT EXISTS idx_appointments_company_id ON appointments(company_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_company_id ON test_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);

-- ================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ================================

-- Enable RLS on multi-tenant tables
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- ================================
-- 6. CREATE RLS POLICIES
-- ================================

-- Team users: Can only see users in their company
DROP POLICY IF EXISTS "Users can view team members in their company" ON team_users;
CREATE POLICY "Users can view team members in their company" ON team_users
    FOR SELECT USING (
        company_id = (
            SELECT company_id FROM team_users AS current_user
            WHERE current_user.email = auth.jwt() ->> 'email'
        )
    );

-- Only company admins can manage team users
DROP POLICY IF EXISTS "Company admins can manage team users" ON team_users;
CREATE POLICY "Company admins can manage team users" ON team_users
    FOR ALL USING (
        company_id = (
            SELECT t.company_id FROM team_users AS t
            WHERE t.email = auth.jwt() ->> 'email'
            AND t.role = 'company_admin'
        )
    );

-- User invitations: Company scoped
DROP POLICY IF EXISTS "Company users can view their invitations" ON user_invitations;
CREATE POLICY "Company users can view their invitations" ON user_invitations
    FOR SELECT USING (
        company_id = (
            SELECT company_id FROM team_users
            WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Only company admins can manage invitations
DROP POLICY IF EXISTS "Company admins can manage invitations" ON user_invitations;
CREATE POLICY "Company admins can manage invitations" ON user_invitations
    FOR ALL USING (
        company_id = (
            SELECT company_id FROM team_users
            WHERE email = auth.jwt() ->> 'email'
            AND role = 'company_admin'
        )
    );

-- Company settings: Company scoped
DROP POLICY IF EXISTS "Company users can view their settings" ON company_settings;
CREATE POLICY "Company users can view their settings" ON company_settings
    FOR SELECT USING (
        company_id = (
            SELECT company_id FROM team_users
            WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Only company admins can modify settings
DROP POLICY IF EXISTS "Company admins can manage settings" ON company_settings;
CREATE POLICY "Company admins can manage settings" ON company_settings
    FOR ALL USING (
        company_id = (
            SELECT company_id FROM team_users
            WHERE email = auth.jwt() ->> 'email'
            AND role = 'company_admin'
        )
    );

-- ================================
-- 7. CREATE UTILITY FUNCTIONS
-- ================================

-- Function to get user's company
CREATE OR REPLACE FUNCTION get_current_user_company_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT company_id
        FROM team_users
        WHERE email = auth.jwt() ->> 'email'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is company admin
CREATE OR REPLACE FUNCTION is_current_user_company_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_users
        WHERE email = auth.jwt() ->> 'email'
        AND role = 'company_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- 8. CREATE TRIGGERS
-- ================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_user_invitations_updated_at ON user_invitations;
CREATE TRIGGER update_user_invitations_updated_at
    BEFORE UPDATE ON user_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_settings_updated_at ON company_settings;
CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON company_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create company settings when company is created
CREATE OR REPLACE FUNCTION create_company_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO company_settings (company_id)
    VALUES (NEW.id)
    ON CONFLICT (company_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_company_settings_trigger ON companies;
CREATE TRIGGER create_company_settings_trigger
    AFTER INSERT ON companies
    FOR EACH ROW EXECUTE FUNCTION create_company_settings();

-- ================================
-- 9. INSERT DEFAULT COMPANY DATA
-- ================================

-- Get the existing Fisher Backflows company
DO $$
DECLARE
    fisher_company_id UUID;
BEGIN
    -- Get or create Fisher Backflows company
    SELECT id INTO fisher_company_id
    FROM companies
    WHERE slug = 'fisher-backflows'
    LIMIT 1;

    -- Update existing team_users to belong to Fisher Backflows company
    IF fisher_company_id IS NOT NULL THEN
        UPDATE team_users
        SET company_id = fisher_company_id
        WHERE company_id IS NULL;

        -- Update existing customers, devices, etc. to belong to Fisher Backflows
        UPDATE customers SET company_id = fisher_company_id WHERE company_id IS NULL;
        UPDATE devices SET company_id = fisher_company_id WHERE company_id IS NULL;
        UPDATE appointments SET company_id = fisher_company_id WHERE company_id IS NULL;
        UPDATE test_reports SET company_id = fisher_company_id WHERE company_id IS NULL;
        UPDATE invoices SET company_id = fisher_company_id WHERE company_id IS NULL;

        -- Create company settings if they don't exist
        INSERT INTO company_settings (company_id)
        VALUES (fisher_company_id)
        ON CONFLICT (company_id) DO NOTHING;

        RAISE NOTICE 'Updated existing data for Fisher Backflows company: %', fisher_company_id;
    ELSE
        RAISE NOTICE 'Fisher Backflows company not found';
    END IF;
END $$;