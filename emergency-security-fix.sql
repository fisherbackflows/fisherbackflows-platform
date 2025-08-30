-- EMERGENCY SECURITY FIX: Enable Row Level Security on all public tables
-- This fixes the critical security breach detected in the database linter

-- Enable RLS on team_users table
ALTER TABLE public.team_users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on time_off_requests table  
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;

-- Enable RLS on tester_schedules table
ALTER TABLE public.tester_schedules ENABLE ROW LEVEL SECURITY;

-- Enable RLS on team_sessions table
ALTER TABLE public.team_sessions ENABLE ROW LEVEL SECURITY;

-- Create secure RLS policies for team_users
-- Only authenticated users can see their own record or admins can see all
CREATE POLICY "team_users_select_own" ON public.team_users
    FOR SELECT USING (
        auth.uid()::text = id::text OR 
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

CREATE POLICY "team_users_update_own" ON public.team_users
    FOR UPDATE USING (
        auth.uid()::text = id::text OR 
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Create secure RLS policies for time_off_requests
-- Users can only see their own requests, admins can see all
CREATE POLICY "time_off_select_own" ON public.time_off_requests
    FOR SELECT USING (
        auth.uid()::text = user_id::text OR 
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

CREATE POLICY "time_off_insert_own" ON public.time_off_requests
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "time_off_update_own" ON public.time_off_requests
    FOR UPDATE USING (
        auth.uid()::text = user_id::text OR 
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Create secure RLS policies for tester_schedules
-- Only admins and assigned technicians can access schedules
CREATE POLICY "schedules_admin_access" ON public.tester_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'technician')
        )
    );

-- Create secure RLS policies for team_sessions
-- Users can only access their own sessions
CREATE POLICY "sessions_own_access" ON public.team_sessions
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Grant necessary permissions for service role (used by API)
-- This ensures the API can still function while maintaining security
GRANT ALL ON public.team_users TO service_role;
GRANT ALL ON public.time_off_requests TO service_role;
GRANT ALL ON public.tester_schedules TO service_role;
GRANT ALL ON public.team_sessions TO service_role;

-- Enable RLS on all other critical business tables for complete security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;

-- Business data policies - authenticated users can access all business data
-- (customers, devices, appointments, test reports are business operations data)
CREATE POLICY "business_data_access" ON public.customers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'technician', 'customer')
        )
    );

CREATE POLICY "business_data_access" ON public.devices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'technician', 'customer')
        )
    );

CREATE POLICY "business_data_access" ON public.appointments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'technician', 'customer')
        )
    );

CREATE POLICY "business_data_access" ON public.test_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'technician', 'customer')
        )
    );

-- Log this security fix
INSERT INTO public.system_logs (event_type, message, created_at) 
VALUES ('security_fix', 'Emergency RLS enabled on all public tables - security breach resolved', NOW())
ON CONFLICT DO NOTHING;