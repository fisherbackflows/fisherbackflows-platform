-- Team Authentication Database Schema
-- Critical update for Fisher Backflows Team App

-- Team Users table with role-based access
CREATE TABLE team_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'tester')),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    license_number TEXT, -- Only for testers
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Update test_reports table to include tester attribution
ALTER TABLE test_reports ADD COLUMN IF NOT EXISTS tester_id UUID REFERENCES team_users(id);
ALTER TABLE test_reports ADD COLUMN IF NOT EXISTS tester_name TEXT;
ALTER TABLE test_reports ADD COLUMN IF NOT EXISTS tester_license TEXT;

-- Time off requests table
CREATE TABLE time_off_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tester_id UUID NOT NULL REFERENCES team_users(id),
    request_date DATE NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    approved_by UUID REFERENCES team_users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tester schedules table for daily routing
CREATE TABLE tester_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tester_id UUID NOT NULL REFERENCES team_users(id),
    schedule_date DATE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    appointment_time TIME,
    estimated_duration INTEGER DEFAULT 45, -- minutes
    travel_time INTEGER, -- minutes from previous location
    priority INTEGER DEFAULT 1, -- for routing optimization
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tester_id, schedule_date, appointment_time)
);

-- Team sessions for authentication
CREATE TABLE team_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_user_id UUID NOT NULL REFERENCES team_users(id),
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert admin user (admin@fisherbackflows.com / password)
INSERT INTO team_users (
    email, 
    password_hash, 
    role, 
    first_name, 
    last_name, 
    is_active
) VALUES (
    'admin@fisherbackflows.com',
    '$2b$12$iSDWpeuhS8wOhLAfiun1aebJISsjGFU/dAj/kiScx0dpEToRXTTii', -- bcrypt hash for 'password'
    'admin',
    'Admin',
    'Fisher',
    true
) ON CONFLICT (email) DO NOTHING;

-- Indexes for performance
CREATE INDEX idx_team_users_email ON team_users(email);
CREATE INDEX idx_team_users_role ON team_users(role);
CREATE INDEX idx_team_sessions_token ON team_sessions(session_token);
CREATE INDEX idx_team_sessions_user ON team_sessions(team_user_id);
CREATE INDEX idx_time_off_requests_tester ON time_off_requests(tester_id);
CREATE INDEX idx_time_off_requests_date ON time_off_requests(request_date);
CREATE INDEX idx_tester_schedules_tester_date ON tester_schedules(tester_id, schedule_date);
CREATE INDEX idx_test_reports_tester ON test_reports(tester_id);

-- Row Level Security (RLS) policies
ALTER TABLE team_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tester_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_sessions ENABLE ROW LEVEL SECURITY;

-- Admin can see everything
CREATE POLICY team_users_admin_all ON team_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM team_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Testers can only see their own data
CREATE POLICY team_users_tester_own ON team_users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY time_off_tester_own ON time_off_requests
    FOR ALL USING (tester_id = auth.uid());

CREATE POLICY schedule_tester_own ON tester_schedules
    FOR SELECT USING (tester_id = auth.uid());

-- Admin can manage all schedules
CREATE POLICY schedule_admin_all ON tester_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM team_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );