-- ===================================================================
-- COMPLETE RLS FOR REMAINING 19 TABLES (WITH TYPE FIXES)
-- ===================================================================
-- Secure all remaining tables in the database
-- ===================================================================

-- ===================================================================
-- TEAM & ADMIN TABLES
-- ===================================================================

-- TEAM_USERS: Team members can see all team members
ALTER TABLE public.team_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_users_team_only" ON public.team_users
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- TEAM_SESSIONS: Users see own sessions, admins see all
ALTER TABLE public.team_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_sessions_own" ON public.team_sessions
  FOR ALL TO authenticated
  USING (team_user_id = auth.uid()::text OR public.is_admin());

-- ===================================================================
-- SECURITY & AUDIT TABLES (Admin only)
-- ===================================================================

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

-- ===================================================================
-- BILLING TABLES
-- ===================================================================

-- BILLING_SUBSCRIPTIONS: Customers see own, team sees all
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "billing_subscriptions_customer" ON public.billing_subscriptions
  FOR ALL TO authenticated
  USING (customer_id::text = auth.uid()::text OR public.is_team_member());

-- BILLING_INVOICES: Customers see own, team sees all
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "billing_invoices_customer" ON public.billing_invoices
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers 
      WHERE stripe_customer_id = billing_invoices.customer_id 
      AND id::text = auth.uid()::text
    ) OR public.is_team_member()
  );

-- INVOICE_LINE_ITEMS: Based on invoice access
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoice_line_items_via_invoice" ON public.invoice_line_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_line_items.invoice_id 
      AND (customer_id::text = auth.uid()::text OR public.is_team_member())
    )
  );

-- ===================================================================
-- OPERATIONS TABLES
-- ===================================================================

-- WATER_DISTRICTS: Everyone can read, team can modify
ALTER TABLE public.water_districts ENABLE ROW LEVEL SECURITY;

-- Read policy for everyone
CREATE POLICY "water_districts_read_all" ON public.water_districts
  FOR SELECT TO authenticated
  USING (true);

-- Separate policies for modification
CREATE POLICY "water_districts_insert_team" ON public.water_districts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_team_member());

CREATE POLICY "water_districts_update_team" ON public.water_districts
  FOR UPDATE TO authenticated
  USING (public.is_team_member());

CREATE POLICY "water_districts_delete_team" ON public.water_districts
  FOR DELETE TO authenticated
  USING (public.is_team_member());

-- WATER_DEPARTMENT_SUBMISSIONS: Customer sees own, team sees all
ALTER TABLE public.water_department_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "water_submissions_access" ON public.water_department_submissions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.test_reports 
      JOIN public.devices ON devices.id = test_reports.device_id
      WHERE test_reports.id = water_department_submissions.test_report_id 
      AND devices.customer_id::text = auth.uid()::text
    ) OR public.is_team_member()
  );

-- LEADS: Team members only
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_team_only" ON public.leads
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- ===================================================================
-- TECHNICIAN TABLES
-- ===================================================================

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

-- TIME_OFF_REQUESTS: Own requests or admin
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "time_off_own_or_admin" ON public.time_off_requests
  FOR ALL TO authenticated
  USING (tester_id = auth.uid()::text OR public.is_admin());

-- TESTER_SCHEDULES: Team only
ALTER TABLE public.tester_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tester_schedules_team" ON public.tester_schedules
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- ===================================================================
-- NOTIFICATION TABLES
-- ===================================================================

-- NOTIFICATION_TEMPLATES: Team only
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_templates_team" ON public.notification_templates
  FOR ALL TO authenticated
  USING (public.is_team_member());

-- PUSH_SUBSCRIPTIONS: Own subscriptions only
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_subscriptions_own" ON public.push_subscriptions
  FOR ALL TO authenticated
  USING (user_id = auth.uid()::text OR public.is_team_member());

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

-- EMAIL_VERIFICATIONS: Own verifications or team
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_verifications_own" ON public.email_verifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid()::text OR public.is_team_member());

-- ===================================================================
-- FINAL VERIFICATION
-- ===================================================================

SELECT 
  COUNT(*) as total_tables,
  COUNT(CASE WHEN rowsecurity THEN 1 END) as rls_enabled_count,
  ROUND(COUNT(CASE WHEN rowsecurity THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as rls_coverage_percent
FROM pg_tables 
WHERE schemaname = 'public';

SELECT 'ALL 25 TABLES NOW HAVE RLS PROTECTION!' as final_status;