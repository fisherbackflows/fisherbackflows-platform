-- Fisher Backflows Platform - Complete Consolidated Database Schema
-- This script creates all necessary tables and integrations in one go
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_crypto";

-- ====================
-- ORGANIZATIONS & SECURITY
-- ====================

-- Organizations table (multi-tenancy support)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default organization
INSERT INTO organizations (id, name, slug) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Fisher Backflows', 'fisher-backflows')
ON CONFLICT (slug) DO NOTHING;

-- Profiles table for user management (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('admin', 'technician', 'customer')),
    active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================
-- CORE BUSINESS TABLES
-- ====================

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
    account_number VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    next_test_date DATE,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Needs Service')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, account_number),
    UNIQUE(organization_id, email)
);

-- Devices Table
CREATE TABLE IF NOT EXISTS devices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    location TEXT NOT NULL,
    serial_number VARCHAR(100) NOT NULL,
    size VARCHAR(20) NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    install_date DATE NOT NULL,
    last_test_date DATE,
    next_test_date DATE,
    status VARCHAR(20) DEFAULT 'Passed' CHECK (status IN ('Passed', 'Failed', 'Needs Repair')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(serial_number)
);

-- Test Reports Table
CREATE TABLE IF NOT EXISTS test_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    test_date DATE NOT NULL,
    test_type VARCHAR(100) NOT NULL,
    initial_pressure DECIMAL(5,2) NOT NULL,
    final_pressure DECIMAL(5,2) NOT NULL,
    test_duration INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Passed', 'Failed', 'Needs Repair')),
    technician VARCHAR(255) NOT NULL,
    notes TEXT,
    water_district VARCHAR(255),
    submitted BOOLEAN DEFAULT FALSE,
    submitted_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Overdue', 'Cancelled')),
    services JSONB NOT NULL,
    notes TEXT,
    paid_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(invoice_number)
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id),
    service_type VARCHAR(100) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration INTEGER DEFAULT 60,
    status VARCHAR(20) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled')),
    device_location TEXT,
    notes TEXT,
    technician VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================
-- PAYMENT & FINANCIAL
-- ====================

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR NOT NULL,
    payment_intent_id VARCHAR,
    charge_id VARCHAR,
    status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')),
    failure_reason TEXT,
    receipt_url TEXT,
    refund_id VARCHAR,
    refunded_amount DECIMAL(10,2) DEFAULT 0,
    processing_fee DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2),
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================
-- COMMUNICATION & NOTIFICATIONS
-- ====================

-- Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    to_email VARCHAR NOT NULL,
    from_email VARCHAR NOT NULL,
    subject VARCHAR NOT NULL,
    template_name VARCHAR,
    status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    provider VARCHAR,
    provider_id VARCHAR,
    error_message TEXT,
    user_id UUID REFERENCES auth.users(id),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS Logs Table
CREATE TABLE IF NOT EXISTS sms_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    to_phone VARCHAR NOT NULL,
    from_phone VARCHAR NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'undelivered')),
    provider VARCHAR DEFAULT 'twilio',
    provider_id VARCHAR,
    error_message TEXT,
    user_id UUID REFERENCES auth.users(id),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Push Subscriptions Table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    keys JSONB NOT NULL,
    user_agent TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification Logs Table
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tracking_id VARCHAR NOT NULL UNIQUE,
    type VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    target_user_id UUID REFERENCES auth.users(id),
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ====================
-- FILE MANAGEMENT
-- ====================

-- Files Table
CREATE TABLE IF NOT EXISTS files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    filename VARCHAR NOT NULL,
    original_name VARCHAR NOT NULL,
    mime_type VARCHAR NOT NULL,
    size INTEGER NOT NULL,
    hash VARCHAR NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    category VARCHAR NOT NULL CHECK (category IN ('document', 'image', 'certificate', 'report', 'signature', 'photo')),
    is_public BOOLEAN DEFAULT FALSE,
    uploaded_by UUID REFERENCES auth.users(id),
    appointment_id UUID REFERENCES appointments(id),
    customer_id UUID REFERENCES customers(id),
    test_report_id UUID REFERENCES test_reports(id),
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================
-- MONITORING & LOGGING
-- ====================

-- System Logs Table
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    level VARCHAR NOT NULL CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')),
    message TEXT NOT NULL,
    component VARCHAR,
    user_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Events Table
CREATE TABLE IF NOT EXISTS security_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_type VARCHAR NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================
-- HELPER FUNCTIONS
-- ====================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Current user functions for RLS
CREATE OR REPLACE FUNCTION current_user_id() 
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        (SELECT role FROM profiles WHERE id = auth.uid()),
        'customer'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        (SELECT organization_id FROM profiles WHERE id = auth.uid()),
        '00000000-0000-0000-0000-000000000001'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================
-- TRIGGERS
-- ====================

-- Add updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_reports_updated_at BEFORE UPDATE ON test_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON push_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================
-- ROW LEVEL SECURITY
-- ====================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for core tables
CREATE POLICY "customers_policy" ON customers FOR ALL
    USING (organization_id = current_organization_id() AND 
           (current_user_role() IN ('admin', 'technician') OR 
            EXISTS (SELECT 1 FROM profiles WHERE id = current_user_id() AND email = customers.email)));

CREATE POLICY "devices_policy" ON devices FOR ALL
    USING (EXISTS (
        SELECT 1 FROM customers 
        WHERE customers.id = devices.customer_id 
        AND customers.organization_id = current_organization_id()
        AND (current_user_role() IN ('admin', 'technician') OR 
             EXISTS (SELECT 1 FROM profiles WHERE id = current_user_id() AND email = customers.email))
    ));

