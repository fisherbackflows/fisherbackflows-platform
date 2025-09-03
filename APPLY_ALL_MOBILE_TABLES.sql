-- 🚀 COMBINED MOBILE FEATURES SQL
-- Generated: 2025-09-03T14:37:28.530Z
-- Total Statements: 95
-- Apply this in Supabase SQL Editor


-- Statement 1 from MOBILE_LOCATION_TRACKING_SCHEMA.sql
CREATE INDEX IF NOT EXISTS idx_technician_locations_recorded_at ON technician_locations(recorded_at DESC);

-- Statement 2 from MOBILE_LOCATION_TRACKING_SCHEMA.sql
CREATE INDEX IF NOT EXISTS idx_technician_locations_appointment_id ON technician_locations(appointment_id);

-- Statement 3 from MOBILE_LOCATION_TRACKING_SCHEMA.sql
CREATE INDEX IF NOT EXISTS idx_technician_locations_technician_time ON technician_locations(technician_id, recorded_at DESC);

-- Statement 4 from MOBILE_LOCATION_TRACKING_SCHEMA.sql
CREATE INDEX IF NOT EXISTS idx_technician_current_location_updated ON technician_current_location(last_updated DESC);

-- Statement 5 from MOBILE_LOCATION_TRACKING_SCHEMA.sql
CREATE INDEX IF NOT EXISTS idx_technician_current_location_active ON technician_current_location(is_active);

-- Statement 6 from MOBILE_LOCATION_TRACKING_SCHEMA.sql
ALTER TABLE technician_current_location ENABLE ROW LEVEL SECURITY;

-- Statement 7 from MOBILE_LOCATION_TRACKING_SCHEMA.sql
CREATE POLICY "Team users can manage current locations" ON technician_current_location
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM team_users 
            WHERE email = (SELECT auth.jwt() ->> 'email')
        )
    );

-- Statement 8 from MOBILE_LOCATION_TRACKING_SCHEMA.sql
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;

-- Statement 9 from PWA_DATABASE_TABLES.sql
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(active);

-- Statement 10 from PWA_DATABASE_TABLES.sql
CREATE INDEX IF NOT EXISTS idx_notification_logs_tracking_id ON notification_logs(tracking_id);

-- Statement 11 from PWA_DATABASE_TABLES.sql
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_by ON notification_logs(sent_by);

-- Statement 12 from PWA_DATABASE_TABLES.sql
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);

-- Statement 13 from PWA_DATABASE_TABLES.sql
CREATE INDEX IF NOT EXISTS idx_notification_interactions_tracking_id ON notification_interactions(tracking_id);

-- Statement 14 from PWA_DATABASE_TABLES.sql
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Statement 15 from PWA_DATABASE_TABLES.sql
ALTER TABLE notification_interactions ENABLE ROW LEVEL SECURITY;

-- Statement 16 from PWA_DATABASE_TABLES.sql
CREATE TRIGGER update_push_subscriptions_updated_at 
    BEFORE UPDATE ON push_subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Statement 17 from DATABASE_PERFORMANCE_COMPLETE.sql
DROP INDEX IF EXISTS idx_appointments_device_id;

-- Statement 18 from DATABASE_PERFORMANCE_COMPLETE.sql
DROP INDEX IF EXISTS idx_appointments_technician_id;

-- Statement 19 from DATABASE_PERFORMANCE_COMPLETE.sql
DROP INDEX IF EXISTS idx_devices_customer_id;

-- Statement 20 from DATABASE_PERFORMANCE_COMPLETE.sql
DROP INDEX IF EXISTS idx_test_reports_customer_id;

-- Statement 21 from DATABASE_PERFORMANCE_COMPLETE.sql
DROP INDEX IF EXISTS idx_test_reports_appointment_id;

-- Statement 22 from DATABASE_PERFORMANCE_COMPLETE.sql
DROP INDEX IF EXISTS idx_invoices_customer_id;

-- Statement 23 from DATABASE_PERFORMANCE_COMPLETE.sql
DROP INDEX IF EXISTS idx_payments_customer_id;

