-- ==========================================
-- FISHER BACKFLOWS PLATFORM - CRITICAL SECURITY LOCKDOWN
-- ==========================================
-- PRODUCTION DEPLOYMENT SCRIPT
-- Execute in this exact order - DO NOT SKIP STEPS
-- ==========================================

-- Step 1: Create security backup and rollback capability
CREATE SCHEMA IF NOT EXISTS security_backup;

-- Backup current policies before changes
CREATE TABLE security_backup.current_policies AS 
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN (
    'customers', 'billing_invoices', 'security_logs', 
    'technician_current_location', 'technician_locations',
    'payments', 'invoices', 'appointments', 'test_reports'
);

-- Log the security lockdown start
INSERT INTO audit_logs (table_name, action, details, created_by, created_at)
VALUES ('SECURITY_LOCKDOWN', 'STARTED', 
        'Critical security lockdown initiated - Phase 1 Sprint 1A', 
        'system', NOW());

-- ==========================================
-- STEP 2: CRITICAL RLS POLICY IMPLEMENTATION
-- ==========================================

-- BILLING_INVOICES - CRITICAL: Payment data currently exposed
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start clean
DROP POLICY IF EXISTS "billing_invoices_customer_access" ON billing_invoices;
DROP POLICY IF EXISTS "billing_invoices_admin_access" ON billing_invoices;

-- Create bulletproof billing access policies
CREATE POLICY "billing_invoices_customer_access" 
ON billing_invoices 
FOR ALL TO authenticated
USING (
    customer_id IN (
        SELECT id FROM customers 
        WHERE auth_user_id = auth.uid()
    ) OR 
    -- Admin access for team members
    EXISTS (
        SELECT 1 FROM team_users 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'manager', 'tester')
    )
)
WITH CHECK (
    customer_id IN (
        SELECT id FROM customers 
        WHERE auth_user_id = auth.uid()
    ) OR 
    EXISTS (
        SELECT 1 FROM team_users 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'manager')
    )
);

-- Service role full access for system operations
CREATE POLICY "billing_invoices_service_role" 
ON billing_invoices 
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- SECURITY_LOGS - CRITICAL: Audit data currently exposed  
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "security_logs_admin_only" ON security_logs;

-- Only admin team members can view security logs
CREATE POLICY "security_logs_admin_only" 
ON security_logs 
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_users 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Service role for system logging
CREATE POLICY "security_logs_service_role" 
ON security_logs 
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- TECHNICIAN_CURRENT_LOCATION - CRITICAL: GPS data exposed
ALTER TABLE technician_current_location ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "technician_location_self_access" ON technician_current_location;
DROP POLICY IF EXISTS "technician_location_admin_access" ON technician_current_location;

-- Technicians can only access their own location
CREATE POLICY "technician_location_self_access" 
ON technician_current_location 
FOR ALL TO authenticated
USING (
    technician_id = auth.uid()::text OR
    -- Admin access for dispatching
    EXISTS (
        SELECT 1 FROM team_users 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'manager')
    )
);

CREATE POLICY "technician_location_service_role" 
ON technician_current_location 
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- TECHNICIAN_LOCATIONS - CRITICAL: Location history exposed
ALTER TABLE technician_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "technician_history_self_access" ON technician_locations;

CREATE POLICY "technician_history_self_access" 
ON technician_locations 
FOR ALL TO authenticated
USING (
    technician_id = auth.uid()::text OR
    EXISTS (
        SELECT 1 FROM team_users 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'manager')
    )
);

CREATE POLICY "technician_history_service_role" 
ON technician_locations 
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- ==========================================
-- STEP 3: ADDITIONAL CRITICAL TABLE SECURITY
-- ==========================================

-- PAYMENTS - Financial data protection
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_customer_access" 
ON payments 
FOR SELECT TO authenticated
USING (
    customer_id IN (
        SELECT id FROM customers 
        WHERE auth_user_id = auth.uid()
    ) OR 
    EXISTS (
        SELECT 1 FROM team_users 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'manager')
    )
);

