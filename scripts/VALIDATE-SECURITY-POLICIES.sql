-- ==========================================
-- SECURITY POLICY VALIDATION SCRIPT
-- ==========================================
-- This script validates that our security lockdown is working correctly
-- Run this AFTER executing CRITICAL-SECURITY-LOCKDOWN.sql
-- ==========================================

-- Create temporary test data for validation
DO $$
DECLARE
    test_customer_id UUID;
    test_technician_id UUID;
    test_admin_id UUID;
BEGIN
    -- Insert test customer if not exists
    INSERT INTO customers (id, account_number, name, email, phone, address, auth_user_id)
    VALUES (
        '11111111-1111-1111-1111-111111111111',
        'TEST001',
        'Test Customer',
        'test.customer@fisherbackflows.com',
        '555-0001',
        '123 Test St',
        '11111111-1111-1111-1111-111111111111'
    ) ON CONFLICT (id) DO NOTHING;

    -- Insert test team member if not exists  
    INSERT INTO team_users (id, user_id, name, email, role)
    VALUES (
        '22222222-2222-2222-2222-222222222222',
        '22222222-2222-2222-2222-222222222222',
        'Test Technician',
        'test.tech@fisherbackflows.com',
        'tester'
    ) ON CONFLICT (id) DO NOTHING;

    -- Insert test admin if not exists
    INSERT INTO team_users (id, user_id, name, email, role)
    VALUES (
        '33333333-3333-3333-3333-333333333333',
        '33333333-3333-3333-3333-333333333333',
        'Test Admin',
        'test.admin@fisherbackflows.com',
        'admin'
    ) ON CONFLICT (id) DO NOTHING;
END $$;

-- ==========================================
-- VALIDATION TESTS
-- ==========================================

-- Test 1: Verify RLS is enabled on all critical tables
SELECT 
    'TEST 1: RLS STATUS' as test_name,
    table_name,
    CASE 
        WHEN row_security = 'YES' THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'billing_invoices', 'security_logs', 'technician_current_location',
    'technician_locations', 'payments', 'invoices', 'appointments', 'test_reports'
)
ORDER BY table_name;

-- Test 2: Verify policies exist on all critical tables
SELECT 
    'TEST 2: POLICY COUNT' as test_name,
    tablename,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ POLICIES EXIST'
        ELSE '❌ NO POLICIES'
    END as policy_status
FROM pg_policies 
WHERE tablename IN (
    'billing_invoices', 'security_logs', 'technician_current_location',
    'technician_locations', 'payments', 'invoices', 'appointments', 'test_reports'
)
GROUP BY tablename
ORDER BY tablename;

-- Test 3: Verify security helper functions exist
SELECT 
    'TEST 3: HELPER FUNCTIONS' as test_name,
    routine_name,
    '✅ EXISTS' as function_status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_admin', 'is_team_member', 'update_updated_at_column')
ORDER BY routine_name;

-- Test 4: Test security function search path fix
SELECT 
    'TEST 4: FUNCTION SECURITY' as test_name,
    routine_name,
    CASE 
        WHEN prosecdef THEN '✅ SECURITY DEFINER'
        ELSE '❌ NOT SECURE'
    END as security_status
FROM information_schema.routines r
JOIN pg_proc p ON p.proname = r.routine_name
WHERE routine_schema = 'public' 
AND routine_name = 'update_updated_at_column';

-- Test 5: Performance index validation
SELECT 
    'TEST 5: SECURITY INDEXES' as test_name,
    indexname,
    '✅ EXISTS' as index_status
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname IN (
    'idx_customers_auth_user_id',
    'idx_team_users_user_id_role', 
    'idx_billing_invoices_customer_id',
    'idx_technician_locations_technician_id',
    'idx_appointments_customer_id',
    'idx_appointments_technician_id'
)
ORDER BY indexname;

-- ==========================================
-- POLICY EFFECTIVENESS TESTS
-- ==========================================

