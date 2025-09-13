-- ===================================================================
-- RLS VERIFICATION QUERIES
-- ===================================================================
-- Run these queries in Supabase SQL Editor after RLS implementation
-- to verify everything is working correctly
-- ===================================================================

-- 1. CHECK RLS STATUS ON ALL TABLES
-- ===================================================================
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. LIST ALL RLS POLICIES
-- ===================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. CHECK HELPER FUNCTIONS EXIST
-- ===================================================================
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'auth' 
AND routine_name IN ('is_team_member', 'is_admin', 'is_customer')
ORDER BY routine_name;

-- 4. VERIFY CRITICAL TABLES HAVE RLS
-- ===================================================================
-- These are the most critical tables that MUST have RLS enabled
SELECT 
    'customers' as table_name,
    CASE WHEN rowsecurity THEN '✅ PROTECTED' ELSE '❌ EXPOSED' END as status
FROM pg_tables WHERE tablename = 'customers' AND schemaname = 'public'
UNION ALL
SELECT 
    'devices' as table_name,
    CASE WHEN rowsecurity THEN '✅ PROTECTED' ELSE '❌ EXPOSED' END as status
FROM pg_tables WHERE tablename = 'devices' AND schemaname = 'public'
UNION ALL
SELECT 
    'appointments' as table_name,
    CASE WHEN rowsecurity THEN '✅ PROTECTED' ELSE '❌ EXPOSED' END as status
FROM pg_tables WHERE tablename = 'appointments' AND schemaname = 'public'
UNION ALL
SELECT 
    'test_reports' as table_name,
    CASE WHEN rowsecurity THEN '✅ PROTECTED' ELSE '❌ EXPOSED' END as status
FROM pg_tables WHERE tablename = 'test_reports' AND schemaname = 'public'
UNION ALL
SELECT 
    'invoices' as table_name,
    CASE WHEN rowsecurity THEN '✅ PROTECTED' ELSE '❌ EXPOSED' END as status
FROM pg_tables WHERE tablename = 'invoices' AND schemaname = 'public'
UNION ALL
SELECT 
    'payments' as table_name,
    CASE WHEN rowsecurity THEN '✅ PROTECTED' ELSE '❌ EXPOSED' END as status
FROM pg_tables WHERE tablename = 'payments' AND schemaname = 'public'
UNION ALL
SELECT 
    'security_logs' as table_name,
    CASE WHEN rowsecurity THEN '✅ PROTECTED' ELSE '❌ EXPOSED' END as status
FROM pg_tables WHERE tablename = 'security_logs' AND schemaname = 'public'
UNION ALL
SELECT 
    'audit_logs' as table_name,
    CASE WHEN rowsecurity THEN '✅ PROTECTED' ELSE '❌ EXPOSED' END as status
FROM pg_tables WHERE tablename = 'audit_logs' AND schemaname = 'public';

-- 5. TEST CUSTOMER DATA ISOLATION (AS AUTHENTICATED USER)
-- ===================================================================
-- This should only return current user's data when run as a customer
-- Note: This will fail if no user is authenticated
/*
SELECT 
    'Current user can see their own data' as test,
    COUNT(*) as count
FROM customers 
WHERE id = auth.uid();

-- This should return 0 for customers (no access to other customers)
SELECT 
    'Current user CANNOT see other customers data' as test,
    COUNT(*) as count
FROM customers 
WHERE id != auth.uid();
*/

-- 6. SECURITY SUMMARY
-- ===================================================================
SELECT 
    'RLS_IMPLEMENTATION_STATUS' as check_type,
    CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND rowsecurity = true
        ) >= 20 THEN '✅ SUCCESS - Multiple tables protected'
        WHEN (
            SELECT COUNT(*) 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND rowsecurity = true
        ) > 0 THEN '⚠️ PARTIAL - Some tables protected'
        ELSE '❌ FAILED - No tables protected'
    END as status,
    (
        SELECT COUNT(*) 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND rowsecurity = true
    ) as tables_with_rls,
    (
        SELECT COUNT(*) 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) as total_policies;

-- ===================================================================
-- EXPECTED RESULTS AFTER SUCCESSFUL IMPLEMENTATION:
-- ===================================================================
-- Query 1: Should show ~25 tables with rls_enabled = true
-- Query 2: Should show ~50+ policies across all tables
-- Query 3: Should show 3 functions: is_team_member, is_admin, is_customer
-- Query 4: Should show all critical tables as ✅ PROTECTED
-- Query 6: Should show ✅ SUCCESS status with 25+ tables and 50+ policies
-- ===================================================================