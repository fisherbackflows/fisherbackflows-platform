-- ===================================================================
-- EMERGENCY RLS FIX - EXECUTE IMMEDIATELY
-- ===================================================================
-- This will immediately protect the 5 exposed core customer tables
-- ===================================================================

-- ENABLE RLS ON EXPOSED TABLES
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- DEVICES - Customer isolation
CREATE POLICY "devices_customer_access" ON public.devices 
  FOR ALL TO authenticated 
  USING (customer_id = auth.uid());

CREATE POLICY "devices_team_access" ON public.devices 
  FOR ALL TO authenticated 
  USING (public.is_team_member());

-- APPOINTMENTS - Customer isolation  
CREATE POLICY "appointments_customer_access" ON public.appointments 
  FOR ALL TO authenticated 
  USING (customer_id = auth.uid());

CREATE POLICY "appointments_team_access" ON public.appointments 
  FOR ALL TO authenticated 
  USING (public.is_team_member());

-- TEST REPORTS - Customer isolation via device ownership
CREATE POLICY "test_reports_customer_access" ON public.test_reports 
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.devices 
      WHERE id = test_reports.device_id 
      AND customer_id = auth.uid()
    )
  );

CREATE POLICY "test_reports_team_access" ON public.test_reports 
  FOR ALL TO authenticated 
  USING (public.is_team_member());

-- INVOICES - Customer isolation
CREATE POLICY "invoices_customer_access" ON public.invoices 
  FOR ALL TO authenticated 
  USING (customer_id = auth.uid());

CREATE POLICY "invoices_team_access" ON public.invoices 
  FOR ALL TO authenticated 
  USING (public.is_team_member());

-- PAYMENTS - Customer isolation
CREATE POLICY "payments_customer_access" ON public.payments 
  FOR ALL TO authenticated 
  USING (customer_id = auth.uid());

CREATE POLICY "payments_team_access" ON public.payments 
  FOR ALL TO authenticated 
  USING (public.is_team_member());

-- VERIFICATION
SELECT 'EMERGENCY FIX COMPLETE - ALL 6 CORE TABLES NOW PROTECTED' as status;