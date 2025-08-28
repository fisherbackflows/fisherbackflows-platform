-- Fisher Backflows Enterprise Database Schema
-- Version: 2.0.0
-- Generated: 2025-08-28
-- Database: PostgreSQL 15+

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ═══════════════════════════════════════════════════════════════════════
-- SCHEMA SETUP
-- ═══════════════════════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS analytics;

-- ═══════════════════════════════════════════════════════════════════════
-- CUSTOM TYPES
-- ═══════════════════════════════════════════════════════════════════════

-- User roles
CREATE TYPE user_role AS ENUM (
    'super_admin',
    'admin',
    'technician',
    'customer',
    'viewer'
);

-- Appointment status
CREATE TYPE appointment_status AS ENUM (
    'scheduled',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
    'rescheduled',
    'no_show'
);

-- Test result
CREATE TYPE test_result AS ENUM (
    'pass',
    'fail',
    'inconclusive',
    'pending'
);

-- Payment status
CREATE TYPE payment_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'refunded',
    'cancelled'
);

-- Invoice status
CREATE TYPE invoice_status AS ENUM (
    'draft',
    'sent',
    'viewed',
    'paid',
    'partial',
    'overdue',
    'cancelled',
    'refunded'
);

-- Priority level
CREATE TYPE priority_level AS ENUM (
    'low',
    'normal',
    'high',
    'urgent',
    'emergency'
);

-- Notification type
CREATE TYPE notification_type AS ENUM (
    'email',
    'sms',
    'push',
    'in_app'
);

-- ═══════════════════════════════════════════════════════════════════════
-- CORE TABLES
-- ═══════════════════════════════════════════════════════════════════════

-- Organizations (for multi-tenant support)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    ein VARCHAR(20),
    license_number VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    address JSONB,
    settings JSONB DEFAULT '{}',
    subscription_tier VARCHAR(50) DEFAULT 'professional',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Users (enhanced from Supabase auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role DEFAULT 'customer',
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret TEXT,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Customers (extended profile)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    company_name VARCHAR(255),
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    service_address JSONB NOT NULL,
    billing_address JSONB,
    property_type VARCHAR(50),
    backflow_count INTEGER DEFAULT 1,
    last_test_date DATE,
    next_test_date DATE,
    test_frequency_months INTEGER DEFAULT 12,
    balance DECIMAL(10,2) DEFAULT 0,
    credit_limit DECIMAL(10,2) DEFAULT 0,
    payment_terms INTEGER DEFAULT 30, -- days
    tax_exempt BOOLEAN DEFAULT false,
    tax_id VARCHAR(50),
    notes TEXT,
    tags TEXT[],
    risk_score INTEGER DEFAULT 0,
    lifetime_value DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT positive_balance CHECK (balance >= 0),
    CONSTRAINT valid_risk_score CHECK (risk_score >= 0 AND risk_score <= 100)
);

-- Technicians (field workers)
CREATE TABLE technicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    certification_number VARCHAR(100) UNIQUE,
    certification_expiry DATE,
    specializations TEXT[],
    service_areas TEXT[],
    hourly_rate DECIMAL(10,2),
    commission_rate DECIMAL(5,2),
    vehicle_id VARCHAR(50),
    equipment JSONB DEFAULT '{}',
    availability JSONB DEFAULT '{}',
    performance_rating DECIMAL(3,2) DEFAULT 5.0,
    jobs_completed INTEGER DEFAULT 0,
    jobs_failed INTEGER DEFAULT 0,
    average_completion_time INTEGER, -- minutes
    is_available BOOLEAN DEFAULT true,
    is_on_call BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_rating CHECK (performance_rating >= 0 AND performance_rating <= 5),
    CONSTRAINT valid_commission CHECK (commission_rate >= 0 AND commission_rate <= 100)
);

