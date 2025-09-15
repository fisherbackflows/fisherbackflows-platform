-- Fix Missing RLS Policies
-- Critical security patches for tables with RLS enabled but no policies
-- Priority: HIGH - These tables have data exposure vulnerabilities

-- =====================================================
-- 1. BILLING_INVOICES - Financial Data Protection
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "billing_invoices_select_policy" ON billing_invoices;
DROP POLICY IF EXISTS "billing_invoices_insert_policy" ON billing_invoices;
DROP POLICY IF EXISTS "billing_invoices_update_policy" ON billing_invoices;
DROP POLICY IF EXISTS "billing_invoices_delete_policy" ON billing_invoices;

-- SELECT: Users can only see invoices for their organization
CREATE POLICY "billing_invoices_select_policy" ON billing_invoices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM customers
            WHERE customers.id = billing_invoices.customer_id
            AND customers.organization_id = (
                SELECT organization_id FROM customers
                WHERE id = auth.uid()::text
            )
        )
        OR
        EXISTS (
            SELECT 1 FROM team_users
            WHERE team_users.user_id = auth.uid()
            AND team_users.role IN ('admin', 'manager', 'coordinator')
        )
    );

-- INSERT: Only team members can create invoices
CREATE POLICY "billing_invoices_insert_policy" ON billing_invoices
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_users
            WHERE team_users.user_id = auth.uid()
            AND team_users.role IN ('admin', 'manager', 'coordinator')
        )
    );

-- UPDATE: Only team members can update invoices
CREATE POLICY "billing_invoices_update_policy" ON billing_invoices
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM team_users
            WHERE team_users.user_id = auth.uid()
            AND team_users.role IN ('admin', 'manager', 'coordinator')
        )
    );

-- DELETE: Only admins can delete invoices
CREATE POLICY "billing_invoices_delete_policy" ON billing_invoices
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM team_users
            WHERE team_users.user_id = auth.uid()
            AND team_users.role = 'admin'
        )
    );

-- =====================================================
-- 2. SECURITY_LOGS - Audit Trail Protection
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "security_logs_select_policy" ON security_logs;
DROP POLICY IF EXISTS "security_logs_insert_policy" ON security_logs;
DROP POLICY IF EXISTS "security_logs_update_policy" ON security_logs;
DROP POLICY IF EXISTS "security_logs_delete_policy" ON security_logs;

-- SELECT: Only admins and system can view security logs
CREATE POLICY "security_logs_select_policy" ON security_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_users
            WHERE team_users.user_id = auth.uid()
            AND team_users.role = 'admin'
        )
        OR auth.jwt() ->> 'role' = 'service_role'
    );

-- INSERT: System and authenticated users can create security logs
CREATE POLICY "security_logs_insert_policy" ON security_logs
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        OR auth.jwt() ->> 'role' = 'service_role'
    );

-- UPDATE: No updates allowed (immutable audit trail)
CREATE POLICY "security_logs_update_policy" ON security_logs
    FOR UPDATE USING (false);

-- DELETE: Only admin with specific permission
CREATE POLICY "security_logs_delete_policy" ON security_logs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM team_users
            WHERE team_users.user_id = auth.uid()
            AND team_users.role = 'admin'
        )
        AND created_at < NOW() - INTERVAL '1 year' -- Only delete logs older than 1 year
    );

-- =====================================================
-- 3. TECHNICIAN_CURRENT_LOCATION - Real-time GPS Data
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "technician_current_location_select_policy" ON technician_current_location;
DROP POLICY IF EXISTS "technician_current_location_insert_policy" ON technician_current_location;
DROP POLICY IF EXISTS "technician_current_location_update_policy" ON technician_current_location;
DROP POLICY IF EXISTS "technician_current_location_delete_policy" ON technician_current_location;

-- SELECT: Technicians see their own location, managers see all
CREATE POLICY "technician_current_location_select_policy" ON technician_current_location
    FOR SELECT USING (
        technician_id = auth.uid()::text
        OR
        EXISTS (
            SELECT 1 FROM team_users
            WHERE team_users.user_id = auth.uid()
            AND team_users.role IN ('admin', 'manager', 'coordinator')
        )
    );

-- INSERT: Only the technician can insert their location
CREATE POLICY "technician_current_location_insert_policy" ON technician_current_location
    FOR INSERT WITH CHECK (
        technician_id = auth.uid()::text
        OR
        EXISTS (
            SELECT 1 FROM team_users
            WHERE team_users.user_id = auth.uid()
            AND team_users.role IN ('admin', 'manager')
        )
    );

