-- APPLY THIS SQL IN SUPABASE SQL EDITOR RIGHT NOW
-- This will actually secure the database

-- Enable RLS on critical tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create basic customer isolation policy
CREATE POLICY "customers_own_data" ON public.customers
  FOR ALL USING (id = auth.uid()::uuid);

-- Customers can only see their own devices
CREATE POLICY "devices_customer_access" ON public.devices
  FOR ALL USING (customer_id = auth.uid()::uuid);

-- Customers can only see their own appointments  
CREATE POLICY "appointments_customer_access" ON public.appointments
  FOR ALL USING (customer_id = auth.uid()::uuid);

-- Customers can only see their own invoices
CREATE POLICY "invoices_customer_access" ON public.invoices
  FOR ALL USING (customer_id = auth.uid()::uuid);

-- Allow service role to bypass (for API operations)
-- Service role automatically bypasses RLS

SELECT 'RLS policies applied successfully!' as result;