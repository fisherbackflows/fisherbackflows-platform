-- MISSING TABLES COMPATIBLE WITH SUPABASE SCHEMA
-- This creates additional tables that weren't in the core schema

-- Enable extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Email verifications table
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    email VARCHAR NOT NULL,
    token VARCHAR UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR UNIQUE NOT NULL,
    subject VARCHAR,
    body_text TEXT,
    body_html TEXT,
    template_type VARCHAR DEFAULT 'email',
    is_active BOOLEAN DEFAULT true,
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Push subscriptions for PWA notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT,
    auth_key TEXT,
    is_active BOOLEAN DEFAULT true,
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification logs
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID, -- Can reference customers or team_users
    recipient_type VARCHAR DEFAULT 'customer' CHECK (recipient_type IN ('customer', 'team_user')),
    template_id UUID REFERENCES notification_templates(id),
    channel VARCHAR DEFAULT 'email' CHECK (channel IN ('email', 'push', 'sms')),
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification interactions (clicks, opens, etc.)
CREATE TABLE IF NOT EXISTS notification_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_log_id UUID REFERENCES notification_logs(id) ON DELETE CASCADE,
    interaction_type VARCHAR NOT NULL CHECK (interaction_type IN ('opened', 'clicked', 'dismissed')),
    ip_address VARCHAR,
    user_agent TEXT,
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads table (for marketing/sales)
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR NOT NULL,
    phone VARCHAR,
    company_name VARCHAR,
    source VARCHAR, -- 'website', 'referral', 'google', etc.
    status VARCHAR DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    notes TEXT,
    assigned_to UUID REFERENCES team_users(id),
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Technician locations for GPS tracking
CREATE TABLE IF NOT EXISTS technician_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technician_id UUID REFERENCES team_users(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    accuracy DECIMAL(10, 2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111'
);

-- Current technician location (real-time)
CREATE TABLE IF NOT EXISTS technician_current_location (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technician_id UUID UNIQUE REFERENCES team_users(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    accuracy DECIMAL(10, 2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111'
);

-- Time off requests
CREATE TABLE IF NOT EXISTS time_off_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technician_id UUID REFERENCES team_users(id) ON DELETE CASCADE,
    request_type VARCHAR NOT NULL CHECK (request_type IN ('vacation', 'sick', 'personal', 'other')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    reason TEXT,
    approved_by UUID REFERENCES team_users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tester schedules
CREATE TABLE IF NOT EXISTS tester_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technician_id UUID REFERENCES team_users(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT true,
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team sessions (for session management)
CREATE TABLE IF NOT EXISTS team_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_user_id UUID REFERENCES team_users(id) ON DELETE CASCADE,
    session_token VARCHAR UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address VARCHAR,
    user_agent TEXT,
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all new tables
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_current_location ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tester_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_sessions ENABLE ROW LEVEL SECURITY;

-- Create service role policies for all new tables
CREATE POLICY "Service role has full access to email_verifications" ON email_verifications
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to notification_templates" ON notification_templates
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to push_subscriptions" ON push_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to notification_logs" ON notification_logs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to notification_interactions" ON notification_interactions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to leads" ON leads
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to technician_locations" ON technician_locations
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to technician_current_location" ON technician_current_location
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to time_off_requests" ON time_off_requests
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to tester_schedules" ON tester_schedules
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to team_sessions" ON team_sessions
    FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_email_verifications_customer ON email_verifications(customer_id);
CREATE INDEX idx_email_verifications_token ON email_verifications(token);
CREATE INDEX idx_push_subscriptions_customer ON push_subscriptions(customer_id);
CREATE INDEX idx_notification_logs_recipient ON notification_logs(recipient_id);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_technician_locations_technician ON technician_locations(technician_id);
CREATE INDEX idx_technician_current_location_technician ON technician_current_location(technician_id);
CREATE INDEX idx_time_off_requests_technician ON time_off_requests(technician_id);
CREATE INDEX idx_tester_schedules_technician ON tester_schedules(technician_id);
CREATE INDEX idx_team_sessions_token ON team_sessions(session_token);

-- Apply update triggers where needed
CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tester_schedules_updated_at BEFORE UPDATE ON tester_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default notification templates
INSERT INTO notification_templates (name, subject, body_text, body_html, template_type) VALUES
('welcome_customer', 'Welcome to Fisher Backflows', 'Welcome! Your account has been created.', '<h1>Welcome!</h1><p>Your account has been created.</p>', 'email'),
('appointment_reminder', 'Appointment Reminder', 'You have an appointment scheduled.', '<h1>Appointment Reminder</h1><p>You have an appointment scheduled.</p>', 'email'),
('test_complete', 'Test Complete', 'Your backflow test has been completed.', '<h1>Test Complete</h1><p>Your backflow test has been completed.</p>', 'email'),
('payment_due', 'Payment Due', 'You have a payment due.', '<h1>Payment Due</h1><p>You have a payment due.</p>', 'email')
ON CONFLICT (name) DO NOTHING;