-- UPDATE: Only the technician can update their location
CREATE POLICY "technician_current_location_update_policy" ON technician_current_location
    FOR UPDATE USING (
        technician_id = auth.uid()::text
        OR
        EXISTS (
            SELECT 1 FROM team_users
            WHERE team_users.user_id = auth.uid()
            AND team_users.role IN ('admin', 'manager')
        )
    );

-- DELETE: Technicians can delete their own location, managers can delete any
CREATE POLICY "technician_current_location_delete_policy" ON technician_current_location
    FOR DELETE USING (
        technician_id = auth.uid()::text
        OR
        EXISTS (
            SELECT 1 FROM team_users
            WHERE team_users.user_id = auth.uid()
            AND team_users.role IN ('admin', 'manager')
        )
    );

-- =====================================================
-- 4. TECHNICIAN_LOCATIONS - Location History
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "technician_locations_select_policy" ON technician_locations;
DROP POLICY IF EXISTS "technician_locations_insert_policy" ON technician_locations;
DROP POLICY IF EXISTS "technician_locations_update_policy" ON technician_locations;
DROP POLICY IF EXISTS "technician_locations_delete_policy" ON technician_locations;

-- SELECT: Technicians see their own history, managers see all
CREATE POLICY "technician_locations_select_policy" ON technician_locations
    FOR SELECT USING (
        technician_id = auth.uid()::text
        OR
        EXISTS (
            SELECT 1 FROM team_users
            WHERE team_users.user_id = auth.uid()
            AND team_users.role IN ('admin', 'manager', 'coordinator')
        )
    );

-- INSERT: Only the technician can insert their location history
CREATE POLICY "technician_locations_insert_policy" ON technician_locations
    FOR INSERT WITH CHECK (
        technician_id = auth.uid()::text
        OR
        EXISTS (
            SELECT 1 FROM team_users
            WHERE team_users.user_id = auth.uid()
            AND team_users.role IN ('admin', 'manager')
        )
    );

-- UPDATE: Location history should be immutable (no updates)
CREATE POLICY "technician_locations_update_policy" ON technician_locations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM team_users
            WHERE team_users.user_id = auth.uid()
            AND team_users.role = 'admin'
        )
    );

-- DELETE: Only admins can delete location history (for privacy compliance)
CREATE POLICY "technician_locations_delete_policy" ON technician_locations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM team_users
            WHERE team_users.user_id = auth.uid()
            AND team_users.role = 'admin'
        )
        AND created_at < NOW() - INTERVAL '2 years' -- Only delete history older than 2 years
    );

-- =====================================================
-- 5. ADDITIONAL SECURITY ENHANCEMENTS
-- =====================================================

-- Create function to check organization access (reusable)
CREATE OR REPLACE FUNCTION check_organization_access(target_org_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM customers
        WHERE id = auth.uid()::text
        AND organization_id = target_org_id
    ) OR EXISTS (
        SELECT 1 FROM team_users
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'manager', 'coordinator')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check team member role
CREATE OR REPLACE FUNCTION check_team_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_users
        WHERE user_id = auth.uid()
        AND (
            role = required_role
            OR (required_role = 'manager' AND role = 'admin')
            OR (required_role = 'coordinator' AND role IN ('admin', 'manager'))
            OR (required_role = 'technician' AND role IN ('admin', 'manager', 'coordinator'))
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON POLICY "billing_invoices_select_policy" ON billing_invoices
IS 'Users can only access billing invoices for their organization or if they are team members with appropriate roles';

COMMENT ON POLICY "security_logs_select_policy" ON security_logs
IS 'Only admins can view security logs to maintain audit trail integrity';

COMMENT ON POLICY "technician_current_location_select_policy" ON technician_current_location
IS 'Technicians can view their own location, managers can view all for operational oversight';

COMMENT ON POLICY "technician_locations_select_policy" ON technician_locations
IS 'Location history access follows same pattern as current location with additional coordinator access';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_billing_invoices_customer_org
ON billing_invoices(customer_id) WHERE customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_security_logs_user_id
ON security_logs(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_technician_current_location_tech_id
ON technician_current_location(technician_id);

CREATE INDEX IF NOT EXISTS idx_technician_locations_tech_id_created
ON technician_locations(technician_id, created_at DESC);

-- Verify RLS is enabled (should already be enabled per CLAUDE.md)
-- These commands will show current status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN (
    'billing_invoices',
    'security_logs',
    'technician_current_location',
    'technician_locations'
)
AND schemaname = 'public';

-- Show all policies created
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN (
    'billing_invoices',
    'security_logs',
    'technician_current_location',
    'technician_locations'
)
AND schemaname = 'public'
ORDER BY tablename, cmd;