-- Backflow devices
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    size VARCHAR(20),
    type VARCHAR(50),
    location TEXT,
    installation_date DATE,
    last_test_date DATE,
    next_test_date DATE,
    test_frequency_months INTEGER DEFAULT 12,
    water_meter_number VARCHAR(50),
    hazard_level VARCHAR(20),
    notes TEXT,
    qr_code VARCHAR(255) UNIQUE,
    coordinates POINT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Appointments
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES technicians(id) ON DELETE SET NULL,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    status appointment_status DEFAULT 'scheduled',
    priority priority_level DEFAULT 'normal',
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    estimated_duration INTEGER DEFAULT 60, -- minutes
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    service_type VARCHAR(100) NOT NULL,
    service_address JSONB,
    coordinates POINT,
    notes TEXT,
    internal_notes TEXT,
    customer_notes TEXT,
    confirmation_sent BOOLEAN DEFAULT false,
    reminder_sent BOOLEAN DEFAULT false,
    requires_parts BOOLEAN DEFAULT false,
    weather_dependency BOOLEAN DEFAULT false,
    cancellation_reason TEXT,
    rescheduled_from UUID REFERENCES appointments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_duration CHECK (estimated_duration > 0),
    CONSTRAINT valid_schedule CHECK (scheduled_date >= CURRENT_DATE)
);

-- Test reports
CREATE TABLE test_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES technicians(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    test_date DATE NOT NULL,
    test_time TIME NOT NULL,
    test_result test_result NOT NULL,
    test_data JSONB NOT NULL, -- All test measurements
    initial_pressure DECIMAL(6,2),
    final_pressure DECIMAL(6,2),
    pressure_drop DECIMAL(6,2),
    check_valve_1 JSONB,
    check_valve_2 JSONB,
    relief_valve JSONB,
    shut_off_valves JSONB,
    air_gap JSONB,
    observations TEXT,
    repairs_needed BOOLEAN DEFAULT false,
    repair_notes TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    certification_number VARCHAR(100) UNIQUE,
    pdf_url TEXT,
    signature_url TEXT,
    photos TEXT[],
    submitted_to_water_dept BOOLEAN DEFAULT false,
    submission_date TIMESTAMP WITH TIME ZONE,
    submission_confirmation VARCHAR(255),
    weather_conditions JSONB,
    gps_coordinates POINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    test_report_id UUID REFERENCES test_reports(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    status invoice_status DEFAULT 'draft',
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,4) DEFAULT 0.1025,
    tax_amount DECIMAL(10,2),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    balance_due DECIMAL(10,2),
    line_items JSONB NOT NULL,
    payment_terms INTEGER DEFAULT 30,
    notes TEXT,
    internal_notes TEXT,
    sent_date TIMESTAMP WITH TIME ZONE,
    viewed_date TIMESTAMP WITH TIME ZONE,
    paid_date TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    stripe_payment_intent VARCHAR(255),
    pdf_url TEXT,
    reminder_count INTEGER DEFAULT 0,
    last_reminder_date TIMESTAMP WITH TIME ZONE,
    is_recurring BOOLEAN DEFAULT false,
    recurring_schedule JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT positive_amounts CHECK (
        total_amount >= 0 AND 
        paid_amount >= 0 AND 
        balance_due >= 0
    ),
    CONSTRAINT valid_payment CHECK (paid_amount <= total_amount)
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    status payment_status DEFAULT 'pending',
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processing_fee DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2),
    reference_number VARCHAR(255),
    stripe_payment_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    stripe_refund_id VARCHAR(255),
    card_last4 VARCHAR(4),
    card_brand VARCHAR(20),
    bank_name VARCHAR(100),
    check_number VARCHAR(50),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    refund_amount DECIMAL(10,2) DEFAULT 0,
    refund_date TIMESTAMP WITH TIME ZONE,
    refund_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_payment CHECK (amount > 0),
    CONSTRAINT valid_refund CHECK (refund_amount <= amount)
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    category VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    priority priority_level DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'pending',
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Activity logs
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════
-- INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- Customers indexes
CREATE INDEX idx_customers_account ON customers(account_number);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_next_test ON customers(next_test_date);
CREATE INDEX idx_customers_search ON customers USING gin(
    to_tsvector('english', contact_name || ' ' || COALESCE(company_name, '') || ' ' || email)
);

