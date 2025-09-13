-- Check what policies actually exist
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('devices', 'appointments', 'test_reports', 'invoices', 'payments')
ORDER BY tablename, policyname;