-- Additional tables required for secure authentication and proper system functionality

-- Technicians table for proper tech user management
CREATE TABLE IF NOT EXISTS technicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    phone VARCHAR,
    email VARCHAR,
    certifications JSONB DEFAULT '[]',
    active BOOLEAN DEFAULT TRUE,
    organization_id UUID REFERENCES organizations(id),
    hire_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security events table for audit logging
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organization_id UUID REFERENCES organizations(id)
);

-- System logs table for application logging
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR NOT NULL CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')),
    message TEXT NOT NULL,
    component VARCHAR,
    user_id UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email logs table for email delivery tracking
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_email VARCHAR NOT NULL,
    from_email VARCHAR NOT NULL,
    subject VARCHAR NOT NULL,
    template_name VARCHAR,
    status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    provider VARCHAR, -- sendgrid, ses, smtp
    provider_id VARCHAR, -- external ID from email service
    error_message TEXT,
    user_id UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment transactions table for real payment tracking
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR NOT NULL, -- card, bank_transfer, check, cash
    payment_intent_id VARCHAR, -- Stripe payment intent ID
    charge_id VARCHAR, -- Stripe charge ID
    status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')),
    failure_reason TEXT,
    receipt_url TEXT,
    refund_id VARCHAR,
    refunded_amount DECIMAL(10,2) DEFAULT 0,
    processing_fee DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2),
    processed_by UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files table for secure file management
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR NOT NULL,
    original_name VARCHAR NOT NULL,
    mime_type VARCHAR NOT NULL,
    size INTEGER NOT NULL,
    hash VARCHAR NOT NULL, -- SHA-256 hash
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    category VARCHAR NOT NULL CHECK (category IN ('document', 'image', 'certificate', 'report', 'signature', 'photo')),
    is_public BOOLEAN DEFAULT FALSE,
    uploaded_by UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    appointment_id UUID REFERENCES appointments(id),
    customer_id UUID REFERENCES customers(id),
    test_report_id UUID REFERENCES test_reports(id),
    metadata JSONB DEFAULT '{}',
    virus_scan_status VARCHAR DEFAULT 'pending' CHECK (virus_scan_status IN ('pending', 'clean', 'infected', 'failed')),
    virus_scan_result JSONB,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System status table for health monitoring
CREATE TABLE IF NOT EXISTS system_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component VARCHAR NOT NULL,
    status VARCHAR NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
    message TEXT,
    response_time INTEGER, -- in milliseconds
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    organization_id UUID REFERENCES organizations(id)
);