-- Statement 24 from DATABASE_PERFORMANCE_COMPLETE.sql
DROP INDEX IF EXISTS idx_payments_invoice_id;

-- Statement 25 from DATABASE_PERFORMANCE_COMPLETE.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_device_id_optimized 
ON appointments(device_id) WHERE device_id IS NOT NULL;

-- Statement 26 from DATABASE_PERFORMANCE_COMPLETE.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_technician_id_optimized 
ON appointments(technician_id) WHERE technician_id IS NOT NULL;

-- Statement 27 from DATABASE_PERFORMANCE_COMPLETE.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_date_status 
ON appointments(appointment_date, status) WHERE appointment_date >= CURRENT_DATE;

-- Statement 28 from DATABASE_PERFORMANCE_COMPLETE.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_devices_active_lookup 
ON devices(customer_id, is_active) WHERE is_active = true;

-- Statement 29 from DATABASE_PERFORMANCE_COMPLETE.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_reports_appointment_id_optimized 
ON test_reports(appointment_id) WHERE appointment_id IS NOT NULL;

-- Statement 30 from DATABASE_PERFORMANCE_COMPLETE.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_reports_device_id_optimized 
ON test_reports(device_id) WHERE device_id IS NOT NULL;

-- Statement 31 from DATABASE_PERFORMANCE_COMPLETE.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_appointment_id_optimized 
ON invoices(appointment_id) WHERE appointment_id IS NOT NULL;

-- Statement 32 from DATABASE_PERFORMANCE_COMPLETE.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_status_due 
ON invoices(status, due_date) WHERE status IN ('sent', 'overdue');

-- Statement 33 from DATABASE_PERFORMANCE_COMPLETE.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_invoice_id_optimized 
ON payments(invoice_id) WHERE invoice_id IS NOT NULL;

-- Statement 34 from DATABASE_PERFORMANCE_COMPLETE.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status_date 
ON payments(status, payment_date) WHERE status = 'completed';

-- Statement 35 from DATABASE_PERFORMANCE_COMPLETE.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_location 
ON customers(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Statement 36 from DATABASE_PERFORMANCE_COMPLETE.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_reports_customer_date 
ON test_reports(customer_id, test_date) 
WHERE customer_id IS NOT NULL;

-- Statement 37 from DATABASE_PERFORMANCE_COMPLETE.sql
CREATE POLICY "authenticated_api_access_optimized" ON team_users
  FOR ALL USING (
    (SELECT auth.uid()) IS NOT NULL
  );

-- Statement 38 from DATABASE_PERFORMANCE_COMPLETE.sql
CREATE POLICY "authenticated_api_access_optimized" ON customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_users 
      WHERE email = (SELECT auth.jwt() ->> 'email')
      LIMIT 1
    )
  );

-- Statement 39 from DATABASE_PERFORMANCE_COMPLETE.sql
DROP POLICY IF EXISTS "Service role access" ON appointments;

-- Statement 40 from DATABASE_PERFORMANCE_COMPLETE.sql
CREATE POLICY "authenticated_api_access_optimized" ON appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_users 
      WHERE email = (SELECT auth.jwt() ->> 'email')
      LIMIT 1
    )
  );

-- Statement 41 from DATABASE_PERFORMANCE_COMPLETE.sql
DROP POLICY IF EXISTS "Service role access" ON devices;

-- Statement 42 from DATABASE_PERFORMANCE_COMPLETE.sql
CREATE POLICY "authenticated_api_access_optimized" ON devices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_users 
      WHERE email = (SELECT auth.jwt() ->> 'email')
      LIMIT 1
    )
  );

-- Statement 43 from DATABASE_PERFORMANCE_COMPLETE.sql
DROP POLICY IF EXISTS "Service role access" ON test_reports;

-- Statement 44 from DATABASE_PERFORMANCE_COMPLETE.sql
CREATE POLICY "authenticated_api_access_optimized" ON test_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_users 
      WHERE email = (SELECT auth.jwt() ->> 'email')
      LIMIT 1
    )
  );

