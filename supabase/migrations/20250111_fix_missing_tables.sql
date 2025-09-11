-- FIX MISSING TABLES FOR BACKFLOW BUDDY
-- This migration creates missing tables that are referenced in other migrations

BEGIN;

-- Create team_users table (missing but referenced everywhere)
CREATE TABLE IF NOT EXISTS public.team_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID, -- This is the missing column causing the error
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'technician' CHECK (role IN ('owner', 'admin', 'manager', 'technician', 'tester')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    company_id UUID, -- Will be added by multi-tenant migration
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_users_auth_user_id ON public.team_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_team_users_email ON public.team_users(email);
CREATE INDEX IF NOT EXISTS idx_team_users_company_id ON public.team_users(company_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_team_users_updated_at
    BEFORE UPDATE ON public.team_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add any other missing tables that might be referenced

-- Create water_districts table if missing
CREATE TABLE IF NOT EXISTS public.water_districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    submission_method VARCHAR(50) DEFAULT 'email',
    api_endpoint TEXT,
    api_key TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_templates table if missing
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create push_subscriptions table if missing
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_type VARCHAR(20) DEFAULT 'customer',
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_logs table if missing
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_type VARCHAR(20),
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    message TEXT,
    status VARCHAR(20) DEFAULT 'sent',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_verifications table if missing
CREATE TABLE IF NOT EXISTS public.email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    user_type VARCHAR(20) DEFAULT 'customer',
    user_id UUID,
    expires_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leads table if missing
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    company VARCHAR(255),
    message TEXT,
    source VARCHAR(100),
    status VARCHAR(50) DEFAULT 'new',
    assigned_to UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create technician_locations table if missing
CREATE TABLE IF NOT EXISTS public.technician_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_id UUID REFERENCES public.team_users(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    accuracy DECIMAL(6, 2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create technician_current_location table if missing
CREATE TABLE IF NOT EXISTS public.technician_current_location (
    technician_id UUID PRIMARY KEY REFERENCES public.team_users(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    accuracy DECIMAL(6, 2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create time_off_requests table if missing
CREATE TABLE IF NOT EXISTS public.time_off_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_id UUID REFERENCES public.team_users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    approved_by UUID REFERENCES public.team_users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tester_schedules table if missing  
CREATE TABLE IF NOT EXISTS public.tester_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_id UUID REFERENCES public.team_users(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_sessions table if missing
CREATE TABLE IF NOT EXISTS public.team_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_user_id UUID REFERENCES public.team_users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoice_line_items table if missing
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security_logs table if missing
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_type VARCHAR(20),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id TEXT,
    ip_address INET,
    user_agent TEXT,
    details JSONB DEFAULT '{}',
    severity VARCHAR(20) DEFAULT 'info',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table if missing
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_type VARCHAR(20) DEFAULT 'team',
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default team user (admin) if table is empty
INSERT INTO public.team_users (
    email,
    first_name,
    last_name,
    role,
    status,
    is_active
) VALUES (
    'admin@fisherbackflows.com',
    'System',
    'Administrator', 
    'admin',
    'active',
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert default notification templates
INSERT INTO public.notification_templates (name, type, subject, content) VALUES
('appointment_reminder', 'email', 'Upcoming Backflow Test Reminder', 'Your backflow test is scheduled for {{date}} at {{time}}.'),
('test_completed', 'push', 'Test Completed', 'Backflow test completed for {{customer_name}}'),
('invoice_sent', 'email', 'Invoice for Backflow Testing Services', 'Please find your invoice attached.'),
('payment_received', 'email', 'Payment Received', 'Thank you for your payment of ${{amount}}.')
ON CONFLICT (name) DO NOTHING;

COMMIT;