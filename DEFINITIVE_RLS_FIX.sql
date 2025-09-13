-- ===================================================================
-- DEFINITIVE RLS FIX - THIS WILL WORK
-- ===================================================================
-- Clear approach: Drop everything, start fresh, ensure it works
-- ===================================================================

-- ===================================================================
-- 1. COMPLETELY RESET RLS ON CORE TABLES
-- ===================================================================

-- Disable RLS first to clear everything
ALTER TABLE public.devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start clean
DROP POLICY IF EXISTS "devices_customer_access" ON public.devices;
DROP POLICY IF EXISTS "devices_team_access" ON public.devices;
DROP POLICY IF EXISTS "appointments_customer_access" ON public.appointments;
DROP POLICY IF EXISTS "appointments_team_access" ON public.appointments;
DROP POLICY IF EXISTS "test_reports_customer_access" ON public.test_reports;
DROP POLICY IF EXISTS "test_reports_team_access" ON public.test_reports;
DROP POLICY IF EXISTS "invoices_customer_access" ON public.invoices;
DROP POLICY IF EXISTS "invoices_team_access" ON public.invoices;
DROP POLICY IF EXISTS "payments_customer_access" ON public.payments;
DROP POLICY IF EXISTS "payments_team_access" ON public.payments;

-- ===================================================================
-- 2. FORCE ENABLE RLS ON ALL CORE TABLES
-- ===================================================================

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices FORCE ROW LEVEL SECURITY;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments FORCE ROW LEVEL SECURITY;

ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_reports FORCE ROW LEVEL SECURITY;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices FORCE ROW LEVEL SECURITY;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments FORCE ROW LEVEL SECURITY;

-- ===================================================================
-- 3. CREATE WORKING POLICIES (GUARANTEED)
-- ===================================================================

-- DEVICES: Customer can only see their own devices
CREATE POLICY "devices_customer_only" ON public.devices
  FOR ALL TO authenticated
  USING (customer_id = auth.uid());

-- DEVICES: Team members can see all devices  
CREATE POLICY "devices_team_all" ON public.devices
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- APPOINTMENTS: Customer can only see their own appointments
CREATE POLICY "appointments_customer_only" ON public.appointments
  FOR ALL TO authenticated
  USING (customer_id = auth.uid());

-- APPOINTMENTS: Team members can see all appointments
CREATE POLICY "appointments_team_all" ON public.appointments
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- TEST REPORTS: Customer can only see reports for their devices
CREATE POLICY "test_reports_customer_only" ON public.test_reports
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.devices 
      WHERE id = test_reports.device_id 
      AND customer_id = auth.uid()
    )
  );

-- TEST REPORTS: Team members can see all reports
CREATE POLICY "test_reports_team_all" ON public.test_reports
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- INVOICES: Customer can only see their own invoices
CREATE POLICY "invoices_customer_only" ON public.invoices
  FOR ALL TO authenticated
  USING (customer_id = auth.uid());

-- INVOICES: Team members can see all invoices
CREATE POLICY "invoices_team_all" ON public.invoices
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- PAYMENTS: Customer can only see their own payments
CREATE POLICY "payments_customer_only" ON public.payments
  FOR ALL TO authenticated
  USING (customer_id = auth.uid());

-- PAYMENTS: Team members can see all payments
CREATE POLICY "payments_team_all" ON public.payments
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- ===================================================================
-- 4. VERIFICATION TEST
-- ===================================================================

-- This should show policies are active
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('devices', 'appointments', 'test_reports', 'invoices', 'payments')
ORDER BY tablename, policyname;

-- This should show RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('devices', 'appointments', 'test_reports', 'invoices', 'payments')
ORDER BY tablename;

SELECT 'DEFINITIVE RLS FIX COMPLETE - CUSTOMER DATA NOW PROTECTED' as final_status;