-- Statement 45 from DATABASE_PERFORMANCE_COMPLETE.sql
CREATE POLICY "authenticated_api_access_optimized" ON invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_users 
      WHERE email = (SELECT auth.jwt() ->> 'email')
      LIMIT 1
    )
  );

-- Statement 46 from DATABASE_PERFORMANCE_COMPLETE.sql
CREATE POLICY "authenticated_api_access_optimized" ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_users 
      WHERE email = (SELECT auth.jwt() ->> 'email')
      LIMIT 1
    )
  );

-- Statement 47 from DATABASE_PERFORMANCE_COMPLETE.sql
CREATE MATERIALIZED VIEW dashboard_analytics_cache AS
SELECT 
    DATE_TRUNC('day', appointment_date) as date,
    COUNT(*) as total_appointments,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_appointments,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_appointments,
    COUNT(DISTINCT customer_id) as unique_customers,
    AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100 as completion_rate,
    SUM(CASE WHEN i.amount_total IS NOT NULL THEN i.amount_total ELSE 0 END) as daily_revenue
FROM appointments a
LEFT JOIN invoices i ON a.id = i.appointment_id
WHERE appointment_date >= (CURRENT_DATE - INTERVAL '90 days')
GROUP BY DATE_TRUNC('day', appointment_date)
ORDER BY date DESC;

-- Statement 48 from DATABASE_PERFORMANCE_COMPLETE.sql
CREATE UNIQUE INDEX ON dashboard_analytics_cache (date);

-- Statement 49 from DATABASE_PERFORMANCE_COMPLETE.sql
ALTER TABLE customers SET (
    autovacuum_vacuum_scale_factor = 0.2,
    autovacuum_analyze_scale_factor = 0.1
);

-- Statement 50 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_device_id 
ON public.appointments(device_id);

-- Statement 51 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_billing_invoices_subscription_id 
ON public.billing_invoices(subscription_id);

-- Statement 52 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_customer_id 
ON public.invoices(customer_id);

-- Statement 53 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_test_report_id 
ON public.invoices(test_report_id);

-- Statement 54 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_invoice_id 
ON public.payments(invoice_id);

-- Statement 55 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_reports_customer_id 
ON public.test_reports(customer_id);

-- Statement 56 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_reports_device_id 
ON public.test_reports(device_id);

-- Statement 57 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
CREATE POLICY "authenticated_api_access" ON public.team_users
  FOR ALL USING (
    (SELECT auth.jwt()) IS NOT NULL
  );

-- Statement 58 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
CREATE POLICY "authenticated_api_access" ON public.time_off_requests
  FOR ALL USING (
    (SELECT auth.jwt()) IS NOT NULL
  );

-- Statement 59 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
CREATE POLICY "authenticated_api_access" ON public.tester_schedules
  FOR ALL USING (
    (SELECT auth.jwt()) IS NOT NULL
  );

-- Statement 60 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
CREATE POLICY "authenticated_api_access" ON public.team_sessions
  FOR ALL USING (
    (SELECT auth.jwt()) IS NOT NULL
  );

-- Statement 61 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
CREATE POLICY "authenticated_api_access" ON public.customers
  FOR ALL USING (
    (SELECT auth.jwt()) IS NOT NULL
  );

-- Statement 62 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
CREATE POLICY "authenticated_api_access" ON public.devices
  FOR ALL USING (
    (SELECT auth.jwt()) IS NOT NULL
  );

-- Statement 63 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
CREATE POLICY "authenticated_api_access" ON public.appointments
  FOR ALL USING (
    (SELECT auth.jwt()) IS NOT NULL
  );

-- Statement 64 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
CREATE POLICY "authenticated_api_access" ON public.test_reports
  FOR ALL USING (
    (SELECT auth.jwt()) IS NOT NULL
  );

-- Statement 65 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
CREATE POLICY "Team users can view water districts" ON public.water_districts
  FOR SELECT USING (
    (SELECT auth.jwt() ->> 'email') LIKE '%@fisherbackflows.com'
  );

