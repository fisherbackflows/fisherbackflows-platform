-- ==========================================
-- EMERGENCY ROLLBACK SCRIPT
-- ==========================================
-- ONLY USE IF CRITICAL ISSUES OCCUR WITH SECURITY LOCKDOWN
-- This will revert all security changes made by CRITICAL-SECURITY-LOCKDOWN.sql
-- ==========================================

-- Log the rollback initiation
INSERT INTO audit_logs (table_name, action, details, created_by, created_at)
VALUES ('SECURITY_ROLLBACK', 'STARTED', 
        'Emergency rollback of security lockdown initiated', 
        'system', NOW());

-- ==========================================
-- STEP 1: DISABLE ALL NEW RLS POLICIES
-- ==========================================

-- Disable RLS on all tables we secured
ALTER TABLE billing_invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE technician_current_location DISABLE ROW LEVEL SECURITY;
ALTER TABLE technician_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE test_reports DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- STEP 2: DROP ALL SECURITY POLICIES
-- ==========================================

-- Drop billing_invoices policies
DROP POLICY IF EXISTS "billing_invoices_customer_access" ON billing_invoices;
DROP POLICY IF EXISTS "billing_invoices_service_role" ON billing_invoices;

-- Drop security_logs policies
DROP POLICY IF EXISTS "security_logs_admin_only" ON security_logs;
DROP POLICY IF EXISTS "security_logs_service_role" ON security_logs;

-- Drop technician location policies
DROP POLICY IF EXISTS "technician_location_self_access" ON technician_current_location;
DROP POLICY IF EXISTS "technician_location_service_role" ON technician_current_location;
DROP POLICY IF EXISTS "technician_history_self_access" ON technician_locations;
DROP POLICY IF EXISTS "technician_history_service_role" ON technician_locations;

-- Drop payment and invoice policies
DROP POLICY IF EXISTS "payments_customer_access" ON payments;
DROP POLICY IF EXISTS "invoices_customer_access" ON invoices;

-- Drop appointment and test report policies
DROP POLICY IF EXISTS "appointments_access" ON appointments;
DROP POLICY IF EXISTS "test_reports_access" ON test_reports;

-- ==========================================
-- STEP 3: RESTORE ORIGINAL FUNCTION
-- ==========================================

-- Restore original update_updated_at_column function (without security fix)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- STEP 4: DROP SECURITY HELPER FUNCTIONS
-- ==========================================

DROP FUNCTION IF EXISTS is_admin(UUID);
DROP FUNCTION IF EXISTS is_team_member(UUID);

-- ==========================================
-- STEP 5: DROP SECURITY INDEXES
-- ==========================================

-- Drop performance indexes we created for security
DROP INDEX IF EXISTS idx_customers_auth_user_id;
DROP INDEX IF EXISTS idx_team_users_user_id_role;
DROP INDEX IF EXISTS idx_billing_invoices_customer_id;
DROP INDEX IF EXISTS idx_technician_locations_technician_id;
DROP INDEX IF EXISTS idx_appointments_customer_id;
DROP INDEX IF EXISTS idx_appointments_technician_id;

-- ==========================================
-- STEP 6: DROP SECURITY VIEWS
-- ==========================================

DROP VIEW IF EXISTS security_status;

-- ==========================================
-- STEP 7: FINAL CLEANUP
-- ==========================================

-- Log successful rollback
INSERT INTO audit_logs (table_name, action, details, created_by, created_at)
VALUES ('SECURITY_ROLLBACK', 'COMPLETED', 
        'Emergency rollback completed - All security changes reverted', 
        'system', NOW());

-- Display rollback completion
SELECT 
    'SECURITY ROLLBACK COMPLETED' as status,
    'ALL SECURITY POLICIES REMOVED' as warning,
    'PLATFORM SECURITY IS NOW COMPROMISED' as alert,
    NOW() as completed_at;

-- Show which tables no longer have RLS protection
SELECT 
    table_name,
    'RLS DISABLED - SECURITY COMPROMISED' as security_status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'billing_invoices', 'security_logs', 'technician_current_location',
    'technician_locations', 'payments', 'invoices', 'appointments', 'test_reports'
);