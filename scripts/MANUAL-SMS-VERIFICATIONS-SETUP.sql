-- ========================================
-- SMS VERIFICATIONS TABLE CREATION SCRIPT
-- Execute this in Supabase SQL Editor
-- ========================================

-- 1. Create the SMS verifications table
CREATE TABLE IF NOT EXISTS public.sms_verifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.sms_verifications ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Service role can manage SMS verifications" ON public.sms_verifications;
DROP POLICY IF EXISTS "Users can read their own SMS verifications" ON public.sms_verifications;

-- 4. Create security policies

-- Service role can manage all SMS verifications (for API operations)
CREATE POLICY "Service role can manage SMS verifications" 
ON public.sms_verifications
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can only read their own SMS verifications
CREATE POLICY "Users can read their own SMS verifications" 
ON public.sms_verifications
FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_verifications_customer_id 
ON public.sms_verifications(customer_id);

CREATE INDEX IF NOT EXISTS idx_sms_verifications_phone 
ON public.sms_verifications(phone);

CREATE INDEX IF NOT EXISTS idx_sms_verifications_expires_at 
ON public.sms_verifications(expires_at);

-- 6. Add comments for documentation
COMMENT ON TABLE public.sms_verifications IS 'Store SMS verification codes for customer phone number verification';
COMMENT ON COLUMN public.sms_verifications.id IS 'Unique identifier for each SMS verification attempt';
COMMENT ON COLUMN public.sms_verifications.customer_id IS 'Reference to the customer being verified';
COMMENT ON COLUMN public.sms_verifications.phone IS 'Phone number receiving the verification code';
COMMENT ON COLUMN public.sms_verifications.code IS 'The verification code sent to the phone';
COMMENT ON COLUMN public.sms_verifications.attempts IS 'Number of verification attempts made';
COMMENT ON COLUMN public.sms_verifications.expires_at IS 'When this verification code expires';
COMMENT ON COLUMN public.sms_verifications.created_at IS 'When this verification was created';

-- 7. Verification queries to run after creation

-- Check if table was created successfully
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'sms_verifications' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'sms_verifications';

-- Check policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'sms_verifications';

-- Test table access (should return 0 rows)
SELECT COUNT(*) FROM public.sms_verifications;