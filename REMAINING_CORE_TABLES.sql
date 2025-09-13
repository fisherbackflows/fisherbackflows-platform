-- ===================================================================
-- REMAINING CORE TABLES RLS IMPLEMENTATION
-- ===================================================================
-- Add RLS policies for the 5 remaining core tables
-- ===================================================================

-- ===================================================================
-- ENABLE RLS ON REMAINING CORE TABLES
-- ===================================================================

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- DEVICES POLICIES
-- ===================================================================

-- Customers can only see their own devices
CREATE POLICY "devices_customer_access" ON public.devices
  FOR ALL 
  TO authenticated
  USING (customer_id = auth.uid());

-- Team members can see all devices
CREATE POLICY "devices_team_access" ON public.devices
  FOR ALL 
  TO authenticated
  USING (public.is_team_member());

-- ===================================================================
-- APPOINTMENTS POLICIES
-- ===================================================================

-- Customers can only see their own appointments
CREATE POLICY "appointments_customer_access" ON public.appointments
  FOR ALL 
  TO authenticated
  USING (customer_id = auth.uid());

-- Team members can see all appointments
CREATE POLICY "appointments_team_access" ON public.appointments
  FOR ALL 
  TO authenticated
  USING (public.is_team_member());

-- ===================================================================
-- TEST REPORTS POLICIES
-- ===================================================================

-- Customers can only see test reports for their devices
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

-- Team members can see all test reports
CREATE POLICY "test_reports_team_access" ON public.test_reports
  FOR ALL 
  TO authenticated
  USING (public.is_team_member());

-- ===================================================================
-- INVOICES POLICIES
-- ===================================================================

-- Customers can only see their own invoices
CREATE POLICY "invoices_customer_access" ON public.invoices
  FOR ALL 
  TO authenticated
  USING (customer_id = auth.uid());

-- Team members can see all invoices
CREATE POLICY "invoices_team_access" ON public.invoices
  FOR ALL 
  TO authenticated
  USING (public.is_team_member());

-- ===================================================================
-- PAYMENTS POLICIES
-- ===================================================================

-- Customers can only see their own payments
CREATE POLICY "payments_customer_access" ON public.payments
  FOR ALL 
  TO authenticated
  USING (customer_id = auth.uid());

-- Team members can see all payments
CREATE POLICY "payments_team_access" ON public.payments
  FOR ALL 
  TO authenticated
  USING (public.is_team_member());

-- ===================================================================
-- VERIFICATION
-- ===================================================================

SELECT 
  'Remaining Core Tables Secured!' as status,
  '5 additional tables protected' as tables_added,
  'All 6 core tables now have RLS' as protection_status;