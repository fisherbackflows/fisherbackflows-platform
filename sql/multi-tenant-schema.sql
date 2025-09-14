-- Multi-Tenant Company Schema for Fisher Backflows Platform
-- This creates the foundation for companies to manage their own employees and data

-- ================================
-- 1. COMPANIES TABLE
-- ================================
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Basic company info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- for URLs: acme-plumbing
    subdomain VARCHAR(50) UNIQUE, -- for acme.fisherbackflows.com

    -- Contact information
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    website VARCHAR(255),

    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'US',

    -- Business details
    business_type VARCHAR(100), -- 'plumbing', 'testing_service', 'municipal'
    license_number VARCHAR(100),
    certification_level VARCHAR(50), -- 'basic', 'advanced', 'master'

    -- Platform settings
    plan_type VARCHAR(50) DEFAULT 'starter', -- 'starter', 'professional', 'enterprise'
    max_users INTEGER DEFAULT 5,
    features JSONB DEFAULT '{"reports": true, "scheduling": true, "billing": false}',

    -- Status and metadata
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'trial', 'cancelled'
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    subscription_id VARCHAR(255), -- Stripe subscription ID

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT companies_name_check CHECK (LENGTH(name) >= 2),
    CONSTRAINT companies_slug_check CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT companies_subdomain_check CHECK (subdomain IS NULL OR subdomain ~ '^[a-z0-9-]+$')
);

-- ================================
-- 2. UPDATE TEAM_USERS FOR MULTI-TENANCY
-- ================================

-- First, add company_id to existing team_users table
ALTER TABLE team_users
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES team_users(id),
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- Update role column to include more roles
ALTER TABLE team_users
ALTER COLUMN role TYPE VARCHAR(50);

-- Add check constraint for valid roles
ALTER TABLE team_users
DROP CONSTRAINT IF EXISTS team_users_role_check,
ADD CONSTRAINT team_users_role_check
CHECK (role IN ('company_admin', 'manager', 'tester', 'scheduler', 'billing_admin'));

-- ================================
-- 3. USER INVITATIONS TABLE
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
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),

    -- User details for when they accept
    first_name VARCHAR(100),
    last_name VARCHAR(100),

    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'expired', 'cancelled'
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES team_users(id),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    UNIQUE(company_id, email), -- Can't invite same email twice to same company
    CONSTRAINT user_invitations_role_check
    CHECK (role IN ('company_admin', 'manager', 'tester', 'scheduler', 'billing_admin')),
    CONSTRAINT user_invitations_status_check
    CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'))
);

-- ================================
-- 4. COMPANY SETTINGS TABLE
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
-- 5. UPDATE EXISTING TABLES FOR MULTI-TENANCY
-- ================================

-- Add company_id to core business tables
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE test_reports ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- ================================
-- 6. INDEXES FOR PERFORMANCE
-- ================================

-- Company indexes
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_subdomain ON companies(subdomain);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);

-- Team users indexes
CREATE INDEX IF NOT EXISTS idx_team_users_company_id ON team_users(company_id);
CREATE INDEX IF NOT EXISTS idx_team_users_role ON team_users(role);
CREATE INDEX IF NOT EXISTS idx_team_users_email_company ON team_users(email, company_id);

-- Invitation indexes
CREATE INDEX IF NOT EXISTS idx_user_invitations_company_id ON user_invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);

-- Multi-tenant indexes for core tables
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_devices_company_id ON devices(company_id);
CREATE INDEX IF NOT EXISTS idx_appointments_company_id ON appointments(company_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_company_id ON test_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);

-- ================================
-- 7. ROW LEVEL SECURITY POLICIES
-- ================================

-- Enable RLS on all multi-tenant tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Companies: Users can only see their own company
CREATE POLICY "Users can view their own company" ON companies
    FOR SELECT USING (
        id IN (
            SELECT company_id FROM team_users
            WHERE team_users.id = auth.uid()::text::uuid
        )
    );

-- Team users: Can only see users in their company
CREATE POLICY "Users can view team members in their company" ON team_users
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM team_users
            WHERE team_users.id = auth.uid()::text::uuid
        )
    );

-- Only company admins can manage team users
CREATE POLICY "Company admins can manage team users" ON team_users
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM team_users
            WHERE team_users.id = auth.uid()::text::uuid
            AND role = 'company_admin'
        )
    );

-- User invitations: Company scoped
CREATE POLICY "Company users can view their invitations" ON user_invitations
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM team_users
            WHERE team_users.id = auth.uid()::text::uuid
        )
    );

-- Only company admins can manage invitations
CREATE POLICY "Company admins can manage invitations" ON user_invitations
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM team_users
            WHERE team_users.id = auth.uid()::text::uuid
            AND role = 'company_admin'
        )
    );

-- Company settings: Company scoped
CREATE POLICY "Company users can view their settings" ON company_settings
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM team_users
            WHERE team_users.id = auth.uid()::text::uuid
        )
    );

-- Only company admins can modify settings
CREATE POLICY "Company admins can manage settings" ON company_settings
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM team_users
            WHERE team_users.id = auth.uid()::text::uuid
            AND role = 'company_admin'
        )
    );

-- ================================
-- 8. TRIGGERS FOR AUTOMATION
-- ================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_invitations_updated_at
    BEFORE UPDATE ON user_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON company_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create company settings when company is created
CREATE OR REPLACE FUNCTION create_company_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO company_settings (company_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_company_settings_trigger
    AFTER INSERT ON companies
    FOR EACH ROW EXECUTE FUNCTION create_company_settings();

-- Generate unique slug from company name if not provided
CREATE OR REPLACE FUNCTION generate_company_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
        NEW.slug := TRIM(BOTH '-' FROM NEW.slug);

        -- Ensure uniqueness
        WHILE EXISTS (SELECT 1 FROM companies WHERE slug = NEW.slug AND id != NEW.id) LOOP
            NEW.slug := NEW.slug || '-' || EXTRACT(EPOCH FROM NOW())::TEXT;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_company_slug_trigger
    BEFORE INSERT OR UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION generate_company_slug();

-- ================================
-- 9. UTILITY FUNCTIONS
-- ================================

-- Function to get user's company
CREATE OR REPLACE FUNCTION get_user_company_id(user_uuid UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT company_id
        FROM team_users
        WHERE id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is company admin
CREATE OR REPLACE FUNCTION is_company_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_users
        WHERE id = user_uuid
        AND role = 'company_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- 10. SAMPLE DATA (Optional)
-- ================================

-- Insert a sample company
INSERT INTO companies (
    name,
    slug,
    email,
    business_type,
    plan_type
) VALUES (
    'Fisher Backflows',
    'fisher-backflows',
    'admin@fisherbackflows.com',
    'testing_service',
    'professional'
) ON CONFLICT (slug) DO NOTHING;