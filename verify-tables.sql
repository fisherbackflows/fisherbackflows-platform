-- Run this query in Supabase SQL Editor to verify all tables were created
-- Copy and paste this entire query into the SQL Editor

SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'customers', 
      'devices', 
      'appointments', 
      'test_reports', 
      'invoices', 
      'invoice_line_items',
      'payments', 
      'leads', 
      'water_department_submissions',
      'audit_logs'
    ) THEN '✅ Business Table Created'
    WHEN table_name IN (
      'team_users',
      'team_sessions',
      'tester_schedules',
      'time_off_requests'
    ) THEN '📦 Existing Team Table'
    ELSE '📋 Other Table'
  END as status,
  CASE 
    WHEN table_name = 'customers' THEN 'Core customer data'
    WHEN table_name = 'devices' THEN 'Backflow devices'
    WHEN table_name = 'appointments' THEN 'Service appointments'
    WHEN table_name = 'test_reports' THEN 'Test results & reports'
    WHEN table_name = 'invoices' THEN 'Customer invoices'
    WHEN table_name = 'payments' THEN 'Payment records'
    WHEN table_name = 'leads' THEN 'Sales leads'
    WHEN table_name = 'water_department_submissions' THEN 'District reports'
    WHEN table_name = 'audit_logs' THEN 'System audit trail'
    ELSE 'System table'
  END as description
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY 
  CASE 
    WHEN table_name IN (
      'customers', 'devices', 'appointments', 'test_reports', 
      'invoices', 'payments', 'leads', 'water_department_submissions'
    ) THEN 0 
    ELSE 1 
  END,
  table_name;