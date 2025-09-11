-- Comprehensive Row Level Security (RLS) Implementation
-- Fisher Backflows Platform - Database Security Enhancement
-- This script addresses the security advisories by implementing proper RLS policies

-- =====================================================
-- PART 1: ENABLE RLS ON ALL CORE TABLES
-- =====================================================

-- Core business tables
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;

-- Support tables
ALTER TABLE IF EXISTS public.team_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Billing tables (addressing security advisory)
ALTER TABLE IF EXISTS public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.billing_invoices ENABLE ROW LEVEL SECURITY;

-- Location tracking tables (addressing security advisory)
ALTER TABLE IF EXISTS public.technician_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.technician_current_location ENABLE ROW LEVEL SECURITY;

-- Notification tables
ALTER TABLE IF EXISTS public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notification_interactions ENABLE ROW LEVEL SECURITY;

-- Water district tables
ALTER TABLE IF EXISTS public.water_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.water_department_submissions ENABLE ROW LEVEL SECURITY;

-- Additional business tables
ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tester_schedules ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 2: DROP EXISTING POLICIES (IF ANY) TO START FRESH
-- =====================================================

-- Drop existing policies to avoid conflicts
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                          pol.policyname, pol.schemaname, pol.tablename);
        EXCEPTION
            WHEN OTHERS THEN
                -- Policy might not exist, continue
                CONTINUE;
        END;
    END LOOP;
END $$;

-- =====================================================
-- PART 3: CUSTOMER DATA ISOLATION POLICIES
-- =====================================================

-- Customers can only see their own data
CREATE POLICY "customers_own_data" ON public.customers
    FOR ALL 
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Devices belong to customers
CREATE POLICY "devices_customer_access" ON public.devices
    FOR ALL 
    USING (customer_id = auth.uid())
    WITH CHECK (customer_id = auth.uid());

-- Appointments belong to customers
CREATE POLICY "appointments_customer_access" ON public.appointments
    FOR ALL 
    USING (customer_id = auth.uid())
    WITH CHECK (customer_id = auth.uid());

-- Invoices belong to customers
CREATE POLICY "invoices_customer_access" ON public.invoices
    FOR ALL 
    USING (customer_id = auth.uid())
    WITH CHECK (customer_id = auth.uid());

-- Invoice line items through invoices
CREATE POLICY "invoice_line_items_customer_access" ON public.invoice_line_items
    FOR ALL 
    USING (
        invoice_id IN (
            SELECT id FROM public.invoices WHERE customer_id = auth.uid()
        )
    )
    WITH CHECK (
        invoice_id IN (
            SELECT id FROM public.invoices WHERE customer_id = auth.uid()
        )
    );

-- Test reports belong to customers through devices
CREATE POLICY "test_reports_customer_access" ON public.test_reports
    FOR ALL 
    USING (
        device_id IN (
            SELECT id FROM public.devices WHERE customer_id = auth.uid()
        )
    )
    WITH CHECK (
        device_id IN (
            SELECT id FROM public.devices WHERE customer_id = auth.uid()
        )
    );

-- Payments belong to customers through invoices
CREATE POLICY "payments_customer_access" ON public.payments
    FOR ALL 
    USING (
        invoice_id IN (
            SELECT id FROM public.invoices WHERE customer_id = auth.uid()
        )
    )
    WITH CHECK (
        invoice_id IN (
            SELECT id FROM public.invoices WHERE customer_id = auth.uid()
        )
    );

-- =====================================================
-- PART 4: TEAM ACCESS POLICIES
-- =====================================================

-- Team users can see their own data and manage customers when authenticated as team
CREATE POLICY "team_users_access" ON public.team_users
    FOR ALL 
    USING (
        -- Team members can see their own data
        auth.uid() = id OR 
        -- Or if they're authenticated team users
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'tester')
        )
    )
    WITH CHECK (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Team sessions for team users only
CREATE POLICY "team_sessions_access" ON public.team_sessions
    FOR ALL 
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'tester')
        )
    )
    WITH CHECK (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- PART 5: ADMINISTRATIVE AND AUDIT POLICIES
-- =====================================================

-- Security logs - admin and service role access only
CREATE POLICY "security_logs_admin_access" ON public.security_logs
    FOR ALL 
    USING (
        -- Admin users can see all security logs
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND role = 'admin'
        ) OR
        -- Users can see their own security logs
        user_id = auth.uid()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Audit logs - admin access only
CREATE POLICY "audit_logs_admin_access" ON public.audit_logs
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- PART 6: EMAIL VERIFICATION POLICIES
-- =====================================================

-- Email verifications - users can manage their own
CREATE POLICY "email_verifications_user_access" ON public.email_verifications
    FOR ALL 
    USING (
        -- Users can see their own email verifications
        user_id = auth.uid() OR
        -- Admin can see all
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- PART 7: BILLING SYSTEM POLICIES (Security Advisory Fix)
-- =====================================================

-- Billing subscriptions - customer access to their own
CREATE POLICY "billing_subscriptions_customer_access" ON public.billing_subscriptions
    FOR ALL 
    USING (
        customer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'tester')
        )
    )
    WITH CHECK (
        customer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Billing invoices - customer and admin access
CREATE POLICY "billing_invoices_access" ON public.billing_invoices
    FOR ALL 
    USING (
        customer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'tester')
        )
    )
    WITH CHECK (
        customer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- PART 8: LOCATION TRACKING POLICIES (Security Advisory Fix)
-- =====================================================

-- Technician locations - only relevant technician and admin access
CREATE POLICY "technician_locations_access" ON public.technician_locations
    FOR ALL 
    USING (
        technician_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'tester')
        )
    )
    WITH CHECK (
        technician_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'tester')
        )
    );