CREATE POLICY "appointments_policy" ON appointments FOR ALL
    USING (EXISTS (
        SELECT 1 FROM customers 
        WHERE customers.id = appointments.customer_id 
        AND customers.organization_id = current_organization_id()
        AND (current_user_role() IN ('admin', 'technician') OR 
             EXISTS (SELECT 1 FROM profiles WHERE id = current_user_id() AND email = customers.email))
    ));

CREATE POLICY "test_reports_policy" ON test_reports FOR ALL
    USING (EXISTS (
        SELECT 1 FROM customers 
        WHERE customers.id = test_reports.customer_id 
        AND customers.organization_id = current_organization_id()
        AND (current_user_role() IN ('admin', 'technician') OR 
             EXISTS (SELECT 1 FROM profiles WHERE id = current_user_id() AND email = customers.email))
    ));

CREATE POLICY "invoices_policy" ON invoices FOR ALL
    USING (EXISTS (
        SELECT 1 FROM customers 
        WHERE customers.id = invoices.customer_id 
        AND customers.organization_id = current_organization_id()
        AND (current_user_role() IN ('admin', 'technician') OR 
             EXISTS (SELECT 1 FROM profiles WHERE id = current_user_id() AND email = customers.email))
    ));

CREATE POLICY "payments_policy" ON payments FOR ALL
    USING (current_user_role() IN ('admin', 'technician') OR 
           EXISTS (
               SELECT 1 FROM customers 
               WHERE customers.id = payments.customer_id 
               AND EXISTS (SELECT 1 FROM profiles WHERE id = current_user_id() AND email = customers.email)
           ));

-- Admin-only policies
CREATE POLICY "system_logs_policy" ON system_logs FOR ALL
    USING (current_user_role() = 'admin');

CREATE POLICY "security_events_policy" ON security_events FOR ALL
    USING (current_user_role() = 'admin');

CREATE POLICY "email_logs_policy" ON email_logs FOR ALL
    USING (current_user_role() IN ('admin', 'technician'));

CREATE POLICY "sms_logs_policy" ON sms_logs FOR ALL
    USING (current_user_role() IN ('admin', 'technician'));

-- User-specific policies
CREATE POLICY "profiles_policy" ON profiles FOR ALL
    USING (id = current_user_id() OR current_user_role() = 'admin');

CREATE POLICY "push_subscriptions_policy" ON push_subscriptions FOR ALL
    USING (user_id = current_user_id() OR current_user_role() = 'admin');

CREATE POLICY "notification_logs_policy" ON notification_logs FOR ALL
    USING (target_user_id = current_user_id() OR created_by = current_user_id() OR current_user_role() = 'admin');

CREATE POLICY "files_policy" ON files FOR ALL
    USING (is_public = true OR uploaded_by = current_user_id() OR current_user_role() IN ('admin', 'technician'));

-- ====================
-- INDEXES FOR PERFORMANCE
-- ====================

-- Core business indexes
CREATE INDEX IF NOT EXISTS idx_customers_organization_id ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_account_number ON customers(organization_id, account_number);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(organization_id, email);
CREATE INDEX IF NOT EXISTS idx_devices_customer_id ON devices(customer_id);
CREATE INDEX IF NOT EXISTS idx_devices_serial_number ON devices(serial_number);
CREATE INDEX IF NOT EXISTS idx_test_reports_customer_id ON test_reports(customer_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_device_id ON test_reports(device_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_test_date ON test_reports(test_date);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(appointment_date, appointment_time);

-- Communication indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_target_user_id ON notification_logs(target_user_id);

-- System indexes
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- File indexes
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);

-- ====================
-- INITIAL DATA
-- ====================

-- Create sample customer
INSERT INTO customers (
    id, organization_id, account_number, name, email, phone, address, next_test_date
) VALUES (
    '12345678-1234-1234-1234-123456789012',
    '00000000-0000-0000-0000-000000000001',
    'FB001',
    'John Smith',
    'john.smith@email.com',
    '(253) 555-0123',
    '123 Main St, Tacoma, WA 98401',
    '2025-12-15'
) ON CONFLICT (organization_id, account_number) DO NOTHING;

-- Create sample device
INSERT INTO devices (
    customer_id, location, serial_number, size, make, model, install_date, last_test_date, next_test_date
) VALUES (
    '12345678-1234-1234-1234-123456789012',
    '123 Main St - Backyard',
    'BF-2024-001',
    '3/4"',
    'Watts',
    'Series 909',
    '2023-01-15',
    '2024-01-15',
    '2025-01-15'
) ON CONFLICT (serial_number) DO NOTHING;

-- Create sample appointment
INSERT INTO appointments (
    customer_id, device_id, service_type, appointment_date, appointment_time, status, device_location, technician
) VALUES (
    '12345678-1234-1234-1234-123456789012',
    (SELECT id FROM devices WHERE serial_number = 'BF-2024-001'),
    'Annual Test',
    '2025-01-20',
    '10:00',
    'Scheduled',
    '123 Main St - Backyard',
    'Mike Fisher'
) ON CONFLICT DO NOTHING;

-- ====================
-- PERMISSIONS
-- ====================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION current_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'Fisher Backflows Platform database schema created successfully!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Update your .env.local with the Supabase connection details';
    RAISE NOTICE '2. Run npm install to ensure all dependencies are installed';
    RAISE NOTICE '3. Run npm run dev to start the development server';
    RAISE NOTICE '4. Visit http://localhost:3010 to access the platform';
END $$;