-- ===================================================================
-- CHECK AUTHENTICATION STATUS AND RLS (FIXED)
-- ===================================================================

-- 1. Check current user authentication
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- 2. Check if RLS is actually enabled on tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('customers', 'devices', 'appointments', 'test_reports', 'invoices', 'payments')
ORDER BY tablename;

-- 3. Check what policies exist
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('customers', 'devices', 'appointments', 'test_reports', 'invoices', 'payments')
ORDER BY tablename, policyname;

-- 4. Test if you're bypassing RLS (service role or table owner)
SELECT current_user, session_user;

-- 5. Check if you're running as postgres/superuser
SELECT 
  CASE 
    WHEN current_user = 'postgres' THEN 'YES - Running as postgres (bypasses RLS)'
    WHEN current_user = 'authenticator' THEN 'Running as authenticator'
    WHEN current_user = 'authenticated' THEN 'Running as authenticated user'
    WHEN current_user = 'anon' THEN 'Running as anonymous'
    WHEN current_user = 'service_role' THEN 'YES - Running as service_role (bypasses RLS)'
    ELSE 'Running as: ' || current_user
  END as rls_bypass_status;