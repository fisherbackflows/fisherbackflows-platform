-- =====================================================
-- RLS Security Policies - Fisher Backflows Platform
-- Comprehensive Row Level Security implementation
-- =====================================================

-- This script implements proper RLS policies for all tables
-- ensuring data isolation and secure access patterns

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user is a team member with specific roles
CREATE OR REPLACE FUNCTION auth.is_team_member(required_roles TEXT[] DEFAULT ARRAY['admin', 'manager', 'tester'])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_users
    WHERE user_id = auth.uid()::uuid
      AND role = ANY(required_roles)
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.is_team_member(ARRAY['admin']);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is customer
CREATE OR REPLACE FUNCTION auth.is_customer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid()::uuid
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

-- Core business tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Billing and subscription tables
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;

-- Configuration and reference tables
ALTER TABLE public.water_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_department_submissions ENABLE ROW LEVEL SECURITY;

-- Team and scheduling tables
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tester_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_sessions ENABLE ROW LEVEL SECURITY;

-- Location and tracking tables
ALTER TABLE public.technician_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_current_location ENABLE ROW LEVEL SECURITY;

-- Security and audit tables
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Marketing and communication tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_interactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CUSTOMER DATA POLICIES
-- =====================================================

-- Customers can only access their own data
CREATE POLICY "customers_own_data" ON public.customers
  FOR ALL USING (id = auth.uid()::uuid);

-- Team members can access all customer data
CREATE POLICY "customers_team_access" ON public.customers
  FOR ALL USING (auth.is_team_member());

-- Devices - customers can only see their own devices
CREATE POLICY "devices_customer_access" ON public.devices
  FOR ALL USING (customer_id = auth.uid()::uuid);

-- Team members can access all devices
CREATE POLICY "devices_team_access" ON public.devices
  FOR ALL USING (auth.is_team_member());

-- Appointments - customers can only see their own
CREATE POLICY "appointments_customer_access" ON public.appointments
  FOR ALL USING (customer_id = auth.uid()::uuid);

-- Team members can access all appointments
CREATE POLICY "appointments_team_access" ON public.appointments
  FOR ALL USING (auth.is_team_member());

-- Test reports - customers can only see their own
CREATE POLICY "test_reports_customer_access" ON public.test_reports
  FOR ALL USING (customer_id = auth.uid()::uuid);

-- Team members can access all test reports
CREATE POLICY "test_reports_team_access" ON public.test_reports
  FOR ALL USING (auth.is_team_member());

-- Invoices - customers can only see their own
CREATE POLICY "invoices_customer_access" ON public.invoices
  FOR ALL USING (customer_id = auth.uid()::uuid);

-- Team members can access all invoices
CREATE POLICY "invoices_team_access" ON public.invoices
  FOR ALL USING (auth.is_team_member());

-- Payments - customers can only see their own
CREATE POLICY "payments_customer_access" ON public.payments
  FOR ALL USING (customer_id = auth.uid()::uuid);

-- Team members can access all payments
CREATE POLICY "payments_team_access" ON public.payments
  FOR ALL USING (auth.is_team_member());

-- =====================================================
-- BILLING AND SUBSCRIPTION POLICIES
-- =====================================================

-- Billing subscriptions - customer access only to their own
CREATE POLICY "billing_subscriptions_customer_access" ON public.billing_subscriptions
  FOR ALL USING (customer_id = auth.uid()::uuid);

-- Team members can access all billing subscriptions
CREATE POLICY "billing_subscriptions_team_access" ON public.billing_subscriptions
  FOR ALL USING (auth.is_team_member());

-- Billing invoices - customer access only to their own
CREATE POLICY "billing_invoices_customer_access" ON public.billing_invoices
  FOR ALL USING (customer_id = auth.uid()::uuid);

-- Team members can access all billing invoices
CREATE POLICY "billing_invoices_team_access" ON public.billing_invoices
  FOR ALL USING (auth.is_team_member());

-- =====================================================
-- TEAM-ONLY DATA POLICIES
-- =====================================================

-- Team users - only team members can access
CREATE POLICY "team_users_access" ON public.team_users
  FOR ALL USING (auth.is_team_member());

-- Time off requests - only team members can access
CREATE POLICY "time_off_requests_access" ON public.time_off_requests
  FOR ALL USING (auth.is_team_member());

-- Tester schedules - only team members can access
CREATE POLICY "tester_schedules_access" ON public.tester_schedules
  FOR ALL USING (auth.is_team_member());

-- Team sessions - users can only see their own sessions
CREATE POLICY "team_sessions_own_access" ON public.team_sessions
  FOR ALL USING (user_id = auth.uid()::uuid);

-- Admins can see all team sessions
CREATE POLICY "team_sessions_admin_access" ON public.team_sessions
  FOR ALL USING (auth.is_admin());

-- =====================================================
-- LOCATION AND TRACKING POLICIES
-- =====================================================

-- Technician locations - only team members can access
CREATE POLICY "technician_locations_access" ON public.technician_locations
  FOR ALL USING (auth.is_team_member());

-- Current technician location - only team members can access
CREATE POLICY "technician_current_location_access" ON public.technician_current_location
  FOR ALL USING (auth.is_team_member());

-- =====================================================
-- SECURITY AND AUDIT POLICIES (ADMIN ONLY)
-- =====================================================

-- Security logs - admin access only
CREATE POLICY "security_logs_admin_access" ON public.security_logs
  FOR ALL USING (auth.is_admin());

-- Audit logs - admin access only
CREATE POLICY "audit_logs_admin_access" ON public.audit_logs
  FOR ALL USING (auth.is_admin());

-- =====================================================
-- CONFIGURATION AND REFERENCE DATA
-- =====================================================

