-- CRITICAL SECURITY FIXES FOR FISHER BACKFLOWS PLATFORM
-- This script addresses the security vulnerabilities found in the customer signup audit

-- 1. FIX RLS POLICIES FOR CUSTOMERS TABLE
-- Remove overly permissive policies
DROP POLICY IF EXISTS "Service role access" ON customers;
DROP POLICY IF EXISTS "authenticated_api_access" ON customers;

-- Create secure user-specific RLS policies
CREATE POLICY "Users can only access their own data" ON customers
  FOR ALL USING (auth.uid() = id);

-- Allow service role for admin operations
CREATE POLICY "Service role full access" ON customers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. FIX RLS POLICIES FOR MISSING TABLES
-- billing_invoices
CREATE POLICY "Users can only access their own billing invoices" ON billing_invoices
  FOR ALL USING (customer_id IN (SELECT id FROM customers WHERE auth.uid() = id));

CREATE POLICY "Service role full access billing_invoices" ON billing_invoices
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- security_logs (admin only)
CREATE POLICY "Only service role can access security logs" ON security_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- technician_current_location
CREATE POLICY "Technicians can only access their own location" ON technician_current_location
  FOR ALL USING (technician_id = auth.uid()::text OR auth.role() = 'service_role');

-- technician_locations  
CREATE POLICY "Technicians can access their own location history" ON technician_locations
  FOR ALL USING (technician_id = auth.uid()::text OR auth.role() = 'service_role');

-- 3. FIX FUNCTION SEARCH PATH ISSUE
ALTER FUNCTION update_updated_at_column() SET search_path = '';

-- 4. ADD EMAIL VERIFICATION COLUMN IF MISSING
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'email_verified_at') THEN
        ALTER TABLE customers ADD COLUMN email_verified_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 5. CREATE INDEX FOR PERFORMANCE ON EMAIL VERIFICATIONS
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_customers_account_status ON customers(account_status);

-- 6. CLEANUP OLD/EXPIRED VERIFICATION TOKENS
DELETE FROM email_verifications WHERE expires_at < NOW() - INTERVAL '1 day';

-- Verification
SELECT 
    schemaname, 
    tablename, 
    policyname,
    cmd,
    CASE 
        WHEN policyname IS NULL THEN 'NO RLS POLICIES'
        ELSE 'HAS RLS POLICIES'
    END as rls_status
FROM pg_policies 
WHERE tablename IN ('customers', 'billing_invoices', 'security_logs', 'technician_current_location', 'technician_locations')
ORDER BY tablename, policyname;