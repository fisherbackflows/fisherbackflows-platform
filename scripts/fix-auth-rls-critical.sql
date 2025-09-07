-- CRITICAL PRODUCTION FIX: RLS Policies Blocking Authentication
-- This script fixes the service role access for customer registration and login
-- Date: 2025-01-15

-- The issue: New RLS policies created in schema-security-fix.sql are too restrictive
-- They block service role access needed for user authentication operations

-- STEP 1: Drop the overly restrictive policies that are blocking service role access
DROP POLICY IF EXISTS "customers_select" ON customers;
DROP POLICY IF EXISTS "customers_insert" ON customers;
DROP POLICY IF EXISTS "customers_update" ON customers;
DROP POLICY IF EXISTS "customers_delete" ON customers;

-- STEP 2: Create service role policies first (highest priority)
-- These MUST come first to ensure service role has full access for auth operations
CREATE POLICY "service_role_full_access" ON customers
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- STEP 3: Create user access policies that work with Supabase Auth
-- These allow authenticated users to access their own records
CREATE POLICY "users_own_data" ON customers
    FOR ALL TO authenticated
    USING (auth.uid()::text = id::text)
    WITH CHECK (auth.uid()::text = id::text);

-- STEP 4: Create admin/technician access policies
-- Allow team members to access customer data when authenticated with proper role
CREATE POLICY "team_access_customers" ON customers
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM team_users 
            WHERE team_users.supabase_user_id = auth.uid() 
            AND team_users.role IN ('admin', 'tester')
            AND team_users.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_users 
            WHERE team_users.supabase_user_id = auth.uid() 
            AND team_users.role IN ('admin', 'tester')
            AND team_users.status = 'active'
        )
    );

-- STEP 5: Verify the policies were created correctly
SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'customers'
ORDER BY policyname;

-- STEP 6: Test service role access (this should work now)
-- The service role should be able to:
-- 1. INSERT new customer records (for registration)
-- 2. SELECT customer records (for login verification)
-- 3. UPDATE customer records (for profile updates)

COMMENT ON POLICY "service_role_full_access" ON customers IS 
'CRITICAL: Service role needs full access for authentication operations (login/register)';

COMMENT ON POLICY "users_own_data" ON customers IS 
'Users can access and modify their own customer data';

COMMENT ON POLICY "team_access_customers" ON customers IS 
'Team members (admin/tester roles) can access all customer data';