-- Statement 66 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
CREATE POLICY "Team users can view billing subscriptions" ON public.billing_subscriptions
  FOR SELECT USING (
    (SELECT auth.jwt() ->> 'email') LIKE '%@fisherbackflows.com'
  );

-- Statement 67 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
DROP INDEX IF EXISTS idx_team_users_role;

-- Statement 68 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
DROP INDEX IF EXISTS idx_team_sessions_user;

-- Statement 69 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
DROP INDEX IF EXISTS idx_time_off_requests_tester;

-- Statement 70 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
DROP INDEX IF EXISTS idx_time_off_requests_date;

-- Statement 71 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
DROP INDEX IF EXISTS idx_tester_schedules_tester_date;

-- Statement 72 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
DROP INDEX IF EXISTS idx_security_logs_timestamp;

-- Statement 73 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
DROP INDEX IF EXISTS idx_security_logs_event_type;

-- Statement 74 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
DROP INDEX IF EXISTS idx_security_logs_ip_address;

-- Statement 75 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
DROP INDEX IF EXISTS idx_security_logs_user_email;

-- Statement 76 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
DROP INDEX IF EXISTS idx_team_users_failed_attempts;

-- Statement 77 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
DROP INDEX IF EXISTS idx_team_users_locked_until;

-- Statement 78 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
DROP INDEX IF EXISTS idx_team_sessions_active;

-- Statement 79 from PERFORMANCE_OPTIMIZATION_CRITICAL.sql
DROP INDEX IF EXISTS idx_water_districts_email;
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these after executing the above to verify improvements:

-- 1. Check that all foreign key indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Statement 80 from EXECUTE_SECURITY_POLICIES.sql
DROP POLICY IF EXISTS "Users can insert their own invoices" ON public.billing_invoices;

-- Statement 81 from EXECUTE_SECURITY_POLICIES.sql
DROP POLICY IF EXISTS "Admin can manage all invoices" ON public.billing_invoices;

-- Statement 82 from EXECUTE_SECURITY_POLICIES.sql
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.billing_invoices;

-- Statement 83 from EXECUTE_SECURITY_POLICIES.sql
DROP POLICY IF EXISTS "Admin can insert security logs" ON public.security_logs;

-- Statement 84 from EXECUTE_SECURITY_POLICIES.sql
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;

-- Statement 85 from EXECUTE_SECURITY_POLICIES.sql
DROP POLICY IF EXISTS "Users can insert their own appointments" ON public.appointments;

-- Statement 86 from EXECUTE_SECURITY_POLICIES.sql
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;

-- Statement 87 from EXECUTE_SECURITY_POLICIES.sql
DROP POLICY IF EXISTS "Users can view their own test reports" ON public.test_reports;

-- Statement 88 from EXECUTE_SECURITY_POLICIES.sql
DROP POLICY IF EXISTS "Users can insert their own test reports" ON public.test_reports;

-- Statement 89 from EXECUTE_SECURITY_POLICIES.sql
DROP POLICY IF EXISTS "Admin can manage all test reports" ON public.test_reports;

-- Statement 90 from EXECUTE_SECURITY_POLICIES.sql
DROP POLICY IF EXISTS "Users can view their own customer data" ON public.customers;

-- Statement 91 from EXECUTE_SECURITY_POLICIES.sql
DROP POLICY IF EXISTS "Users can update their own customer data" ON public.customers;

-- Statement 92 from EXECUTE_SECURITY_POLICIES.sql
DROP POLICY IF EXISTS "Admin can manage all customers" ON public.customers;

-- Statement 93 from EXECUTE_SECURITY_POLICIES.sql
DROP POLICY IF EXISTS "Users can view their own devices" ON public.devices;

-- Statement 94 from EXECUTE_SECURITY_POLICIES.sql
DROP POLICY IF EXISTS "Admin can manage all devices" ON public.devices;

-- Statement 95 from EXECUTE_SECURITY_POLICIES.sql
DROP POLICY IF EXISTS "Admin can view team users" ON public.team_users;

-- ✅ All mobile features SQL combined
