-- ===================================================================
-- SIMPLIFIED RLS FOR REMAINING TABLES
-- ===================================================================
-- Let's add them one by one to identify the problem
-- ===================================================================

-- First, let's check what columns exist in billing_subscriptions
-- to see if customer_id is UUID or text
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'billing_subscriptions' 
AND column_name = 'customer_id';

-- Check billing_invoices structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'billing_invoices' 
AND column_name = 'customer_id';

-- Let's start with tables that don't have customer_id issues

-- TEAM_USERS: Team members only
ALTER TABLE public.team_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "team_users_team_only" ON public.team_users
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- SECURITY_LOGS: Admin only
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "security_logs_admin_only" ON public.security_logs
  FOR ALL TO authenticated
  USING (public.is_admin());

-- AUDIT_LOGS: Admin only
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "audit_logs_admin_only" ON public.audit_logs
  FOR ALL TO authenticated
  USING (public.is_admin());

-- LEADS: Team members only
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "leads_team_only" ON public.leads
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- TECHNICIAN_LOCATIONS: Team only
ALTER TABLE public.technician_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "technician_locations_team" ON public.technician_locations
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- TECHNICIAN_CURRENT_LOCATION: Team only
ALTER TABLE public.technician_current_location ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "technician_current_location_team" ON public.technician_current_location
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- TESTER_SCHEDULES: Team only
ALTER TABLE public.tester_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "tester_schedules_team" ON public.tester_schedules
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- NOTIFICATION_TEMPLATES: Team only
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "notification_templates_team" ON public.notification_templates
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- NOTIFICATION_LOGS: Team only
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "notification_logs_team" ON public.notification_logs
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- NOTIFICATION_INTERACTIONS: Team only
ALTER TABLE public.notification_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "notification_interactions_team" ON public.notification_interactions
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- WATER_DISTRICTS: Read for all, write for team
ALTER TABLE public.water_districts ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "water_districts_read_all" ON public.water_districts
  FOR SELECT TO authenticated
  USING (true);
CREATE POLICY IF NOT EXISTS "water_districts_write_team" ON public.water_districts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_team_member());
CREATE POLICY IF NOT EXISTS "water_districts_update_team" ON public.water_districts
  FOR UPDATE TO authenticated
  USING (public.is_team_member());
CREATE POLICY IF NOT EXISTS "water_districts_delete_team" ON public.water_districts
  FOR DELETE TO authenticated
  USING (public.is_team_member());

-- Count how many tables have RLS now
SELECT 
  COUNT(*) as total_tables,
  COUNT(CASE WHEN rowsecurity THEN 1 END) as rls_enabled_count
FROM pg_tables 
WHERE schemaname = 'public';

SELECT 'Simple RLS policies added for team-only tables' as status;