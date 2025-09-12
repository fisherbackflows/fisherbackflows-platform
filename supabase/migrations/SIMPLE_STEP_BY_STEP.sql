-- SIMPLE STEP-BY-STEP MIGRATION
-- Execute each section separately to isolate any issues

-- ===== STEP 1: EXTENSIONS =====
-- Run this first, then verify no errors before proceeding
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===== STEP 2: BASE ORGANIZATION TABLE =====  
-- Run this second, then check if table exists before proceeding
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    subscription_status VARCHAR DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default organization
INSERT INTO organizations (id, name, subscription_status)
VALUES ('11111111-1111-1111-1111-111111111111', 'Fisher Backflows', 'active')
ON CONFLICT (id) DO NOTHING;

-- VERIFY: SELECT * FROM organizations; should show Fisher Backflows

-- ===== STEP 3: TEAM USERS TABLE =====
-- Run this third
CREATE TABLE IF NOT EXISTS team_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR UNIQUE NOT NULL,
    first_name VARCHAR,
    last_name VARCHAR,
    role VARCHAR DEFAULT 'technician',
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VERIFY: SELECT COUNT(*) FROM team_users; should return 0

-- ===== STEP 4: CUSTOMERS TABLE =====  
-- Run this fourth
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    email VARCHAR,
    phone VARCHAR,
    address_line1 VARCHAR,
    city VARCHAR,
    state VARCHAR,
    zip_code VARCHAR,
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VERIFY: SELECT COUNT(*) FROM customers; should work without error

-- ===== STEP 5: DEVICES TABLE =====
-- Run this fifth
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    location VARCHAR NOT NULL,
    device_type VARCHAR NOT NULL,
    manufacturer VARCHAR,
    model VARCHAR,
    serial_number VARCHAR,
    status VARCHAR DEFAULT 'active',
    organization_id UUID REFERENCES organizations(id) DEFAULT '11111111-1111-1111-1111-111111111111',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VERIFY: SELECT COUNT(*) FROM devices; should work without error

-- ===== STEP 6: BASIC RLS =====
-- Run this sixth
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_users ENABLE ROW LEVEL SECURITY;  
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- ===== STEP 7: SERVICE ROLE POLICIES =====
-- Run this seventh
CREATE POLICY "Service role access organizations" ON organizations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role access team_users" ON team_users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role access customers" ON customers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role access devices" ON devices FOR ALL USING (auth.role() = 'service_role');

-- ===== FINAL VERIFICATION =====
-- Run this last to verify everything worked
SELECT 
    'organizations' as table_name, COUNT(*) as row_count 
FROM organizations
UNION ALL
SELECT 
    'team_users' as table_name, COUNT(*) as row_count 
FROM team_users
UNION ALL
SELECT 
    'customers' as table_name, COUNT(*) as row_count 
FROM customers
UNION ALL
SELECT 
    'devices' as table_name, COUNT(*) as row_count 
FROM devices;

-- Should return 4 rows showing all tables exist