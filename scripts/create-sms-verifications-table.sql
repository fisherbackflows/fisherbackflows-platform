-- Create SMS verification table
CREATE TABLE IF NOT EXISTS public.sms_verifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and create policies
ALTER TABLE public.sms_verifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can manage SMS verifications" ON public.sms_verifications;
DROP POLICY IF EXISTS "Users can read their own SMS verifications" ON public.sms_verifications;

-- Service role can manage all SMS verifications
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