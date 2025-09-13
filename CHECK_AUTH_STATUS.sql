-- ===================================================================
-- CHECK AUTHENTICATION STATUS AND RLS
-- ===================================================================

-- 1. Check current user authentication
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role,
  auth.jwt() as jwt_info;

-- 2. Check if RLS is actually enabled on tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  forcerowsecurity as rls_forced
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
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('customers', 'devices', 'appointments', 'test_reports', 'invoices', 'payments')
ORDER BY tablename, policyname;

-- 4. Test if you're bypassing RLS (service role or table owner)
SELECT current_user, session_user;