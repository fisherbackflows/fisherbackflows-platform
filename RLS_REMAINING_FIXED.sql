-- ===================================================================
-- SIMPLIFIED RLS FOR REMAINING TABLES (FIXED)
-- ===================================================================
-- Add RLS to remaining tables without type issues
-- ===================================================================

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "team_users_team_only" ON public.team_users;
DROP POLICY IF EXISTS "security_logs_admin_only" ON public.security_logs;
DROP POLICY IF EXISTS "audit_logs_admin_only" ON public.audit_logs;
DROP POLICY IF EXISTS "leads_team_only" ON public.leads;
DROP POLICY IF EXISTS "technician_locations_team" ON public.technician_locations;
DROP POLICY IF EXISTS "technician_current_location_team" ON public.technician_current_location;
DROP POLICY IF EXISTS "tester_schedules_team" ON public.tester_schedules;
DROP POLICY IF EXISTS "notification_templates_team" ON public.notification_templates;
DROP POLICY IF EXISTS "notification_logs_team" ON public.notification_logs;
DROP POLICY IF EXISTS "notification_interactions_team" ON public.notification_interactions;
DROP POLICY IF EXISTS "water_districts_read_all" ON public.water_districts;
DROP POLICY IF EXISTS "water_districts_write_team" ON public.water_districts;
DROP POLICY IF EXISTS "water_districts_update_team" ON public.water_districts;
DROP POLICY IF EXISTS "water_districts_delete_team" ON public.water_districts;

-- TEAM_USERS: Team members only
ALTER TABLE public.team_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_users_team_only" ON public.team_users
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- SECURITY_LOGS: Admin only
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "security_logs_admin_only" ON public.security_logs
  FOR ALL TO authenticated
  USING (public.is_admin());

-- AUDIT_LOGS: Admin only
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_admin_only" ON public.audit_logs
  FOR ALL TO authenticated
  USING (public.is_admin());

-- LEADS: Team members only
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_team_only" ON public.leads
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- TECHNICIAN_LOCATIONS: Team only
ALTER TABLE public.technician_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "technician_locations_team" ON public.technician_locations
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- TECHNICIAN_CURRENT_LOCATION: Team only
ALTER TABLE public.technician_current_location ENABLE ROW LEVEL SECURITY;
CREATE POLICY "technician_current_location_team" ON public.technician_current_location
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- TESTER_SCHEDULES: Team only
ALTER TABLE public.tester_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tester_schedules_team" ON public.tester_schedules
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- NOTIFICATION_TEMPLATES: Team only
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_templates_team" ON public.notification_templates
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- NOTIFICATION_LOGS: Team only
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_logs_team" ON public.notification_logs
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- NOTIFICATION_INTERACTIONS: Team only
ALTER TABLE public.notification_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_interactions_team" ON public.notification_interactions
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- WATER_DISTRICTS: Read for all, write for team
ALTER TABLE public.water_districts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "water_districts_read_all" ON public.water_districts
  FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "water_districts_write_team" ON public.water_districts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_team_member());
CREATE POLICY "water_districts_update_team" ON public.water_districts
  FOR UPDATE TO authenticated
  USING (public.is_team_member());
CREATE POLICY "water_districts_delete_team" ON public.water_districts
  FOR DELETE TO authenticated
  USING (public.is_team_member());

-- Count how many tables have RLS now
SELECT 
  COUNT(*) as total_tables,
  COUNT(CASE WHEN rowsecurity THEN 1 END) as rls_enabled_count,
  ROUND(COUNT(CASE WHEN rowsecurity THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as rls_coverage_percent
FROM pg_tables 
WHERE schemaname = 'public';

SELECT 'RLS added for 11 additional tables' as status;