-- Appointments indexes
CREATE INDEX idx_appointments_date ON appointments(scheduled_date);
CREATE INDEX idx_appointments_customer ON appointments(customer_id);
CREATE INDEX idx_appointments_technician ON appointments(technician_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_schedule ON appointments(scheduled_date, scheduled_time);

-- Test reports indexes
CREATE INDEX idx_test_reports_date ON test_reports(test_date);
CREATE INDEX idx_test_reports_device ON test_reports(device_id);
CREATE INDEX idx_test_reports_result ON test_reports(test_result);
CREATE INDEX idx_test_reports_certification ON test_reports(certification_number);

-- Invoices indexes
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due ON invoices(due_date);
CREATE INDEX idx_invoices_unpaid ON invoices(balance_due) WHERE balance_due > 0;

-- Payments indexes
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_stripe ON payments(stripe_payment_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- Activity logs indexes
CREATE INDEX idx_activity_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_user ON activity_logs(user_id);
CREATE INDEX idx_activity_created ON activity_logs(created_at);

-- ═══════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp to all tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_technicians_updated_at BEFORE UPDATE ON technicians
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_test_reports_updated_at BEFORE UPDATE ON test_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    year_month TEXT;
    sequence_num INTEGER;
    new_invoice_number TEXT;
BEGIN
    year_month := TO_CHAR(NEW.issue_date, 'YYYYMM');
    
    SELECT COUNT(*) + 1 INTO sequence_num
    FROM invoices
    WHERE TO_CHAR(issue_date, 'YYYYMM') = year_month;
    
    new_invoice_number := 'INV-' || year_month || '-' || LPAD(sequence_num::TEXT, 4, '0');
    NEW.invoice_number := new_invoice_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_invoice_number_trigger
    BEFORE INSERT ON invoices
    FOR EACH ROW
    WHEN (NEW.invoice_number IS NULL)
    EXECUTE FUNCTION generate_invoice_number();

-- Calculate invoice balance
CREATE OR REPLACE FUNCTION calculate_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
    NEW.tax_amount := NEW.subtotal * NEW.tax_rate;
    NEW.total_amount := NEW.subtotal + NEW.tax_amount - NEW.discount_amount;
    NEW.balance_due := NEW.total_amount - NEW.paid_amount;
    
    IF NEW.balance_due <= 0 THEN
        NEW.status := 'paid';
        NEW.paid_date := CURRENT_TIMESTAMP;
    ELSIF NEW.paid_amount > 0 THEN
        NEW.status := 'partial';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_invoice_balance_trigger
    BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION calculate_invoice_balance();

-- Log activity
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_logs (
        organization_id,
        user_id,
        entity_type,
        entity_id,
        action,
        description,
        metadata
    ) VALUES (
        COALESCE(NEW.organization_id, OLD.organization_id),
        current_setting('app.current_user_id', true)::UUID,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        TG_OP || ' on ' || TG_TABLE_NAME,
        jsonb_build_object(
            'old', to_jsonb(OLD),
            'new', to_jsonb(NEW)
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════

-- Get customer balance
CREATE OR REPLACE FUNCTION get_customer_balance(customer_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_balance DECIMAL;
BEGIN
    SELECT SUM(balance_due) INTO total_balance
    FROM invoices
    WHERE customer_id = customer_uuid
    AND status NOT IN ('paid', 'cancelled')
    AND deleted_at IS NULL;
    
    RETURN COALESCE(total_balance, 0);
END;
$$ LANGUAGE plpgsql;

-- Get technician availability
CREATE OR REPLACE FUNCTION get_technician_availability(
    tech_id UUID,
    check_date DATE
)
RETURNS TABLE (
    time_slot TIME,
    is_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH time_slots AS (
        SELECT generate_series(
            '08:00:00'::TIME,
            '17:00:00'::TIME,
            '30 minutes'::INTERVAL
        )::TIME AS slot
    ),
    booked_slots AS (
        SELECT 
            scheduled_time,
            scheduled_time + (estimated_duration || ' minutes')::INTERVAL AS end_time
        FROM appointments
        WHERE technician_id = tech_id
        AND scheduled_date = check_date
        AND status NOT IN ('cancelled', 'completed')
    )
    SELECT 
        ts.slot,
        NOT EXISTS (
            SELECT 1 FROM booked_slots bs
            WHERE ts.slot >= bs.scheduled_time 
            AND ts.slot < bs.end_time
        ) AS is_available
    FROM time_slots ts
    ORDER BY ts.slot;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════════════════

-- Customer dashboard view
CREATE OR REPLACE VIEW customer_dashboard AS
SELECT 
    c.id,
    c.account_number,
    c.contact_name,
    c.company_name,
    c.email,
    c.phone,
    c.next_test_date,
    c.balance,
    COUNT(DISTINCT d.id) as device_count,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'scheduled') as upcoming_appointments,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status NOT IN ('paid', 'cancelled')) as open_invoices,
    SUM(i.balance_due) FILTER (WHERE i.status NOT IN ('paid', 'cancelled')) as total_due,
    MAX(tr.test_date) as last_test_date,
    CASE 
        WHEN c.next_test_date < CURRENT_DATE THEN 'overdue'
        WHEN c.next_test_date < CURRENT_DATE + INTERVAL '30 days' THEN 'due_soon'
        ELSE 'current'
    END as compliance_status
FROM customers c
LEFT JOIN devices d ON c.id = d.customer_id AND d.is_active = true
LEFT JOIN appointments a ON c.id = a.customer_id AND a.deleted_at IS NULL
LEFT JOIN invoices i ON c.id = i.customer_id AND i.deleted_at IS NULL
LEFT JOIN test_reports tr ON c.id = tr.customer_id AND tr.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id;

-- Technician performance view
CREATE OR REPLACE VIEW technician_performance AS
SELECT 
    t.id,
    t.employee_id,
    u.full_name as technician_name,
    t.performance_rating,
    t.jobs_completed,
    t.jobs_failed,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed' AND a.actual_end_time >= CURRENT_DATE - INTERVAL '30 days') as jobs_last_30_days,
    AVG(EXTRACT(EPOCH FROM (a.actual_end_time - a.actual_start_time))/60)::INTEGER as avg_job_duration_minutes,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed' AND DATE(a.actual_end_time) = CURRENT_DATE) as jobs_today,
    SUM(i.total_amount) FILTER (WHERE i.status = 'paid' AND i.paid_date >= CURRENT_DATE - INTERVAL '30 days') as revenue_last_30_days
FROM technicians t
JOIN users u ON t.user_id = u.id
LEFT JOIN appointments a ON t.id = a.technician_id
LEFT JOIN invoices i ON a.id = i.appointment_id
WHERE u.deleted_at IS NULL
GROUP BY t.id, t.employee_id, u.full_name, t.performance_rating, t.jobs_completed, t.jobs_failed;

-- ═══════════════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════════════

-- Insert default organization
INSERT INTO organizations (
    id,
    name,
    legal_name,
    email,
    phone,
    address,
    subscription_tier
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Fisher Backflows',
    'Fisher Backflows LLC',
    'info@fisherbackflows.com',
    '(253) 278-8692',
    '{"street": "1234 Main St", "city": "Tacoma", "state": "WA", "zip": "98401", "country": "USA"}',
    'enterprise'
);

-- ═══════════════════════════════════════════════════════════════════════
-- PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to service role
GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ═══════════════════════════════════════════════════════════════════════
-- END OF INITIAL SCHEMA
-- ═══════════════════════════════════════════════════════════════════════