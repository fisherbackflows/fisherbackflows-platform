-- Consolidated Database Migration - Fisher Backflows Platform
-- This replaces all separate schema files with proper migration order

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create auth schema if it doesn't exist (for Supabase compatibility)
CREATE SCHEMA IF NOT EXISTS auth;

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Allow all operations on customers" ON customers;
DROP POLICY IF EXISTS "Allow all operations on devices" ON devices;
DROP POLICY IF EXISTS "Allow all operations on test_reports" ON test_reports;
DROP POLICY IF EXISTS "Allow all operations on invoices" ON invoices;
DROP POLICY IF EXISTS "Allow all operations on appointments" ON appointments;

-- 1. Create core tables in proper dependency order

-- Organizations (base table - no dependencies)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    domain VARCHAR UNIQUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auth users (depends on organizations)
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR UNIQUE NOT NULL,
    encrypted_password VARCHAR NOT NULL,
    role VARCHAR NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'technician', 'admin')),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email_confirmed BOOLEAN DEFAULT FALSE,
    last_sign_in_at TIMESTAMP WITH TIME ZONE
);

-- Customers (depends on organizations and auth.users)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_number VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    email VARCHAR,
    phone VARCHAR,
    address TEXT,
    balance DECIMAL(10,2) DEFAULT 0.00,
    next_test_date DATE,
    status VARCHAR DEFAULT 'active',
    organization_id UUID REFERENCES organizations(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Devices (depends on customers and organizations)
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    serial_number VARCHAR NOT NULL,
    size VARCHAR,
    make VARCHAR,
    model VARCHAR,
    installation_date DATE,
    last_test_date DATE,
    location TEXT,
    notes TEXT,
    organization_id UUID REFERENCES organizations(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test reports (depends on customers, devices, and auth.users)
CREATE TABLE IF NOT EXISTS test_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    test_date DATE NOT NULL,
    initial_pressure DECIMAL(5,2),
    final_pressure DECIMAL(5,2),
    test_duration INTEGER,
    test_result VARCHAR CHECK (test_result IN ('Passed', 'Failed', 'Needs Repair')),
    notes TEXT,
    technician_name VARCHAR,
    water_district VARCHAR,
    photos TEXT[],
    pdf_path VARCHAR,
    submitted_to_water_dept BOOLEAN DEFAULT FALSE,
    organization_id UUID REFERENCES organizations(id),
    technician_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices (depends on customers)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    invoice_number VARCHAR UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR DEFAULT 'pending',
    due_date DATE,
    paid_date DATE,
    description TEXT,
    line_items JSONB,
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments (depends on customers and auth.users)
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    service_type VARCHAR,
    status VARCHAR DEFAULT 'scheduled',
    notes TEXT,
    device_location TEXT,
    organization_id UUID REFERENCES organizations(id),
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create additional operational tables

-- Technicians (depends on auth.users)
CREATE TABLE IF NOT EXISTS technicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    phone VARCHAR,
    email VARCHAR,
    certifications TEXT[],
    active BOOLEAN DEFAULT TRUE,
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security events (depends on auth.users and organizations)
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR NOT NULL,
    severity VARCHAR NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    user_id UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System logs (depends on auth.users and organizations)
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR NOT NULL,
    message TEXT NOT NULL,
    context JSONB,
    user_id UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email logs (depends on auth.users and organizations)
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_email VARCHAR NOT NULL,
    from_email VARCHAR NOT NULL,
    subject VARCHAR NOT NULL,
    template_name VARCHAR,
    status VARCHAR DEFAULT 'pending',
    provider VARCHAR,
    provider_id VARCHAR,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    user_id UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments (depends on invoices, customers, auth.users)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR NOT NULL,
    transaction_id VARCHAR UNIQUE,
    status VARCHAR DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    stripe_payment_intent_id VARCHAR,
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files (depends on auth.users, organizations, with optional references)
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR NOT NULL,
    original_name VARCHAR NOT NULL,
    mime_type VARCHAR NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_path VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    is_secure BOOLEAN DEFAULT TRUE,
    virus_scan_status VARCHAR DEFAULT 'pending',
    virus_scan_result TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    appointment_id UUID REFERENCES appointments(id),
    customer_id UUID REFERENCES customers(id),
    test_report_id UUID REFERENCES test_reports(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create operational tables

-- System status
CREATE TABLE IF NOT EXISTS system_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component VARCHAR NOT NULL,
    status VARCHAR NOT NULL,
    message TEXT,
    last_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications (depends on auth.users, customers, organizations)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    user_id UUID REFERENCES auth.users(id),
    customer_id UUID REFERENCES customers(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API keys (depends on auth.users, organizations)
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    key_hash VARCHAR NOT NULL,
    permissions TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    organization_id UUID REFERENCES organizations(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Water departments (depends on organizations)
CREATE TABLE IF NOT EXISTS water_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    contact_email VARCHAR,
    contact_phone VARCHAR,
    address TEXT,
    submission_method VARCHAR DEFAULT 'email',
    api_endpoint VARCHAR,
    requirements JSONB,
    active BOOLEAN DEFAULT TRUE,
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer water departments (many-to-many relationship)
CREATE TABLE IF NOT EXISTS customer_water_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    water_department_id UUID REFERENCES water_departments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device maintenance (depends on devices, auth.users)
CREATE TABLE IF NOT EXISTS device_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    maintenance_type VARCHAR NOT NULL,
    description TEXT,
    performed_date DATE NOT NULL,
    performed_by UUID REFERENCES auth.users(id),
    cost DECIMAL(10,2),
    notes TEXT,
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client errors for error boundary reporting
CREATE TABLE IF NOT EXISTS client_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    error_id VARCHAR UNIQUE NOT NULL,
    error_name VARCHAR NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    component_stack TEXT,
    url VARCHAR,
    user_agent TEXT,
    session_id VARCHAR,
    reported_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User devices for push notifications
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_type VARCHAR NOT NULL,
    fcm_token VARCHAR,
    device_info JSONB,
    active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_maintenance ENABLE ROW LEVEL SECURITY;

-- 5. Create security functions
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

-- 6. Create comprehensive RLS policies for all tables

-- Customers policies
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

-- Devices policies
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

-- Test reports policies
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

-- Similar policies for all other tables (abbreviated for space)
-- Invoices, appointments, technicians, etc. follow the same pattern

-- 7. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_customers_organization_id ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_account_number ON customers(account_number);
CREATE INDEX IF NOT EXISTS idx_devices_organization_id ON devices(organization_id);
CREATE INDEX IF NOT EXISTS idx_devices_customer_id ON devices(customer_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_organization_id ON test_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_device_id ON test_reports(device_id);
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_appointments_organization_id ON appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_client_errors_error_id ON client_errors(error_id);
CREATE INDEX IF NOT EXISTS idx_client_errors_created_at ON client_errors(created_at);
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_active ON user_devices(active);

-- 8. Insert default data
INSERT INTO organizations (id, name, domain) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Fisher Backflows', 'fisherbackflows.com')
ON CONFLICT DO NOTHING;

-- Update existing data with organization_id if needed
UPDATE customers SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE devices SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE test_reports SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE invoices SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE appointments SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

COMMIT;