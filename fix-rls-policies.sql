-- ===================================================================
-- FIX MISSING RLS POLICIES - CRITICAL SECURITY VULNERABILITIES
-- ===================================================================
-- This fixes the 4 tables that have RLS enabled but no policies
-- ===================================================================

-- First, create helper functions if they don't exist
CREATE OR REPLACE FUNCTION auth.is_team_member()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user exists in team_users table
  RETURN EXISTS (
    SELECT 1 FROM public.team_users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is team member with admin role
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
  -- Check if user exists in customers table
  RETURN EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- FIX 1: billing_invoices - Missing RLS Policies
-- ===================================================================

-- Drop existing policies if they exist (to recreate clean)
DROP POLICY IF EXISTS "billing_invoices_customer_access" ON public.billing_invoices;
DROP POLICY IF EXISTS "billing_invoices_team_access" ON public.billing_invoices;

-- Customer access: Can see their own invoices via stripe_customer_id lookup
CREATE POLICY "billing_invoices_customer_access" ON public.billing_invoices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE stripe_customer_id = billing_invoices.customer_id
      AND id = auth.uid()
    )
  );

-- Team access: Can see all invoices
CREATE POLICY "billing_invoices_team_access" ON public.billing_invoices
  FOR ALL
  TO authenticated
  USING (auth.is_team_member());

-- ===================================================================
-- FIX 2: security_logs - Missing RLS Policies
-- ===================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "security_logs_admin_access" ON public.security_logs;

-- Admin only access to security logs
CREATE POLICY "security_logs_admin_access" ON public.security_logs
  FOR ALL
  TO authenticated
  USING (auth.is_admin());

-- ===================================================================
-- FIX 3: technician_current_location - Missing RLS Policies
-- ===================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "technician_current_location_team_access" ON public.technician_current_location;

-- Team member access to current locations
CREATE POLICY "technician_current_location_team_access" ON public.technician_current_location
  FOR ALL
  TO authenticated
  USING (auth.is_team_member());

-- ===================================================================
-- FIX 4: technician_locations - Missing RLS Policies
-- ===================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "technician_locations_team_access" ON public.technician_locations;

-- Team member access to location history
CREATE POLICY "technician_locations_team_access" ON public.technician_locations
  FOR ALL
  TO authenticated
  USING (auth.is_team_member());

-- ===================================================================
-- VERIFICATION QUERIES
-- ===================================================================

-- Check that all policies were created successfully
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN (
  'billing_invoices',
  'security_logs',
  'technician_current_location',
  'technician_locations'
)
ORDER BY tablename, policyname;

-- Check RLS status on these tables
SELECT
  schemaname,
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables
WHERE tablename IN (
  'billing_invoices',
  'security_logs',
  'technician_current_location',
  'technician_locations'
)
ORDER BY tablename;