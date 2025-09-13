-- Simple, straightforward fix
-- Just create policies that actually work

-- Clean up first
DROP POLICY IF EXISTS "test_policy_devices" ON public.devices;
DROP POLICY IF EXISTS "test_policy_appointments" ON public.appointments;
DROP POLICY IF EXISTS "test_policy_test_reports" ON public.test_reports;
DROP POLICY IF EXISTS "test_policy_invoices" ON public.invoices;
DROP POLICY IF EXISTS "test_policy_payments" ON public.payments;

-- Enable RLS
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Simple policies - no access by default, only authenticated users see their own data
CREATE POLICY "devices_policy" ON public.devices
  USING (auth.uid() = customer_id);

CREATE POLICY "appointments_policy" ON public.appointments
  USING (auth.uid() = customer_id);

CREATE POLICY "test_reports_policy" ON public.test_reports
  USING (EXISTS (
    SELECT 1 FROM public.devices 
    WHERE id = test_reports.device_id 
    AND customer_id = auth.uid()
  ));

CREATE POLICY "invoices_policy" ON public.invoices
  USING (auth.uid() = customer_id);

CREATE POLICY "payments_policy" ON public.payments
  USING (auth.uid() = customer_id);

SELECT 'Done' as status;