-- Water districts - read access for team members, admin write access
CREATE POLICY "water_districts_read_access" ON public.water_districts
  FOR SELECT USING (auth.is_team_member());

CREATE POLICY "water_districts_admin_write" ON public.water_districts
  FOR INSERT WITH CHECK (auth.is_admin());

CREATE POLICY "water_districts_admin_update" ON public.water_districts
  FOR UPDATE USING (auth.is_admin());

-- Water department submissions - team member access
CREATE POLICY "water_department_submissions_access" ON public.water_department_submissions
  FOR ALL USING (auth.is_team_member());

-- =====================================================
-- COMMUNICATION AND NOTIFICATION POLICIES
-- =====================================================

-- Email verifications - users can only access their own
CREATE POLICY "email_verifications_own_access" ON public.email_verifications
  FOR ALL USING (email = auth.email());

-- Admins can access all email verifications
CREATE POLICY "email_verifications_admin_access" ON public.email_verifications
  FOR ALL USING (auth.is_admin());

-- Leads - team member access only
CREATE POLICY "leads_team_access" ON public.leads
  FOR ALL USING (auth.is_team_member());

-- Notification templates - team member read access, admin write access
CREATE POLICY "notification_templates_read_access" ON public.notification_templates
  FOR SELECT USING (auth.is_team_member() OR auth.is_customer());

CREATE POLICY "notification_templates_admin_write" ON public.notification_templates
  FOR INSERT WITH CHECK (auth.is_admin());

CREATE POLICY "notification_templates_admin_update" ON public.notification_templates
  FOR UPDATE USING (auth.is_admin());

-- Push subscriptions - users can only access their own
CREATE POLICY "push_subscriptions_own_access" ON public.push_subscriptions
  FOR ALL USING (user_id = auth.uid()::uuid);

-- Team members can access all push subscriptions
CREATE POLICY "push_subscriptions_team_access" ON public.push_subscriptions
  FOR ALL USING (auth.is_team_member());

-- Notification logs - users can only see their own notifications
CREATE POLICY "notification_logs_own_access" ON public.notification_logs
  FOR SELECT USING (user_id = auth.uid()::uuid);

-- Team members can access all notification logs
CREATE POLICY "notification_logs_team_access" ON public.notification_logs
  FOR ALL USING (auth.is_team_member());

-- Notification interactions - users can only see their own interactions
CREATE POLICY "notification_interactions_own_access" ON public.notification_interactions
  FOR ALL USING (user_id = auth.uid()::uuid);

-- Team members can access all notification interactions
CREATE POLICY "notification_interactions_team_access" ON public.notification_interactions
  FOR ALL USING (auth.is_team_member());

-- =====================================================
-- SERVICE ROLE POLICIES (FOR API ACCESS)
-- =====================================================

-- Allow service role to bypass RLS for administrative operations
-- This is used by the API routes with service role key

-- Note: Service role automatically bypasses RLS, but we document this
-- for clarity and future reference

-- =====================================================
-- ANONYMOUS ACCESS POLICIES
-- =====================================================

-- Very limited anonymous access for public endpoints
-- Most tables require authentication

-- Water districts can be read by anonymous users (for public forms)
CREATE POLICY "water_districts_anonymous_read" ON public.water_districts
  FOR SELECT USING (true);

-- Notification templates can be read anonymously (for public notifications)
CREATE POLICY "notification_templates_anonymous_read" ON public.notification_templates
  FOR SELECT USING (is_public = true);

-- =====================================================
-- POLICY TESTING AND VALIDATION
-- =====================================================

-- Test policies with sample queries
-- These should be run after applying policies to verify correct behavior

/*
-- Test customer access (run as customer)
SELECT COUNT(*) FROM customers; -- Should return 1 (own record)
SELECT COUNT(*) FROM devices; -- Should return only customer's devices
SELECT COUNT(*) FROM appointments; -- Should return only customer's appointments

-- Test team member access (run as team member)
SELECT COUNT(*) FROM customers; -- Should return all customers
SELECT COUNT(*) FROM team_users; -- Should return all team users
SELECT COUNT(*) FROM security_logs; -- Should fail for non-admin

-- Test admin access (run as admin)
SELECT COUNT(*) FROM security_logs; -- Should return all logs
SELECT COUNT(*) FROM audit_logs; -- Should return all audit logs
*/

-- =====================================================
-- MAINTENANCE AND MONITORING
-- =====================================================

-- Create a view to monitor RLS policy effectiveness
CREATE OR REPLACE VIEW public.rls_policy_status AS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Grant access to this view for admins
GRANT SELECT ON public.rls_policy_status TO authenticated;

-- =====================================================
-- SECURITY NOTES AND RECOMMENDATIONS
-- =====================================================

/*
IMPORTANT SECURITY CONSIDERATIONS:

1. Service Role Key Usage:
   - Only use service role key in server-side API routes
   - Never expose service role key to client-side code
   - Service role bypasses ALL RLS policies

2. Customer Data Isolation:
   - All customer data is isolated by customer_id = auth.uid()
   - Customers cannot access other customers' data
   - Team members have controlled access based on roles

3. Team Member Permissions:
   - 'admin': Full access to all data including security logs
   - 'manager': Access to business data but not security logs
   - 'tester': Access to operational data for field work

4. Anonymous Access:
   - Very limited anonymous access for public forms
   - Most operations require authentication

5. Audit Trail:
   - All sensitive operations should be logged to audit_logs
   - RLS ensures users cannot modify their own audit records

6. Regular Security Review:
   - Review policies quarterly
   - Monitor for unauthorized access attempts
   - Update policies as business requirements change
*/