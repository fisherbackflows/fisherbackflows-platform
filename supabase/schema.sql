-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_number VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  phone VARCHAR NOT NULL,
  address TEXT NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0.00,
  next_test_date DATE,
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Needs Service')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  serial_number VARCHAR UNIQUE NOT NULL,
  size VARCHAR NOT NULL,
  make VARCHAR NOT NULL,
  model VARCHAR NOT NULL,
  install_date DATE NOT NULL,
  last_test_date DATE,
  next_test_date DATE,
  status VARCHAR(20) DEFAULT 'Passed' CHECK (status IN ('Passed', 'Failed', 'Needs Repair')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create test_reports table
CREATE TABLE IF NOT EXISTS test_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  test_date DATE NOT NULL,
  test_type VARCHAR NOT NULL,
  initial_pressure DECIMAL(5,2) NOT NULL,
  final_pressure DECIMAL(5,2) NOT NULL,
  test_duration INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('Passed', 'Failed', 'Needs Repair')),
  technician VARCHAR NOT NULL,
  notes TEXT,
  water_district VARCHAR,
  submitted BOOLEAN DEFAULT FALSE,
  submitted_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  invoice_number VARCHAR UNIQUE NOT NULL,
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

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  service_type VARCHAR NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration INTEGER DEFAULT 60,
  status VARCHAR(20) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled')),
  device_location TEXT,
  notes TEXT,
  technician VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_account_number ON customers(account_number);
CREATE INDEX IF NOT EXISTS idx_devices_customer_id ON devices(customer_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_customer_id ON test_reports(customer_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_device_id ON test_reports(device_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_reports_updated_at BEFORE UPDATE ON test_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO customers (account_number, name, email, phone, address, balance, next_test_date, status) VALUES
('FB001', 'John Smith', 'john.smith@email.com', '555-0123', '123 Main St, City, State 12345', 0.00, '2025-01-15', 'Active'),
('FB002', 'ABC Corporation', 'admin@abccorp.com', '555-0456', '456 Business Ave, City, State 12345', 150.00, '2025-03-20', 'Needs Service');

INSERT INTO devices (customer_id, location, serial_number, size, make, model, install_date, last_test_date, next_test_date, status) VALUES
((SELECT id FROM customers WHERE account_number = 'FB001'), '123 Main St - Backyard', 'BF-2023-001', '3/4"', 'Watts', 'Series 909', '2023-01-15', '2024-01-15', '2025-01-15', 'Passed'),
((SELECT id FROM customers WHERE account_number = 'FB002'), '456 Business Ave - Main Building', 'BF-2023-002', '1"', 'Zurn Wilkins', '350XL', '2023-03-20', '2024-03-20', '2025-03-20', 'Failed');

INSERT INTO test_reports (customer_id, device_id, test_date, test_type, initial_pressure, final_pressure, test_duration, status, technician, notes, water_district, submitted, submitted_date) VALUES
((SELECT id FROM customers WHERE account_number = 'FB001'), (SELECT id FROM devices WHERE serial_number = 'BF-2023-001'), '2024-01-15', 'Annual Test', 15.2, 14.8, 600, 'Passed', 'Mike Fisher', 'Device functioning properly', 'Metro Water District', TRUE, '2024-01-15');

INSERT INTO invoices (customer_id, invoice_number, issue_date, due_date, amount, status, services, notes, paid_date) VALUES
((SELECT id FROM customers WHERE account_number = 'FB002'), 'INV-2024-001', '2024-03-20', '2024-04-20', 150.00, 'Pending', '[{"description": "Annual Backflow Test - 1\" Device", "quantity": 1, "rate": 150, "total": 150}]', 'Device failed initial test, requires repair', NULL),
((SELECT id FROM customers WHERE account_number = 'FB001'), 'INV-2024-002', '2024-01-15', '2024-02-15', 75.00, 'Paid', '[{"description": "Annual Backflow Test - 3/4\" Device", "quantity": 1, "rate": 75, "total": 75}]', NULL, '2024-01-18');

INSERT INTO appointments (customer_id, service_type, appointment_date, appointment_time, duration, status, device_location, notes, technician) VALUES
((SELECT id FROM customers WHERE account_number = 'FB001'), 'Annual Test', '2024-12-28', '10:00', 60, 'Scheduled', '123 Main St - Backyard', 'Call before arrival', 'Mike Fisher'),
((SELECT id FROM customers WHERE account_number = 'FB002'), 'Repair & Retest', '2024-12-30', '14:00', 90, 'Confirmed', '456 Business Ave - Main Building', 'Device failed previous test', 'Mike Fisher');

-- Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- SECURE ROW LEVEL SECURITY POLICIES

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

-- Create default organization and update existing data
INSERT INTO organizations (id, name, domain) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Fisher Backflows', 'fisherbackflows.com')
ON CONFLICT DO NOTHING;

-- Update existing data with organization_id
UPDATE customers SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE devices SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE test_reports SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE invoices SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE appointments SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

-- Create indexes for security and performance
CREATE INDEX IF NOT EXISTS idx_customers_organization_id ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_devices_organization_id ON devices(organization_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_organization_id ON test_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_appointments_organization_id ON appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth.users(email);