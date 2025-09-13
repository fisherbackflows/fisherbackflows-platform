-- ===================================================================
-- THE REAL FIX - EXPLICITLY BLOCK ANON ROLE
-- ===================================================================
-- The missing piece: Supabase uses 'anon' role for unauthenticated users
-- We must explicitly create policies for the 'anon' role that return FALSE
-- ===================================================================

-- 1. CLEAN SLATE - Drop all existing policies
DROP POLICY IF EXISTS "deny_all_anon_devices" ON public.devices;
DROP POLICY IF EXISTS "deny_all_anon_appointments" ON public.appointments;
DROP POLICY IF EXISTS "deny_all_anon_test_reports" ON public.test_reports;
DROP POLICY IF EXISTS "deny_all_anon_invoices" ON public.invoices;
DROP POLICY IF EXISTS "deny_all_anon_payments" ON public.payments;

DROP POLICY IF EXISTS "allow_auth_own_devices" ON public.devices;
DROP POLICY IF EXISTS "allow_auth_own_appointments" ON public.appointments;
DROP POLICY IF EXISTS "allow_auth_own_test_reports" ON public.test_reports;
DROP POLICY IF EXISTS "allow_auth_own_invoices" ON public.invoices;
DROP POLICY IF EXISTS "allow_auth_own_payments" ON public.payments;

DROP POLICY IF EXISTS "devices_auth_only" ON public.devices;
DROP POLICY IF EXISTS "appointments_auth_only" ON public.appointments;
DROP POLICY IF EXISTS "test_reports_auth_only" ON public.test_reports;
DROP POLICY IF EXISTS "invoices_auth_only" ON public.invoices;
DROP POLICY IF EXISTS "payments_auth_only" ON public.payments;

-- 2. ENSURE RLS IS ENABLED
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 3. THE KEY: Create RESTRICTIVE policies that apply to everyone
-- These will block access unless another policy explicitly allows it

-- DEVICES
CREATE POLICY "block_anon_devices" ON public.devices
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.role() != 'anon');

CREATE POLICY "allow_own_devices" ON public.devices
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (customer_id = auth.uid());

-- APPOINTMENTS  
CREATE POLICY "block_anon_appointments" ON public.appointments
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.role() != 'anon');

CREATE POLICY "allow_own_appointments" ON public.appointments
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (customer_id = auth.uid());

-- TEST REPORTS
CREATE POLICY "block_anon_test_reports" ON public.test_reports
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.role() != 'anon');

CREATE POLICY "allow_own_test_reports" ON public.test_reports
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.devices 
      WHERE id = test_reports.device_id 
      AND customer_id = auth.uid()
    )
  );

-- INVOICES
CREATE POLICY "block_anon_invoices" ON public.invoices
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.role() != 'anon');

CREATE POLICY "allow_own_invoices" ON public.invoices
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (customer_id = auth.uid());

-- PAYMENTS
CREATE POLICY "block_anon_payments" ON public.payments
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (auth.role() != 'anon');

CREATE POLICY "allow_own_payments" ON public.payments
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (customer_id = auth.uid());

-- 4. VERIFY
SELECT 'THE REAL FIX APPLIED - RESTRICTIVE POLICIES BLOCK ANON' as status;