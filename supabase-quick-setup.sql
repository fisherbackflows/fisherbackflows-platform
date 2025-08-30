-- Fisher Backflows Quick Database Setup
-- Run this in Supabase SQL Editor after creating your project

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create all tables
\i '/supabase/migrations/001_consolidated_schema.sql';

-- Enable Row Level Security on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_users ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for development
-- (In production, use more restrictive policies)

-- Allow authenticated users to read their own customer data
CREATE POLICY "Users can view own customer data" ON customers
    FOR SELECT USING (auth.uid()::text = id::text OR true); -- Temporary: allow all for dev

-- Allow all operations for development (RESTRICT IN PRODUCTION!)
CREATE POLICY "Dev - Allow all on devices" ON devices
    FOR ALL USING (true);

CREATE POLICY "Dev - Allow all on test_reports" ON test_reports
    FOR ALL USING (true);

CREATE POLICY "Dev - Allow all on invoices" ON invoices
    FOR ALL USING (true);

CREATE POLICY "Dev - Allow all on appointments" ON appointments
    FOR ALL USING (true);

CREATE POLICY "Dev - Allow all on team_users" ON team_users
    FOR ALL USING (true);

-- Create a test customer
INSERT INTO customers (account_number, name, email, phone, address, status)
VALUES 
    ('TEST001', 'Test Customer', 'test@example.com', '555-0100', '123 Test St, City, ST 12345', 'Active');

-- Create a test team user (password: 'password123')
INSERT INTO team_users (email, password_hash, role, first_name, last_name)
VALUES 
    ('admin@fisherbackflows.com', '$2a$10$rBV2JDeWW3.vKyeQcM8fFO4777l4bVeQgDL6VZkqPqhN9dAMhWGEy', 'admin', 'Admin', 'User');

COMMIT;