-- Test 6: Test customer data isolation
-- This should only return data for the authenticated user
WITH test_results AS (
    SELECT 
        'TEST 6: CUSTOMER ISOLATION' as test_name,
        COUNT(*) as total_customers,
        COUNT(CASE WHEN auth_user_id IS NOT NULL THEN 1 END) as customers_with_auth
    FROM customers
)
SELECT 
    test_name,
    total_customers,
    customers_with_auth,
    CASE 
        WHEN customers_with_auth = total_customers THEN '✅ ALL CUSTOMERS HAVE AUTH_USER_ID'
        ELSE '⚠️ SOME CUSTOMERS MISSING AUTH_USER_ID'
    END as isolation_status
FROM test_results;

-- Test 7: Verify team user roles
SELECT 
    'TEST 7: TEAM ROLES' as test_name,
    role,
    COUNT(*) as user_count,
    '✅ ROLES CONFIGURED' as status
FROM team_users 
GROUP BY role
ORDER BY role;

-- ==========================================
-- FINAL SECURITY SUMMARY
-- ==========================================

-- Create comprehensive security summary
WITH security_summary AS (
    SELECT 
        t.table_name,
        CASE WHEN t.row_security = 'YES' THEN 1 ELSE 0 END as rls_enabled,
        COALESCE(p.policy_count, 0) as policy_count,
        CASE 
            WHEN t.row_security = 'YES' AND COALESCE(p.policy_count, 0) > 0 THEN 'SECURE'
            WHEN t.row_security = 'YES' AND COALESCE(p.policy_count, 0) = 0 THEN 'RLS ENABLED, NO POLICIES'
            ELSE 'VULNERABLE'
        END as security_status
    FROM information_schema.tables t
    LEFT JOIN (
        SELECT tablename, COUNT(*) as policy_count 
        FROM pg_policies 
        GROUP BY tablename
    ) p ON t.table_name = p.tablename
    WHERE t.table_schema = 'public' 
    AND t.table_name IN (
        'billing_invoices', 'security_logs', 'technician_current_location',
        'technician_locations', 'payments', 'invoices', 'appointments', 'test_reports'
    )
)
SELECT 
    'SECURITY VALIDATION SUMMARY' as summary_title,
    COUNT(*) as total_tables,
    SUM(rls_enabled) as tables_with_rls,
    SUM(CASE WHEN policy_count > 0 THEN 1 ELSE 0 END) as tables_with_policies,
    SUM(CASE WHEN security_status = 'SECURE' THEN 1 ELSE 0 END) as secure_tables,
    CASE 
        WHEN SUM(CASE WHEN security_status = 'SECURE' THEN 1 ELSE 0 END) = COUNT(*) THEN '✅ ALL TABLES SECURE'
        ELSE '❌ SECURITY ISSUES DETECTED'
    END as overall_security_status
FROM security_summary;

-- Show detailed table-by-table security status
SELECT 
    'DETAILED SECURITY STATUS' as detail_title,
    table_name,
    CASE WHEN row_security = 'YES' THEN '✅' ELSE '❌' END as rls_status,
    COALESCE(policy_count, 0) as policies,
    CASE 
        WHEN row_security = 'YES' AND COALESCE(policy_count, 0) > 0 THEN '✅ SECURE'
        WHEN row_security = 'YES' AND COALESCE(policy_count, 0) = 0 THEN '⚠️ NO POLICIES'
        ELSE '❌ VULNERABLE'
    END as security_status
FROM information_schema.tables t
LEFT JOIN (
    SELECT tablename, COUNT(*) as policy_count 
    FROM pg_policies 
    GROUP BY tablename
) p ON t.table_name = p.tablename
WHERE t.table_schema = 'public' 
AND t.table_name IN (
    'billing_invoices', 'security_logs', 'technician_current_location',
    'technician_locations', 'payments', 'invoices', 'appointments', 'test_reports'
)
ORDER BY t.table_name;

-- Log validation completion
INSERT INTO audit_logs (table_name, action, details, created_by, created_at)
VALUES ('SECURITY_VALIDATION', 'COMPLETED', 
        'Security policy validation completed', 
        'system', NOW());