-- Current technician location - same as above
CREATE POLICY "technician_current_location_access" ON public.technician_current_location
    FOR ALL 
    USING (
        technician_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'tester')
        )
    )
    WITH CHECK (
        technician_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'tester')
        )
    );

-- =====================================================
-- PART 9: NOTIFICATION SYSTEM POLICIES
-- =====================================================

-- Push subscriptions - users can manage their own
CREATE POLICY "push_subscriptions_user_access" ON public.push_subscriptions
    FOR ALL 
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Notification logs - users can see their own notifications
CREATE POLICY "notification_logs_user_access" ON public.notification_logs
    FOR ALL 
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Notification interactions - users can manage their own
CREATE POLICY "notification_interactions_user_access" ON public.notification_interactions
    FOR ALL 
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- PART 10: WATER DISTRICT AND SUBMISSION POLICIES
-- =====================================================

-- Water districts - read access for authenticated users, admin write access
CREATE POLICY "water_districts_read_access" ON public.water_districts
    FOR SELECT 
    USING (
        auth.uid() IS NOT NULL
    );

CREATE POLICY "water_districts_admin_write" ON public.water_districts
    FOR INSERT, UPDATE, DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Water department submissions - team access for submissions
CREATE POLICY "water_submissions_team_access" ON public.water_department_submissions
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'tester')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'tester')
        )
    );

-- =====================================================
-- PART 11: BUSINESS OPERATION POLICIES
-- =====================================================

-- Leads - team access only
CREATE POLICY "leads_team_access" ON public.leads
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'tester')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'tester')
        )
    );

-- Time off requests - team members can see their own and admins can see all
CREATE POLICY "time_off_requests_access" ON public.time_off_requests
    FOR ALL 
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Tester schedules - team access
CREATE POLICY "tester_schedules_team_access" ON public.tester_schedules
    FOR ALL 
    USING (
        tester_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'tester')
        )
    )
    WITH CHECK (
        tester_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'tester')
        )
    );

-- =====================================================
-- PART 12: SERVICE ROLE POLICIES
-- =====================================================

-- Grant service role access to all tables for system operations
-- This is essential for API operations, background jobs, and system maintenance

-- Enable service role bypass for all core tables
CREATE POLICY "service_role_bypass_customers" ON public.customers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_bypass_devices" ON public.devices FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_bypass_appointments" ON public.appointments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_bypass_invoices" ON public.invoices FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_bypass_invoice_line_items" ON public.invoice_line_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_bypass_test_reports" ON public.test_reports FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_bypass_payments" ON public.payments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_bypass_team_users" ON public.team_users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_bypass_team_sessions" ON public.team_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_bypass_security_logs" ON public.security_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_bypass_audit_logs" ON public.audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_bypass_email_verifications" ON public.email_verifications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_bypass_billing_subscriptions" ON public.billing_subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_bypass_billing_invoices" ON public.billing_invoices FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_bypass_technician_locations" ON public.technician_locations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_bypass_technician_current_location" ON public.technician_current_location FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_bypass_push_subscriptions" ON public.push_subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_bypass_notification_logs" ON public.notification_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_bypass_notification_interactions" ON public.notification_interactions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_bypass_water_districts" ON public.water_districts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_bypass_water_department_submissions" ON public.water_department_submissions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_bypass_leads" ON public.leads FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_bypass_time_off_requests" ON public.time_off_requests FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_bypass_tester_schedules" ON public.tester_schedules FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =====================================================
-- PART 13: PUBLIC READ ACCESS FOR STATIC DATA
-- =====================================================

-- Allow public read access to notification templates (needed for PWA)
CREATE POLICY "notification_templates_public_read" ON public.notification_templates
    FOR SELECT 
    USING (true);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- These queries will be run after policy creation to verify everything is working
-- (These are just comments for reference - the actual verification will be done by the script)

/*
SELECT 
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN 'Enabled' ELSE 'Disabled' END as rls_status,
    COUNT(pol.policyname) as policy_count
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
LEFT JOIN pg_policies pol ON pol.schemaname = n.nspname AND pol.tablename = c.relname
WHERE n.nspname = 'public' 
  AND c.relkind = 'r'
  AND c.relrowsecurity = true
GROUP BY schemaname, tablename, rowsecurity
ORDER BY tablename;
*/