-- Notifications table for proper notification management
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    customer_id UUID REFERENCES customers(id),
    type VARCHAR NOT NULL, -- email, sms, push, in_app
    channel VARCHAR NOT NULL, -- appointment_reminder, test_completion, payment_due, etc.
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API keys table for external integrations
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    key_hash VARCHAR NOT NULL, -- bcrypt hashed API key
    service VARCHAR NOT NULL, -- stripe, sendgrid, etc.
    permissions JSONB DEFAULT '[]',
    active BOOLEAN DEFAULT TRUE,
    last_used TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    organization_id UUID REFERENCES organizations(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Water departments/districts table for proper test submission tracking
CREATE TABLE IF NOT EXISTS water_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    contact_person VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    address TEXT,
    submission_method VARCHAR DEFAULT 'email' CHECK (submission_method IN ('email', 'portal', 'fax', 'mail')),
    portal_url TEXT,
    requirements JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT TRUE,
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer water department assignments
CREATE TABLE IF NOT EXISTS customer_water_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    water_department_id UUID REFERENCES water_departments(id),
    account_number VARCHAR,
    service_address TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device maintenance history
CREATE TABLE IF NOT EXISTS device_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    maintenance_type VARCHAR NOT NULL, -- repair, replacement, calibration, etc.
    description TEXT,
    performed_by UUID REFERENCES auth.users(id),
    cost DECIMAL(10,2),
    parts_used JSONB DEFAULT '[]',
    before_photos JSONB DEFAULT '[]',
    after_photos JSONB DEFAULT '[]',
    maintenance_date DATE NOT NULL,
    next_maintenance_date DATE,
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for new tables

-- Technicians table policies
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
CREATE POLICY "technicians_select" ON technicians FOR SELECT
    USING (organization_id = current_organization_id());
CREATE POLICY "technicians_insert" ON technicians FOR INSERT
    WITH CHECK (current_user_role() IN ('admin') AND organization_id = current_organization_id());
CREATE POLICY "technicians_update" ON technicians FOR UPDATE
    USING (current_user_role() IN ('admin') AND organization_id = current_organization_id());
CREATE POLICY "technicians_delete" ON technicians FOR DELETE
    USING (current_user_role() = 'admin');

-- Security events table policies
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "security_events_select" ON security_events FOR SELECT
    USING (current_user_role() = 'admin');
CREATE POLICY "security_events_insert" ON security_events FOR INSERT
    WITH CHECK (true); -- Allow system to insert security events

-- System logs table policies
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "system_logs_select" ON system_logs FOR SELECT
    USING (current_user_role() = 'admin');
CREATE POLICY "system_logs_insert" ON system_logs FOR INSERT
    WITH CHECK (true); -- Allow system to insert logs

-- Email logs table policies
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_logs_select" ON email_logs FOR SELECT
    USING (current_user_role() IN ('admin', 'technician') AND organization_id = current_organization_id());
CREATE POLICY "email_logs_insert" ON email_logs FOR INSERT
    WITH CHECK (organization_id = current_organization_id());

-- Payments table policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_select" ON payments FOR SELECT
    USING (current_user_role() = 'admin' OR 
           (organization_id = current_organization_id() AND current_user_role() IN ('technician', 'customer')));
CREATE POLICY "payments_insert" ON payments FOR INSERT
    WITH CHECK (current_user_role() IN ('admin', 'technician') AND organization_id = current_organization_id());
CREATE POLICY "payments_update" ON payments FOR UPDATE
    USING (current_user_role() IN ('admin', 'technician') AND organization_id = current_organization_id());

-- Files table policies
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "files_select" ON files FOR SELECT
    USING (is_public = true OR 
           (current_user_role() = 'admin') OR
           (organization_id = current_organization_id() AND current_user_role() IN ('technician', 'customer')));
CREATE POLICY "files_insert" ON files FOR INSERT
    WITH CHECK (current_user_role() IN ('admin', 'technician', 'customer') AND organization_id = current_organization_id());
CREATE POLICY "files_update" ON files FOR UPDATE
    USING (uploaded_by = current_user_id() OR current_user_role() IN ('admin', 'technician'));
CREATE POLICY "files_delete" ON files FOR DELETE
    USING (uploaded_by = current_user_id() OR current_user_role() = 'admin');

-- System status table policies
ALTER TABLE system_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "system_status_select" ON system_status FOR SELECT
    USING (current_user_role() = 'admin');
CREATE POLICY "system_status_insert" ON system_status FOR INSERT
    WITH CHECK (true); -- Allow system to insert status updates

-- Notifications table policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select" ON notifications FOR SELECT
    USING (user_id = current_user_id() OR current_user_role() = 'admin');
CREATE POLICY "notifications_insert" ON notifications FOR INSERT
    WITH CHECK (organization_id = current_organization_id());
CREATE POLICY "notifications_update" ON notifications FOR UPDATE
    USING (user_id = current_user_id() OR current_user_role() = 'admin');

-- API keys table policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_keys_select" ON api_keys FOR SELECT
    USING (current_user_role() = 'admin' AND organization_id = current_organization_id());
CREATE POLICY "api_keys_insert" ON api_keys FOR INSERT
    WITH CHECK (current_user_role() = 'admin' AND organization_id = current_organization_id());
CREATE POLICY "api_keys_update" ON api_keys FOR UPDATE
    USING (current_user_role() = 'admin' AND organization_id = current_organization_id());
CREATE POLICY "api_keys_delete" ON api_keys FOR DELETE
    USING (current_user_role() = 'admin' AND organization_id = current_organization_id());

-- Water departments table policies
ALTER TABLE water_departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "water_departments_select" ON water_departments FOR SELECT
    USING (organization_id = current_organization_id());
CREATE POLICY "water_departments_insert" ON water_departments FOR INSERT
    WITH CHECK (current_user_role() IN ('admin', 'technician') AND organization_id = current_organization_id());
CREATE POLICY "water_departments_update" ON water_departments FOR UPDATE
    USING (current_user_role() IN ('admin', 'technician') AND organization_id = current_organization_id());

-- Customer water departments table policies
ALTER TABLE customer_water_departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_water_departments_select" ON customer_water_departments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM customers 
        WHERE customers.id = customer_water_departments.customer_id 
        AND customers.organization_id = current_organization_id()
    ));
CREATE POLICY "customer_water_departments_insert" ON customer_water_departments FOR INSERT
    WITH CHECK (current_user_role() IN ('admin', 'technician'));

-- Device maintenance table policies
ALTER TABLE device_maintenance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "device_maintenance_select" ON device_maintenance FOR SELECT
    USING (organization_id = current_organization_id());
CREATE POLICY "device_maintenance_insert" ON device_maintenance FOR INSERT
    WITH CHECK (current_user_role() IN ('admin', 'technician') AND organization_id = current_organization_id());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_technicians_user_id ON technicians(user_id);
CREATE INDEX IF NOT EXISTS idx_technicians_organization_id ON technicians(organization_id);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_organization_id ON files(organization_id);
CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_water_departments_organization_id ON water_departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_water_departments_customer_id ON customer_water_departments(customer_id);
CREATE INDEX IF NOT EXISTS idx_device_maintenance_device_id ON device_maintenance(device_id);

-- Add updated_at triggers
CREATE TRIGGER update_technicians_updated_at BEFORE UPDATE ON technicians FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_water_departments_updated_at BEFORE UPDATE ON water_departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data

-- Create initial technician user (replace hardcoded tech system)
INSERT INTO auth.users (id, email, encrypted_password, role, organization_id, email_confirmed) VALUES
    ('11111111-1111-1111-1111-111111111111', 'mike@fisherbackflows.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiKy7.mTq7mW', 'admin', '00000000-0000-0000-0000-000000000001', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO technicians (id, user_id, employee_id, name, phone, email, organization_id) VALUES
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'TECH001', 'Mike Fisher', '555-0100', 'mike@fisherbackflows.com', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (employee_id) DO NOTHING;

-- Create initial water department
INSERT INTO water_departments (id, name, contact_person, email, phone, address, organization_id) VALUES
    ('33333333-3333-3333-3333-333333333333', 'Metro Water District', 'John Smith', 'submissions@metrowater.gov', '555-0200', '100 Water St, Metro City', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Grant permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;