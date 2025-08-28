-- Fisher Backflows Database Schema
-- Run this in your Supabase SQL editor to create the database structure

-- Enable Row Level Security and UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    account_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    next_test_date DATE,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Needs Service')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Devices Table
CREATE TABLE IF NOT EXISTS devices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    location TEXT NOT NULL,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    size VARCHAR(20) NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    install_date DATE NOT NULL,
    last_test_date DATE,
    next_test_date DATE,
    status VARCHAR(20) DEFAULT 'Passed' CHECK (status IN ('Passed', 'Failed', 'Needs Repair')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    test_duration INTEGER NOT NULL, -- in minutes
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
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Overdue', 'Cancelled')),
    services JSONB NOT NULL,
    notes TEXT,
    paid_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    service_type VARCHAR(100) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration INTEGER DEFAULT 60, -- in minutes
    status VARCHAR(20) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled')),
    device_location TEXT,
    notes TEXT,
    technician VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_account_number ON customers(account_number);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_devices_customer_id ON devices(customer_id);
CREATE INDEX IF NOT EXISTS idx_devices_serial_number ON devices(serial_number);
CREATE INDEX IF NOT EXISTS idx_test_reports_customer_id ON test_reports(customer_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_device_id ON test_reports(device_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_test_date ON test_reports(test_date);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_reports_updated_at BEFORE UPDATE ON test_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO customers (account_number, name, email, phone, address, next_test_date, status) VALUES
('FB001', 'John Smith', 'john.smith@email.com', '(253) 555-0123', '123 Main St, Tacoma, WA 98401', '2025-01-15', 'Active'),
('FB002', 'Jane Doe', 'jane.doe@email.com', '(253) 555-0124', '456 Oak Ave, Tacoma, WA 98402', '2025-02-01', 'Active'),
('FB003', 'Bob Johnson', 'bob.johnson@email.com', '(253) 555-0125', '789 Pine St, Tacoma, WA 98403', '2025-01-30', 'Active');

-- Get customer IDs for sample data
WITH customer_ids AS (
    SELECT id, account_number FROM customers WHERE account_number IN ('FB001', 'FB002', 'FB003')
)
INSERT INTO devices (customer_id, location, serial_number, size, make, model, install_date, last_test_date, next_test_date, status)
SELECT 
    c.id,
    CASE c.account_number
        WHEN 'FB001' THEN '123 Main St - Backyard'
        WHEN 'FB002' THEN '456 Oak Ave - Front Yard'
        WHEN 'FB003' THEN '789 Pine St - Side Yard'
    END,
    'BF-2023-' || LPAD((ROW_NUMBER() OVER())::text, 3, '0'),
    '3/4"',
    'Watts',
    'Series 909',
    '2023-01-15'::date,
    '2024-01-15'::date,
    CASE c.account_number
        WHEN 'FB001' THEN '2025-01-15'::date
        WHEN 'FB002' THEN '2025-02-01'::date
        WHEN 'FB003' THEN '2025-01-30'::date
    END,
    'Passed'
FROM customer_ids c;

-- Insert sample appointments
WITH customer_ids AS (
    SELECT id, account_number FROM customers WHERE account_number = 'FB001'
)
INSERT INTO appointments (customer_id, service_type, appointment_date, appointment_time, duration, status, device_location, technician)
SELECT 
    c.id,
    'Annual Test',
    '2025-01-15'::date,
    '10:00'::time,
    60,
    'Scheduled',
    '123 Main St - Backyard',
    'Mike Fisher'
FROM customer_ids c;

-- Insert sample test reports
WITH customer_device AS (
    SELECT c.id as customer_id, d.id as device_id
    FROM customers c
    JOIN devices d ON c.id = d.customer_id
    WHERE c.account_number = 'FB001'
    LIMIT 1
)
INSERT INTO test_reports (customer_id, device_id, test_date, test_type, initial_pressure, final_pressure, test_duration, status, technician, submitted, submitted_date)
SELECT 
    cd.customer_id,
    cd.device_id,
    '2024-01-15'::date,
    'Annual Test',
    15.0,
    14.5,
    15,
    'Passed',
    'Mike Fisher',
    TRUE,
    '2024-01-15'::timestamp
FROM customer_device cd;

-- Row Level Security policies (optional - enable if you want user-level security)
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE test_reports ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Leads and Customer Acquisition Tables
CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    property_type VARCHAR(50) DEFAULT 'Residential',
    lead_source VARCHAR(100) NOT NULL,
    estimated_devices INTEGER DEFAULT 1,
    estimated_value DECIMAL(10,2) DEFAULT 0,
    priority INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'New Lead',
    notes TEXT,
    customer_id UUID REFERENCES customers(id),
    converted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead Follow-ups
CREATE TABLE IF NOT EXISTS lead_follow_ups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Processing
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50) NOT NULL,
    payment_intent_id VARCHAR(255),
    payment_method_id VARCHAR(255),
    payment_link TEXT,
    failure_reason TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Water Department Submissions
CREATE TABLE IF NOT EXISTS water_department_submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    test_report_id UUID NOT NULL REFERENCES test_reports(id) ON DELETE CASCADE,
    water_district VARCHAR(255) NOT NULL,
    submission_method VARCHAR(50) NOT NULL,
    confirmation_number VARCHAR(255),
    status VARCHAR(50) DEFAULT 'submitted',
    response_data JSONB,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Logs
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    email_type VARCHAR(100) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'sent',
    message_id VARCHAR(255),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduled Reminders
CREATE TABLE IF NOT EXISTS scheduled_reminders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    reminder_type VARCHAR(100) NOT NULL,
    scheduled_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automation Logs
CREATE TABLE IF NOT EXISTS automation_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trigger_type VARCHAR(100) NOT NULL,
    trigger_data JSONB,
    results JSONB,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketing Campaigns (for future use)
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    target_audience TEXT,
    content JSONB,
    status VARCHAR(50) DEFAULT 'draft',
    scheduled_date DATE,
    sent_count INTEGER DEFAULT 0,
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_lead_follow_ups_scheduled_date ON lead_follow_ups(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_water_submissions_test_report ON water_department_submissions(test_report_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_date ON scheduled_reminders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_status ON scheduled_reminders(status);
CREATE INDEX IF NOT EXISTS idx_automation_logs_trigger ON automation_logs(trigger_type);

-- Create triggers for automation tables
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample automation data
INSERT INTO leads (name, email, phone, address, property_type, lead_source, estimated_devices, priority, status) VALUES
('Sarah Johnson', 'sarah.j@email.com', '(253) 555-0150', '789 Oak Street, Tacoma, WA 98404', 'Residential', 'Website', 1, 3, 'New Lead'),
('Pacific Properties LLC', 'info@pacificprops.com', '(253) 555-0160', '1000 Commerce Blvd, Tacoma, WA 98402', 'Commercial', 'Referral', 5, 5, 'Qualified'),
('Green Valley Apartments', 'manager@greenvalley.com', '(253) 555-0170', '500 Valley View Dr, Lakewood, WA 98499', 'Multi-unit', 'Cold Call', 12, 4, 'New Lead');

-- Insert sample scheduled reminders
INSERT INTO scheduled_reminders (customer_id, reminder_type, scheduled_date, message, status) VALUES
((SELECT id FROM customers WHERE account_number = 'FB001'), 'annual_test_due', '2025-12-15', 'Your annual backflow test is due soon. Schedule now to stay compliant.', 'scheduled');

COMMIT;