-- INVOICES - Invoice data protection
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_customer_access" 
ON invoices 
FOR SELECT TO authenticated
USING (
    customer_id IN (
        SELECT id FROM customers 
        WHERE auth_user_id = auth.uid()
    ) OR 
    EXISTS (
        SELECT 1 FROM team_users 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'manager', 'tester')
    )
);

-- APPOINTMENTS - Access control for appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_access" 
ON appointments 
FOR ALL TO authenticated
USING (
    -- Customers can see their own appointments
    customer_id IN (
        SELECT id FROM customers 
        WHERE auth_user_id = auth.uid()
    ) OR
    -- Assigned technicians can see their appointments
    technician_id = auth.uid()::text OR
    -- Team members can see all appointments
    EXISTS (
        SELECT 1 FROM team_users 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'manager', 'tester')
    )
);

-- TEST_REPORTS - Test data protection
ALTER TABLE test_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "test_reports_access" 
ON test_reports 
FOR SELECT TO authenticated
USING (
    -- Customers can see their own test reports
    customer_id IN (
        SELECT id FROM customers 
        WHERE auth_user_id = auth.uid()
    ) OR
    -- Team members can see all reports
    EXISTS (
        SELECT 1 FROM team_users 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'manager', 'tester')
    )
);

-- ==========================================
-- STEP 4: FIX CRITICAL FUNCTION SECURITY ISSUES
-- ==========================================

-- Fix the update_updated_at_column function security issue
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = '';

-- ==========================================
-- STEP 5: CREATE SECURITY HELPER FUNCTIONS
-- ==========================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_users 
        WHERE team_users.user_id = is_admin.user_id 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = '';

-- Function to check if user is team member
CREATE OR REPLACE FUNCTION is_team_member(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_users 
        WHERE team_users.user_id = is_team_member.user_id 
        AND role IN ('admin', 'manager', 'tester')
    );
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = '';

-- ==========================================
-- STEP 6: PERFORMANCE OPTIMIZATION FOR SECURITY
-- ==========================================

-- Create indexes for policy performance
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON customers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_team_users_user_id_role ON team_users(user_id, role);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_customer_id ON billing_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_technician_locations_technician_id ON technician_locations(technician_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_technician_id ON appointments(technician_id);

-- ==========================================
-- STEP 7: VALIDATION AND VERIFICATION
-- ==========================================

-- Create security validation view
CREATE OR REPLACE VIEW security_status AS
SELECT 
    t.table_name,
    CASE WHEN t.row_security = 'YES' THEN 'ENABLED' ELSE 'DISABLED' END as rls_status,
    COUNT(p.policyname) as policy_count,
    ARRAY_AGG(p.policyname) as policies
FROM information_schema.tables t
LEFT JOIN pg_policies p ON t.table_name = p.tablename
WHERE t.table_schema = 'public' 
AND t.table_name IN (
    'customers', 'billing_invoices', 'security_logs', 
    'technician_current_location', 'technician_locations',
    'payments', 'invoices', 'appointments', 'test_reports'
)
GROUP BY t.table_name, t.row_security
ORDER BY t.table_name;

-- Log successful completion
INSERT INTO audit_logs (table_name, action, details, created_by, created_at)
VALUES ('SECURITY_LOCKDOWN', 'COMPLETED', 
        'Critical security lockdown completed successfully - All RLS policies implemented', 
        'system', NOW());

-- Display final security status
SELECT 
    'SECURITY LOCKDOWN COMPLETED' as status,
    NOW() as completed_at;

-- Show security status for verification
SELECT * FROM security_status;

-- ==========================================
-- ROLLBACK SCRIPT (SAVE SEPARATELY)
-- ==========================================
/*
-- EMERGENCY ROLLBACK SCRIPT - ONLY USE IF ISSUES OCCUR
-- Save this as rollback-security-changes.sql

-- Disable all new RLS policies
ALTER TABLE billing_invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE technician_current_location DISABLE ROW LEVEL SECURITY;
ALTER TABLE technician_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE test_reports DISABLE ROW LEVEL SECURITY;

-- Log rollback
INSERT INTO audit_logs (table_name, action, details, created_by, created_at)
VALUES ('SECURITY_LOCKDOWN', 'ROLLBACK', 'Security policies rolled back', 'system', NOW());
*/