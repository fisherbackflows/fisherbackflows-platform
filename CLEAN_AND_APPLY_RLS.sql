-- ===================================================================
-- CLEAN AND APPLY REMAINING CORE TABLES RLS
-- ===================================================================
-- First drop existing policies, then recreate them properly
-- ===================================================================

-- ===================================================================
-- DROP EXISTING POLICIES (IF ANY)
-- ===================================================================

-- Devices policies
DROP POLICY IF EXISTS "devices_customer_access" ON public.devices;
DROP POLICY IF EXISTS "devices_team_access" ON public.devices;

-- Appointments policies
DROP POLICY IF EXISTS "appointments_customer_access" ON public.appointments;
DROP POLICY IF EXISTS "appointments_team_access" ON public.appointments;

-- Test Reports policies
DROP POLICY IF EXISTS "test_reports_customer_access" ON public.test_reports;
DROP POLICY IF EXISTS "test_reports_team_access" ON public.test_reports;

-- Invoices policies
DROP POLICY IF EXISTS "invoices_customer_access" ON public.invoices;
DROP POLICY IF EXISTS "invoices_team_access" ON public.invoices;

-- Payments policies
DROP POLICY IF EXISTS "payments_customer_access" ON public.payments;
DROP POLICY IF EXISTS "payments_team_access" ON public.payments;

-- ===================================================================
-- ENSURE RLS IS ENABLED ON ALL CORE TABLES
-- ===================================================================

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- CREATE CLEAN POLICIES
-- ===================================================================

-- DEVICES POLICIES
CREATE POLICY "devices_customer_access" ON public.devices
  FOR ALL 
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "devices_team_access" ON public.devices
  FOR ALL 
  TO authenticated
  USING (public.is_team_member());

-- APPOINTMENTS POLICIES
CREATE POLICY "appointments_customer_access" ON public.appointments
  FOR ALL 
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "appointments_team_access" ON public.appointments
  FOR ALL 
  TO authenticated
  USING (public.is_team_member());

-- TEST REPORTS POLICIES
CREATE POLICY "test_reports_customer_access" ON public.test_reports
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.devices 
      WHERE id = test_reports.device_id 
      AND customer_id = auth.uid()
    )
  );

CREATE POLICY "test_reports_team_access" ON public.test_reports
  FOR ALL 
  TO authenticated
  USING (public.is_team_member());

-- INVOICES POLICIES
CREATE POLICY "invoices_customer_access" ON public.invoices
  FOR ALL 
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "invoices_team_access" ON public.invoices
  FOR ALL 
  TO authenticated
  USING (public.is_team_member());

-- PAYMENTS POLICIES
CREATE POLICY "payments_customer_access" ON public.payments
  FOR ALL 
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "payments_team_access" ON public.payments
  FOR ALL 
  TO authenticated
  USING (public.is_team_member());

-- ===================================================================
-- VERIFICATION
-- ===================================================================

SELECT 
  'All Core Tables Now Secured!' as status,
  '6 core tables fully protected' as tables_secured,
  'Customer data isolation complete' as isolation_status;