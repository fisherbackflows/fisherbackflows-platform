-- CRITICAL SECURITY FIX: Replace dangerous "Allow all" policies
-- This file contains the proper Row Level Security implementation

-- First, drop the dangerous policies that allow unrestricted access
DROP POLICY IF EXISTS "Allow all operations on customers" ON customers;
DROP POLICY IF EXISTS "Allow all operations on devices" ON devices;
DROP POLICY IF EXISTS "Allow all operations on test_reports" ON test_reports;
DROP POLICY IF EXISTS "Allow all operations on invoices" ON invoices;
DROP POLICY IF EXISTS "Allow all operations on appointments" ON appointments;

-- Create auth schema and users table for proper authentication
CREATE SCHEMA IF NOT EXISTS auth;

-- Create users table with proper roles
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR UNIQUE NOT NULL,
    encrypted_password VARCHAR NOT NULL,
    role VARCHAR NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'technician', 'admin')),
    organization_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email_confirmed BOOLEAN DEFAULT FALSE,
    last_sign_in_at TIMESTAMP WITH TIME ZONE
);

-- Create organization table for multi-tenancy
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    domain VARCHAR UNIQUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add organization_id to existing tables for proper isolation
ALTER TABLE customers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);  
ALTER TABLE test_reports ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add user_id columns for ownership tracking
ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE test_reports ADD COLUMN IF NOT EXISTS technician_id UUID REFERENCES auth.users(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);

-- Create audit log table for security tracking
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES auth.users(id),
    user_email VARCHAR,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to get current user info
CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        (current_setting('request.jwt.claims', true)::json->>'user_id')::uuid,
        (current_setting('app.current_user_id', true))::uuid
    );
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION current_user_role() RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        current_setting('request.jwt.claims', true)::json->>'role',
        current_setting('app.current_user_role', true),
        'anonymous'
    );
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION current_organization_id() RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        (current_setting('request.jwt.claims', true)::json->>'organization_id')::uuid,
        (current_setting('app.current_organization_id', true))::uuid
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- SECURE ROW LEVEL SECURITY POLICIES

-- Customers table policies
CREATE POLICY "customers_select" ON customers FOR SELECT
    USING (
        current_user_role() = 'admin' OR
        (organization_id = current_organization_id() AND current_user_role() IN ('technician', 'customer'))
    );

CREATE POLICY "customers_insert" ON customers FOR INSERT
    WITH CHECK (
        current_user_role() IN ('admin', 'technician') AND
        organization_id = current_organization_id()
    );

CREATE POLICY "customers_update" ON customers FOR UPDATE
    USING (
        current_user_role() = 'admin' OR
        (organization_id = current_organization_id() AND current_user_role() = 'technician')
    );

CREATE POLICY "customers_delete" ON customers FOR DELETE
    USING (current_user_role() = 'admin');

-- Devices table policies
CREATE POLICY "devices_select" ON devices FOR SELECT
    USING (
        current_user_role() = 'admin' OR
        (organization_id = current_organization_id() AND current_user_role() IN ('technician', 'customer'))
    );

CREATE POLICY "devices_insert" ON devices FOR INSERT
    WITH CHECK (
        current_user_role() IN ('admin', 'technician') AND
        organization_id = current_organization_id()
    );

CREATE POLICY "devices_update" ON devices FOR UPDATE
    USING (
        current_user_role() = 'admin' OR
        (organization_id = current_organization_id() AND current_user_role() = 'technician')
    );

CREATE POLICY "devices_delete" ON devices FOR DELETE
    USING (current_user_role() = 'admin');

-- Test reports table policies  
CREATE POLICY "test_reports_select" ON test_reports FOR SELECT
    USING (
        current_user_role() = 'admin' OR
        (organization_id = current_organization_id() AND current_user_role() IN ('technician', 'customer'))
    );

CREATE POLICY "test_reports_insert" ON test_reports FOR INSERT
    WITH CHECK (
        current_user_role() IN ('admin', 'technician') AND
        organization_id = current_organization_id()
    );

CREATE POLICY "test_reports_update" ON test_reports FOR UPDATE
    USING (
        current_user_role() = 'admin' OR
        (organization_id = current_organization_id() AND current_user_role() = 'technician')
    );

CREATE POLICY "test_reports_delete" ON test_reports FOR DELETE
    USING (current_user_role() = 'admin');

-- Invoices table policies
CREATE POLICY "invoices_select" ON invoices FOR SELECT
    USING (
        current_user_role() = 'admin' OR
        (organization_id = current_organization_id() AND current_user_role() IN ('technician', 'customer'))
    );

CREATE POLICY "invoices_insert" ON invoices FOR INSERT
    WITH CHECK (
        current_user_role() IN ('admin', 'technician') AND
        organization_id = current_organization_id()
    );

CREATE POLICY "invoices_update" ON invoices FOR UPDATE
    USING (
        current_user_role() = 'admin' OR
        (organization_id = current_organization_id() AND current_user_role() = 'technician')
    );

CREATE POLICY "invoices_delete" ON invoices FOR DELETE
    USING (current_user_role() = 'admin');

-- Appointments table policies
CREATE POLICY "appointments_select" ON appointments FOR SELECT
    USING (
        current_user_role() = 'admin' OR
        (organization_id = current_organization_id() AND current_user_role() IN ('technician', 'customer'))
    );

CREATE POLICY "appointments_insert" ON appointments FOR INSERT
    WITH CHECK (
        current_user_role() IN ('admin', 'technician') AND
        organization_id = current_organization_id()
    );

CREATE POLICY "appointments_update" ON appointments FOR UPDATE
    USING (
        current_user_role() = 'admin' OR
        (organization_id = current_organization_id() AND current_user_role() = 'technician')
    );

CREATE POLICY "appointments_delete" ON appointments FOR DELETE
    USING (current_user_role() = 'admin');

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_values, user_id, user_email)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW), current_user_id(), current_setting('app.current_user_email', true));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id, user_email)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), current_user_id(), current_setting('app.current_user_email', true));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, user_id, user_email)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), current_user_id(), current_setting('app.current_user_email', true));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add audit triggers to all tables
CREATE TRIGGER customers_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON customers FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER devices_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON devices FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER test_reports_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON test_reports FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER invoices_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON invoices FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER appointments_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON appointments FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Create default organization
INSERT INTO organizations (id, name, domain) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Fisher Backflows', 'fisherbackflows.com')
ON CONFLICT DO NOTHING;

-- Update existing data with organization_id
UPDATE customers SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE devices SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE test_reports SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE invoices SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE appointments SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_organization_id ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_devices_organization_id ON devices(organization_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_organization_id ON test_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_appointments_organization_id ON appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;
GRANT ALL ON audit_logs TO authenticated;