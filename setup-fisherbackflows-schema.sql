-- Fisher Backflows Database Schema Setup
-- Run this in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create customers table if not exists
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

-- Create team_users table
CREATE TABLE IF NOT EXISTS team_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'tester')),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    license_number TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_users ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for development
CREATE POLICY "Allow all for dev" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all for dev" ON devices FOR ALL USING (true);
CREATE POLICY "Allow all for dev" ON test_reports FOR ALL USING (true);
CREATE POLICY "Allow all for dev" ON invoices FOR ALL USING (true);
CREATE POLICY "Allow all for dev" ON appointments FOR ALL USING (true);
CREATE POLICY "Allow all for dev" ON team_users FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_account_number ON customers(account_number);
CREATE INDEX IF NOT EXISTS idx_devices_customer_id ON devices(customer_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_customer_id ON test_reports(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);

-- Insert test data
INSERT INTO customers (account_number, name, email, phone, address, status)
VALUES 
    ('FB001', 'Demo Customer', 'demo@fisherbackflows.com', '555-0100', '123 Main St, City, ST 12345', 'Active')
ON CONFLICT (email) DO NOTHING;

-- Insert admin user (password: 'admin123')
INSERT INTO team_users (email, password_hash, role, first_name, last_name)
VALUES 
    ('admin@fisherbackflows.com', '$2a$10$X4kv7j5ZcQr6Bh6Fz1Dffe.3I8qV3xX.RhKXb.cNpNB.C5.YuRp0m', 'admin', 'Admin', 'User')
ON CONFLICT (email) DO NOTHING;