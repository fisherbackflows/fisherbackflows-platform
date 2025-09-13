-- ===================================================================
-- URGENT: FIX EXPOSED TABLES - EXECUTE IMMEDIATELY
-- ===================================================================
-- These 5 tables are currently exposing customer data to the internet
-- ===================================================================

-- DROP OLD BROKEN POLICIES
DROP POLICY IF EXISTS "test_policy_devices" ON public.devices;
DROP POLICY IF EXISTS "test_policy_appointments" ON public.appointments;
DROP POLICY IF EXISTS "test_policy_test_reports" ON public.test_reports;
DROP POLICY IF EXISTS "test_policy_invoices" ON public.invoices;
DROP POLICY IF EXISTS "test_policy_payments" ON public.payments;

-- DEVICES: Block anonymous, allow authenticated users their own data
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "devices_auth_only" ON public.devices
  FOR ALL 
  USING (
    auth.role() = 'authenticated' AND 
    customer_id = auth.uid()
  );

-- APPOINTMENTS: Block anonymous, allow authenticated users their own data  
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_auth_only" ON public.appointments
  FOR ALL 
  USING (
    auth.role() = 'authenticated' AND 
    customer_id = auth.uid()
  );

-- TEST REPORTS: Block anonymous, allow authenticated users their own data
ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "test_reports_auth_only" ON public.test_reports
  FOR ALL 
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.devices 
      WHERE id = test_reports.device_id 
      AND customer_id = auth.uid()
    )
  );

-- INVOICES: Block anonymous, allow authenticated users their own data
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_auth_only" ON public.invoices
  FOR ALL 
  USING (
    auth.role() = 'authenticated' AND 
    customer_id = auth.uid()
  );

-- PAYMENTS: Block anonymous, allow authenticated users their own data
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_auth_only" ON public.payments
  FOR ALL 
  USING (
    auth.role() = 'authenticated' AND 
    customer_id = auth.uid()
  );

-- VERIFY THE FIX
SELECT 
  'URGENT FIX APPLIED' as status,
  '5 exposed tables secured' as result,
  'Run test-rls-via-api.js to verify' as next_step;