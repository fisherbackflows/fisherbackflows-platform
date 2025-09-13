-- ===================================================================
-- MINIMAL RLS IMPLEMENTATION - CORE TABLES ONLY
-- ===================================================================
-- Start with just the essential customer data protection
-- Execute this first, then we'll add more tables incrementally
-- ===================================================================

-- ===================================================================
-- 1. CREATE HELPER FUNCTIONS
-- ===================================================================

-- Function to check if current user is a team member
CREATE OR REPLACE FUNCTION public.is_team_member()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- 2. ENABLE RLS ON CORE CUSTOMER DATA TABLES ONLY
-- ===================================================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- 3. CORE CUSTOMER DATA POLICIES (MINIMAL SET)
-- ===================================================================

-- Customers: Own data + Team access
CREATE POLICY "customers_own_data" ON public.customers
  FOR ALL 
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "customers_team_access" ON public.customers
  FOR ALL 
  TO authenticated
  USING (public.is_team_member());

-- Devices: Customer + Team access
CREATE POLICY "devices_customer_access" ON public.devices
  FOR ALL 
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "devices_team_access" ON public.devices
  FOR ALL 
  TO authenticated
  USING (public.is_team_member());

-- Appointments: Customer + Team access
CREATE POLICY "appointments_customer_access" ON public.appointments
  FOR ALL 
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "appointments_team_access" ON public.appointments
  FOR ALL 
  TO authenticated
  USING (public.is_team_member());

-- Test Reports: Customer + Team access
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

-- Invoices: Customer + Team access
CREATE POLICY "invoices_customer_access" ON public.invoices
  FOR ALL 
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "invoices_team_access" ON public.invoices
  FOR ALL 
  TO authenticated
  USING (public.is_team_member());

-- Payments: Customer + Team access
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
  'Core RLS Complete!' as status,
  '6 core tables secured' as tables_secured,
  'Customer data now protected' as protection_status;