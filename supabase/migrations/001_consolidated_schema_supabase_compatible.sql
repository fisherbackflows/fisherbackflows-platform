-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations table (multi-tenant base)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    subscription_status VARCHAR DEFAULT 'trial',
    subscription_expires_at DATE,
    api_key VARCHAR UNIQUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a default organization for Fisher Backflows
INSERT INTO organizations (id, name, subscription_status)
VALUES ('11111111-1111-1111-1111-111111111111', 'Fisher Backflows', 'active')
ON CONFLICT (id) DO NOTHING;

-- Team users table (replaces auth.users for internal users)
-- This works with Supabase Auth but stores additional data
CREATE TABLE IF NOT EXISTS team_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE, -- Links to Supabase auth.users
    email VARCHAR UNIQUE NOT NULL,
    role VARCHAR NOT NULL DEFAULT 'technician' CHECK (role IN ('admin', 'technician', 'office')),
    first_name VARCHAR,
    last_name VARCHAR,
    phone VARCHAR,
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers (public-facing users)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_number VARCHAR UNIQUE NOT NULL,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    email VARCHAR,
    phone VARCHAR,
    address_line1 VARCHAR,
    address_line2 VARCHAR,
    city VARCHAR,
    state VARCHAR,
    zip_code VARCHAR,
    balance DECIMAL(10,2) DEFAULT 0.00,
    next_test_date DATE,
    account_status VARCHAR DEFAULT 'active',
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_by UUID REFERENCES team_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Devices (depends on customers and organizations)
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    serial_number VARCHAR NOT NULL,
    location VARCHAR NOT NULL,
    device_type VARCHAR NOT NULL,
    manufacturer VARCHAR,
    model VARCHAR,
    size VARCHAR,
    installation_date DATE,
    last_test_date DATE,
    next_test_due DATE,
    status VARCHAR DEFAULT 'active',
    compliance_status VARCHAR DEFAULT 'pending',
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test Reports
CREATE TABLE IF NOT EXISTS test_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id),
    customer_id UUID REFERENCES customers(id),
    test_date DATE NOT NULL,
    result VARCHAR NOT NULL CHECK (result IN ('Passed', 'Failed', 'Pending')),
    pressure_1 DECIMAL(10,2),
    pressure_2 DECIMAL(10,2),
    pressure_differential DECIMAL(10,2),
    test_duration INTEGER,
    technician_id UUID REFERENCES team_users(id),
    certificate_number VARCHAR UNIQUE,
    notes TEXT,
    device_location VARCHAR,
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    scheduled_date DATE NOT NULL,
    time_slot VARCHAR,
    service_type VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'scheduled',
    technician_id UUID REFERENCES team_users(id),
    notes TEXT,
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    invoice_number VARCHAR UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR DEFAULT 'pending',
    due_date DATE,
    description TEXT,
    invoice_date DATE DEFAULT CURRENT_DATE,
    paid_date DATE,
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id),
    customer_id UUID REFERENCES customers(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR,
    payment_date DATE DEFAULT CURRENT_DATE,
    transaction_id VARCHAR,
    status VARCHAR DEFAULT 'completed',
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Billing Subscriptions
CREATE TABLE IF NOT EXISTS billing_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    plan_name VARCHAR NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    billing_cycle VARCHAR DEFAULT 'monthly',
    status VARCHAR DEFAULT 'active',
    next_billing_date DATE,
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Billing Invoices (Stripe invoices)
CREATE TABLE IF NOT EXISTS billing_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES billing_subscriptions(id),
    customer_id UUID REFERENCES customers(id),
    stripe_invoice_id VARCHAR UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR DEFAULT 'pending',
    due_date DATE,
    paid_date DATE,
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Water Districts
CREATE TABLE IF NOT EXISTS water_districts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    email VARCHAR,
    phone VARCHAR,
    submission_email VARCHAR,
    submission_format VARCHAR DEFAULT 'pdf',
    requirements JSONB DEFAULT '{}',
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Water Department Submissions
CREATE TABLE IF NOT EXISTS water_department_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_report_id UUID REFERENCES test_reports(id),
    district_id UUID REFERENCES water_districts(id),
    submission_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR DEFAULT 'pending',
    confirmation_number VARCHAR,
    notes TEXT,
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR NOT NULL,
    resource_type VARCHAR,
    resource_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address VARCHAR,
    user_agent TEXT,
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Logs
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR NOT NULL,
    user_id UUID,
    ip_address VARCHAR,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_department_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for service role access
-- These allow the service role (backend) to access all data

CREATE POLICY "Service role has full access to organizations" ON organizations
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to team_users" ON team_users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to customers" ON customers
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to devices" ON devices
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to test_reports" ON test_reports
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to appointments" ON appointments
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to invoices" ON invoices
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to invoice_line_items" ON invoice_line_items
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to payments" ON payments
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to billing_subscriptions" ON billing_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to billing_invoices" ON billing_invoices
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to water_districts" ON water_districts
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to water_department_submissions" ON water_department_submissions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to audit_logs" ON audit_logs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to security_logs" ON security_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_customers_organization ON customers(organization_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_devices_customer ON devices(customer_id);
CREATE INDEX idx_devices_organization ON devices(organization_id);
CREATE INDEX idx_test_reports_device ON test_reports(device_id);
CREATE INDEX idx_test_reports_customer ON test_reports(customer_id);
CREATE INDEX idx_test_reports_date ON test_reports(test_date);
CREATE INDEX idx_appointments_customer ON appointments(customer_id);
CREATE INDEX idx_appointments_date ON appointments(scheduled_date);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_users_updated_at BEFORE UPDATE ON team_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_reports_updated_at BEFORE UPDATE ON test_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_subscriptions_updated_at BEFORE UPDATE ON billing_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_water_districts_updated_at BEFORE UPDATE ON water_districts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();