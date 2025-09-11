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

-- SMS verification table (replaces email verification)
CREATE TABLE IF NOT EXISTS public.sms_verifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SMS verification table policies
ALTER TABLE public.sms_verifications ENABLE ROW LEVEL SECURITY;

-- Email verification table policies (keeping for backward compatibility)
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Drop existing email verification policies if they exist
DROP POLICY IF EXISTS "Service role can manage email verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "Users can read their own verifications" ON public.email_verifications;

-- Service role can manage all email verifications (needed for registration process)
CREATE POLICY "Service role can manage email verifications" ON public.email_verifications
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can read their own email verifications  
CREATE POLICY "Users can read their own verifications" ON public.email_verifications
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

-- SMS verification policies
DROP POLICY IF EXISTS "Service role can manage SMS verifications" ON public.sms_verifications;
DROP POLICY IF EXISTS "Users can read their own SMS verifications" ON public.sms_verifications;

-- Service role can manage all SMS verifications (needed for registration process)
CREATE POLICY "Service role can manage SMS verifications" ON public.sms_verifications
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can read their own SMS verifications  
CREATE POLICY "Users can read their own SMS verifications" ON public.sms_verifications
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- Allow service role to bypass (for API operations)
-- Service role automatically bypasses RLS

SELECT 'RLS policies applied successfully!' as result;