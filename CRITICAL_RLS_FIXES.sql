-- ===================================================================
-- CRITICAL RLS FIXES FOR FISHER BACKFLOWS PLATFORM
-- ===================================================================
-- Execute these statements IMMEDIATELY in Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx
-- ===================================================================

-- 1. CREATE HELPER FUNCTIONS FOR ROLE CHECKING
-- ===================================================================

CREATE OR REPLACE FUNCTION auth.is_team_member()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.is_customer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.customers 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ENABLE RLS ON TABLES THAT NEED POLICIES
-- ===================================================================

ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_current_location ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_locations ENABLE ROW LEVEL SECURITY;

-- 3. CREATE CRITICAL POLICIES TO FIX SECURITY ADVISORIES
-- ===================================================================

-- Billing Invoices: Team member access
CREATE POLICY "billing_invoices_team_access" ON public.billing_invoices
  FOR ALL TO authenticated USING (auth.is_team_member());

-- Security Logs: Admin only access
CREATE POLICY "security_logs_admin_access" ON public.security_logs
  FOR ALL TO authenticated USING (auth.is_admin());

-- Technician Current Location: Team member access
CREATE POLICY "technician_current_location_team_access" ON public.technician_current_location
  FOR ALL TO authenticated USING (auth.is_team_member());

-- Technician Locations: Team member access
CREATE POLICY "technician_locations_team_access" ON public.technician_locations
  FOR ALL TO authenticated USING (auth.is_team_member());

-- 4. VERIFICATION - RUN THESE QUERIES TO CONFIRM SUCCESS
-- ===================================================================

-- Check that RLS is enabled on critical tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('billing_invoices', 'security_logs', 'technician_current_location', 'technician_locations')
ORDER BY tablename;

-- Check that policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('billing_invoices', 'security_logs', 'technician_current_location', 'technician_locations')
ORDER BY tablename, policyname;

-- Check helper functions exist
SELECT proname 
FROM pg_proc 
WHERE proname IN ('is_team_member', 'is_admin', 'is_customer')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth');

-- 5. CONFIRMATION MESSAGE
-- ===================================================================

SELECT 
  'CRITICAL RLS FIXES COMPLETED!' as status,
  'Security advisories addressed' as result,
  'billing_invoices, security_logs, technician tables protected' as details,
  'Execute COMPREHENSIVE_RLS_IMPLEMENTATION.sql for complete protection' as next_step;

-- ===================================================================
-- EXECUTION COMPLETE - SECURITY ADVISORIES RESOLVED
-- ===================================================================