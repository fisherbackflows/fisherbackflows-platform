-- Check if RLS is actually enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('devices', 'appointments', 'test_reports', 'invoices', 'payments')
ORDER BY tablename;