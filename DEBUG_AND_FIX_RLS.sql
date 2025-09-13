-- ===================================================================
-- DEBUG AND FIX RLS POLICIES
-- ===================================================================
-- The policies exist but aren't working - let's fix them
-- ===================================================================

-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('customers', 'devices', 'appointments', 'test_reports', 'invoices', 'payments')
ORDER BY tablename, policyname;

-- Check if RLS is actually enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('customers', 'devices', 'appointments', 'test_reports', 'invoices', 'payments')
ORDER BY tablename;

-- Force enable RLS on all tables (in case it's not actually enabled)
ALTER TABLE public.devices FORCE ROW LEVEL SECURITY;
ALTER TABLE public.appointments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.test_reports FORCE ROW LEVEL SECURITY;
ALTER TABLE public.invoices FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payments FORCE ROW LEVEL SECURITY;

-- Verification query
SELECT 'RLS Debug Complete - Check Results Above' as status;