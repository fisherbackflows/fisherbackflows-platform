-- ===================================================================
-- CORRECTED RLS POLICIES FIX - USES PUBLIC SCHEMA
-- ===================================================================
-- This fixes the permission denied error by creating functions in public schema
-- ===================================================================

-- Helper Functions in PUBLIC schema (not auth schema)
CREATE OR REPLACE FUNCTION public.is_team_member()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user exists in team_users table
  RETURN EXISTS (
    SELECT 1 FROM public.team_users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
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

CREATE OR REPLACE FUNCTION public.is_customer()
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
-- RLS POLICIES USING PUBLIC SCHEMA FUNCTIONS
-- ===================================================================

-- Billing Invoices Policies
DROP POLICY IF EXISTS "billing_invoices_customer_access" ON public.billing_invoices;
CREATE POLICY "billing_invoices_customer_access" ON public.billing_invoices
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE stripe_customer_id = billing_invoices.customer_id
      AND id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "billing_invoices_team_access" ON public.billing_invoices;
CREATE POLICY "billing_invoices_team_access" ON public.billing_invoices
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- Security Logs Policies
DROP POLICY IF EXISTS "security_logs_admin_access" ON public.security_logs;
CREATE POLICY "security_logs_admin_access" ON public.security_logs
  FOR ALL TO authenticated
  USING (public.is_admin());

-- Technician Current Location Policies
DROP POLICY IF EXISTS "technician_current_location_team_access" ON public.technician_current_location;
CREATE POLICY "technician_current_location_team_access" ON public.technician_current_location
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- Technician Locations Policies
DROP POLICY IF EXISTS "technician_locations_team_access" ON public.technician_locations;
CREATE POLICY "technician_locations_team_access" ON public.technician_locations
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- ===================================================================
-- VERIFICATION QUERIES
-- ===================================================================

-- Check that policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN (
  'billing_invoices',
  'security_logs',
  'technician_current_location',
  'technician_locations'
)
ORDER BY tablename, policyname;

-- Check RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN (
  'billing_invoices',
  'security_logs',
  'technician_current_location',
  'technician_locations'
)
ORDER BY tablename;